"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { getLenis } from "../SmoothScroll/lenisInstance";
import ArrowBullet from "./ArrowBullet";
import OdometerNumber from "./OdometerNumber";
import RollingTitle from "./RollingTitle";

gsap.registerPlugin(ScrollTrigger);

// The headline numbers, shown one at a time in scroll order.
const STATS = [
  { value: 5400, prefix: "+", suffix: "", title: "حفرة تم رصدها" },
  { value: 60, prefix: "-", suffix: "%", title: "انخفاض في وقت الاستجابة" },
  { value: 3200, prefix: "+", suffix: "", title: "حالة تم إصلاحها" },
  { value: 90, prefix: "+", suffix: "%", title: "من المواطنين تم إشعارهم" },
];
const N = STATS.length;

// Above this scroll speed (px/s) a step change snaps instantly instead of
// rolling. A flick crosses a stat's ~1.5-viewport segment faster than the 0.75s
// roll can finish, so animating each intermediate step just produces a mush of
// half-settled reels — snapping keeps the landed number correct and clean.
const FAST_SCROLL_VELOCITY = 4000;

export default function Impact() {
  const sectionRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<ScrollTrigger | null>(null);
  const eyebrowRef = useRef<HTMLParagraphElement>(null);
  const bulletRowRef = useRef<HTMLDivElement>(null);
  // True while a navigator click is scrolling programmatically, so the
  // scroll-driven step updates are ignored and the click's single roll stands.
  const navigatingRef = useRef(false);
  // Which stat is on screen (0…N-1), plus whether the last change came from a
  // fast scroll (then the number/title snap instead of rolling). Driven by the
  // sticky scroll position.
  const [{ step, instant }, setStat] = useState({ step: 0, instant: false });

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      // The section is a tall track (one viewport per stat) with a sticky inner
      // panel doing the visual pinning via CSS. This trigger only *reads* the
      // scroll progress — no GSAP pin, so nothing wraps the section and it stays
      // safe to re-render on every step. As progress crosses each 1/N
      // threshold, `step` advances and the number and title play their swaps.
      triggerRef.current = ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          if (navigatingRef.current) return;
          const idx = Math.min(N - 1, Math.floor(self.progress * N));
          const snap = Math.abs(self.getVelocity()) > FAST_SCROLL_VELOCITY;
          setStat((prev) =>
            prev.step === idx ? prev : { step: idx, instant: snap }
          );
        },
      });
    }, section);

    return () => ctx.revert();
  }, []);

  // As the section first arrives, the eyebrow rises in and the bullet + its
  // arrow slide in from the right, alongside the number counting up.
  useEffect(() => {
    const section = sectionRef.current;
    const eyebrow = eyebrowRef.current;
    const bulletRow = bulletRowRef.current;
    if (!section || !eyebrow || !bulletRow) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      gsap.set(eyebrow, { autoAlpha: 0, y: 24 });
      gsap.set(bulletRow, { autoAlpha: 0, x: 90 });

      const tl = gsap.timeline({
        scrollTrigger: { trigger: section, start: "top 20%", once: true },
      });
      tl.to(eyebrow, { autoAlpha: 1, y: 0, duration: 0.7, ease: "power3.out" }, 0)
        .to(
          bulletRow,
          { autoAlpha: 1, x: 0, duration: 0.8, ease: "power3.out" },
          0.2
        );
    }, section);

    return () => ctx.revert();
  }, []);

  // Jump to the middle of stat `i`'s scroll segment so it lands on that number.
  // The odometer is rolled to `i` right away and the scroll-driven updates are
  // muted for the trip, so the click plays one clean roll to the target instead
  // of the fast programmatic scroll snapping through the segments in between.
  const scrollToStep = (i: number) => {
    const st = triggerRef.current;
    if (!st) return;
    const target = st.start + ((i + 0.5) / N) * (st.end - st.start);
    navigatingRef.current = true;
    setStat((prev) => (prev.step === i ? prev : { step: i, instant: false }));
    const done = () => {
      navigatingRef.current = false;
    };
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(target, { duration: 1, onComplete: done });
    else {
      window.scrollTo({ top: target, behavior: "smooth" });
      setTimeout(done, 1000);
    }
  };

  const stat = STATS[step];

  return (
    <section
      ref={sectionRef}
      id="impact"
      /* h-[400vh] == 1 viewport of scroll per stat (STATS has 4). The sticky
         panel inside holds the number in place while these 4 screens pass. */
      className="relative h-[400vh] w-full bg-background"
    >
      <div className="sticky top-0 flex h-screen flex-col items-center justify-center">
        {/* Content column matches the showcase width; everything is anchored to
            its right (start) edge so the number and bullet share a right edge. */}
        <div className="w-full max-w-375 px-8">
          {/* Eyebrow — quiet context above the number */}
          <p ref={eyebrowRef} className="mb-6 font-sans text-t2 text-subtext">
            أرقامٌ تعكس أثراً ملموساً
          </p>

          {/* The giant odometer number, pinned to the start (right) edge */}
          <div className="flex">
            <OdometerNumber
              value={stat.value}
              prefix={stat.prefix}
              suffix={stat.suffix}
              step={step}
              instant={instant}
            />
          </div>

          {/* Bullet + title, sharing the number's right edge (bullet first, so
              in RTL it sits on the right with the title flowing left). */}
          <div ref={bulletRowRef} className="mt-6 flex items-center gap-5">
            <ArrowBullet className="h-10 w-auto shrink-0 text-primary" />
            <RollingTitle title={stat.title} step={step} instant={instant} />
          </div>
        </div>

        {/* Vertical, clickable progress indicator on the right edge */}
        <div className="absolute right-10 top-1/2 flex -translate-y-1/2 flex-col items-center gap-3">
          {STATS.map((s, i) => (
            <button
              key={s.title}
              type="button"
              onClick={() => scrollToStep(i)}
              aria-label={s.title}
              className={`w-2.5 cursor-pointer rounded-full transition-all duration-300 ${
                i === step ? "h-9 bg-primary" : "h-2.5 bg-muted hover:bg-light"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
