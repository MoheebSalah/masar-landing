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

// Above this scroll speed (px/s) the shown number is left untouched: a fast
// flick (or a flick that passes straight through the section) crosses stats
// faster than the 0.75s roll can finish, so instead of a mush of half-settled
// reels the current number simply holds. Once the scroll slows below this, the
// stat under the panel rolls in cleanly — i.e. the roll only plays on settle.
const FAST_SCROLL_VELOCITY = 1800;

export default function Impact() {
  const sectionRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<ScrollTrigger | null>(null);
  const eyebrowRef = useRef<HTMLParagraphElement>(null);
  const bulletRowRef = useRef<HTMLDivElement>(null);
  // True while a stat-dot click is scrolling programmatically, so the velocity
  // gate is bypassed and that deliberate jump always rolls to its stat.
  const navigatingRef = useRef(false);
  // Which stat is on screen (0…N-1); driven by the sticky scroll position, but
  // only advanced while the scroll is slow enough to settle (see onUpdate).
  const [step, setStep] = useState(0);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      // Desktop only: the section is a tall track (one viewport per stat) with a
      // sticky inner panel doing the visual pinning via CSS. This trigger only
      // *reads* the scroll progress — no GSAP pin — and as progress crosses each
      // 1/N threshold, `step` advances so the number and title play their swaps.
      // On phones there is no track at all: the stats are navigated directly by
      // swipe / indicator tap, so no scroll-driven trigger is created.
      const mm = gsap.matchMedia();
      mm.add("(min-width: 768px)", () => {
        triggerRef.current = ScrollTrigger.create({
          trigger: section,
          start: "top top",
          end: "bottom bottom",
          onUpdate: (self) => {
            if (navigatingRef.current) return;
            // Scrolling too fast to settle (a flick, or a jump passing straight
            // through the section): hold the current number, no roll.
            if (Math.abs(self.getVelocity()) > FAST_SCROLL_VELOCITY) return;
            const idx = Math.min(N - 1, Math.floor(self.progress * N));
            setStep((prev) => (prev === idx ? prev : idx));
          },
        });
        return () => {
          triggerRef.current = null;
        };
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
  // The stat rolls in right away and the velocity-gated scroll updates are muted
  // for the trip, so this deliberate click always plays a clean roll to `i`
  // instead of the fast programmatic scroll being treated as an unsettled flick.
  const scrollToStep = (i: number) => {
    const st = triggerRef.current;
    if (!st) return;
    const target = st.start + ((i + 0.5) / N) * (st.end - st.start);
    navigatingRef.current = true;
    setStep((prev) => (prev === i ? prev : i));
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

  const isMobile = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(max-width: 767px)").matches;

  // Indicator tap. On phones there is no scroll track, so just flip the stat in
  // place; on desktop, scroll to the stat's segment (which then rolls it in).
  const selectStat = (i: number) => {
    if (isMobile()) {
      setStep((prev) => (prev === i ? prev : i));
      return;
    }
    scrollToStep(i);
  };

  // Phone-only left/right swipe to move between stats (wraps around the ends).
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    if (!isMobile()) return;
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    // Only a mostly-horizontal drag navigates; vertical scroll is left alone.
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
      const dir = dx < 0 ? 1 : -1; // swipe left → next stat
      setStep((prev) => (prev + dir + N) % N);
    }
  };

  const stat = STATS[step];

  return (
    <section
      ref={sectionRef}
      id="impact"
      /* Desktop: h-[520vh] == 1.3 viewports of scroll per stat (STATS has 4), the
         sticky panel holding the number in place while the stats pass.
         Mobile: no scroll track — the section is just tall enough for its content
         (well under a screen) and the stats are swipe / tap navigated. */
      className="relative h-[520vh] w-full bg-background max-md:h-auto"
    >
      {/* translateZ promotes the pinned panel to its own layer on phones, so the
          giant sticky number no longer shimmers against Lenis' sub-pixel scroll. */}
      <div
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className="sticky top-0 flex h-screen flex-col items-center justify-center max-md:static max-md:h-auto max-md:py-24 max-md:[transform:translateZ(0)]"
      >
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
            />
          </div>

          {/* Bullet + title, sharing the number's right edge (bullet first, so
              in RTL it sits on the right with the title flowing left). */}
          <div ref={bulletRowRef} className="mt-6 flex items-center gap-5 max-md:mt-4 max-md:gap-3">
            <ArrowBullet className="h-10 w-auto shrink-0 text-primary max-md:h-7" />
            <RollingTitle title={stat.title} step={step} />
          </div>
        </div>

        {/* Clickable progress indicator: vertical on the right edge for desktop;
            on phones it sits in the normal flow just below the content, a short
            horizontal row (no longer floating at the far bottom of the screen). */}
        <div className="absolute right-10 top-1/2 flex -translate-y-1/2 flex-col items-center gap-3 max-md:static max-md:mt-10 max-md:translate-x-0 max-md:translate-y-0 max-md:flex-row max-md:gap-4">
          {STATS.map((s, i) => (
            <button
              key={s.title}
              type="button"
              onClick={() => selectStat(i)}
              aria-label={s.title}
              className={`cursor-pointer rounded-full transition-all duration-300 ${
                i === step
                  ? "h-9 w-2.5 bg-primary max-md:h-2.5 max-md:w-9"
                  : "h-2.5 w-2.5 bg-muted hover:bg-light"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
