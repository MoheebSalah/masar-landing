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

export default function Impact() {
  const sectionRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<ScrollTrigger | null>(null);
  // Which stat is on screen (0…N-1); driven by the sticky scroll position.
  const [step, setStep] = useState(0);

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
          const idx = Math.min(N - 1, Math.floor(self.progress * N));
          setStep((prev) => (prev === idx ? prev : idx));
        },
      });
    }, section);

    return () => ctx.revert();
  }, []);

  // Jump to the middle of stat `i`'s scroll segment so it lands on that number.
  const scrollToStep = (i: number) => {
    const st = triggerRef.current;
    if (!st) return;
    const target = st.start + ((i + 0.5) / N) * (st.end - st.start);
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(target, { duration: 1 });
    else window.scrollTo({ top: target, behavior: "smooth" });
  };

  const stat = STATS[step];

  return (
    <section
      ref={sectionRef}
      id="impact"
      /* h-[600vh] == 1.5 viewports of scroll per stat (STATS has 4). The sticky
         panel inside holds the number in place while these 4 screens pass. */
      className="relative h-[600vh] w-full bg-background"
    >
      <div className="sticky top-0 flex h-screen flex-col items-center justify-center">
        {/* Content column matches the showcase width; everything is anchored to
            its right (start) edge so the number and bullet share a right edge. */}
        <div className="w-full max-w-375 px-8">
          {/* Eyebrow — quiet context above the number */}
          <p className="mb-6 font-sans text-t2 text-subtext">
            أرقامٌ تعكس أثراً ملموساً
          </p>

          {/* The giant odometer number, pinned to the start (right) edge */}
          <div className="flex">
            <OdometerNumber
              value={stat.value}
              prefix={stat.prefix}
              suffix={stat.suffix}
              step={step}
            />
          </div>

          {/* Bullet + title, sharing the number's right edge (bullet first, so
              in RTL it sits on the right with the title flowing left). */}
          <div className="mt-6 flex items-center gap-5">
            <ArrowBullet className="h-10 w-auto shrink-0 text-primary" />
            <RollingTitle title={stat.title} step={step} />
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
