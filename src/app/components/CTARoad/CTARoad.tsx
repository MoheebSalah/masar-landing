"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import CTAButton from "./CTAButton";
import CTARoadMobile from "./CTARoadMobile";

gsap.registerPlugin(ScrollTrigger);

// One road, drawn right-to-left (reading direction): it starts where damage
// is detected, passes the repair and the proof — the platform's three
// statuses — and stops just short of the demo button, which sits ahead of it
// as the destination of the whole page.
const ROAD_PATH =
  "M 1180 180 C 1010 180 970 96 810 96 C 650 96 640 180 470 180 C 400 180 340 180 280 180";

export default function CTARoad() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    // Reduced motion: markup already sits in its final state; skipping the
    // tweens (and the CSS dash march, see globals.css) is all that's needed.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: section, start: "top 70%", once: true },
        defaults: { ease: "power2.out" },
      });
      tl.from(".cta-road-copy", { y: 40, opacity: 0, duration: 0.6 }, 0);

      // 1. The asphalt is wiped in first, right→left. A clip wipe (rather than a
      //    round-capped dash draw) keeps it smooth — no dot popping in at the
      //    start and no end-cap snapping in at the finish.
      tl.fromTo(
        ".road-surface-rect",
        { attr: { x: 1200, width: 0 } },
        { attr: { x: 240, width: 960 }, duration: 0.9, ease: "power2.inOut" },
        0.25,
      );

      // 2. The lane lines are then wiped in along the road from the right
      //    (start) to the end. The reveal rect stays anchored at the right
      //    edge (width tracks its left edge) so the dashes appear in order;
      //    the CSS dash-march keeps running underneath the whole time.
      const revealStart = 1.15;
      const revealDur = 1.0;
      tl.fromTo(
        ".road-reveal-rect",
        { attr: { x: 1200, width: 0 } },
        { attr: { x: 240, width: 960 }, duration: revealDur, ease: "none" },
        revealStart,
      );

      // Each status stop pops exactly as the wipe reaches its spot on the road.
      const markerAt = (x: number) =>
        revealStart + ((1200 - x) / 960) * revealDur;
      const popMarker = (id: string, x: number) =>
        tl.from(
          id,
          {
            scale: 0,
            transformOrigin: "50% 50%",
            duration: 0.45,
            ease: "back.out(2.5)",
          },
          markerAt(x),
        );
      popMarker("#road-marker-detect", 1120);
      popMarker("#road-marker-repair", 810);
      popMarker("#road-marker-proof", 470);

      // 3. Once the road is fully laid, the demo button arrives at the end.
      tl.from(
        ".road-cta",
        { opacity: 0, scale: 0.85, duration: 0.5, ease: "back.out(1.8)" },
        revealStart + revealDur,
      );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="cta-road"
      className="relative z-10 -mb-8 w-full overflow-hidden rounded-b-brand bg-background py-28"
    >
      <div className="px-6 md:px-32">
        <div className="cta-road-copy text-center">
          <h2 className="font-heading text-h3 text-text md:text-heading">
            الطريق إلى شوارع أفضل{" "}
            <span className="text-primary">يبدأ من هنا</span>
          </h2>
          <p className="mt-4 font-sans text-t3 leading-relaxed text-subtext md:mt-6 md:text-t1">
            عرض حيّ قصير نطبّقه على واقع مدينتكم — من رصد الأضرار حتى إثبات
            الإصلاح.
          </p>
        </div>

        {/* Phones stand the same road upright (top → bottom), and lay it as
            the visitor scrolls — the section holds them for one screen. */}
        <CTARoadMobile sectionRef={sectionRef} />

        {/* The signature: a road from detection to the booking button */}
        <div className="relative mt-8 hidden md:block">
          <svg
            viewBox="0 0 1200 260"
            className="w-full"
            fill="none"
            aria-hidden="true"
          >
            {/* Each layer is revealed through its own wipe rect: GSAP opens it
                from the right edge leftward. Default full-open so reduced-motion
                (which skips the tweens) shows everything. */}
            <defs>
              <clipPath id="road-surface-reveal" clipPathUnits="userSpaceOnUse">
                <rect className="road-surface-rect" x={0} y={0} width={1200} height={260} />
              </clipPath>
              <clipPath id="road-reveal" clipPathUnits="userSpaceOnUse">
                <rect className="road-reveal-rect" x={0} y={0} width={1200} height={260} />
              </clipPath>
            </defs>

            {/* Asphalt — wiped in smoothly via its reveal clip */}
            <path
              d={ROAD_PATH}
              className="road-surface stroke-text"
              strokeWidth={34}
              strokeLinecap="round"
              clipPath="url(#road-surface-reveal)"
            />
            {/* Lane dashes — march toward the button (see globals.css), wiped
                in along the road via the reveal clip. */}
            <path
              d={ROAD_PATH}
              strokeDasharray="14 22"
              className="road-centerline road-dash stroke-text-dark"
              strokeWidth={3}
              clipPath="url(#road-reveal)"
            />

            {/* رصد — where the damage is detected */}
            <g id="road-marker-detect" className="road-marker">
              <circle cx={1120} cy={180} r={18} className="fill-negative/25" />
              <circle cx={1120} cy={180} r={8} className="fill-negative" />
              <text
                x={1120}
                y={232}
                textAnchor="middle"
                className="fill-subtext font-sans text-t4 font-bold"
              >
                رصد الأضرار
              </text>
            </g>

            {/* الإصلاح — the crest of the road */}
            <g id="road-marker-repair" className="road-marker">
              <circle cx={810} cy={96} r={18} className="fill-notice/25" />
              <circle cx={810} cy={96} r={8} className="fill-notice" />
              <text
                x={810}
                y={56}
                textAnchor="middle"
                className="fill-subtext font-sans text-t4 font-bold"
              >
                الإصلاح
              </text>
            </g>

            {/* إثبات الإصلاح — the last stop before the destination */}
            <g id="road-marker-proof" className="road-marker">
              <circle cx={470} cy={180} r={18} className="fill-success/25" />
              <circle cx={470} cy={180} r={8} className="fill-success" />
              <text
                x={470}
                y={232}
                textAnchor="middle"
                className="fill-subtext font-sans text-t4 font-bold"
              >
                إثبات الإصلاح
              </text>
            </g>
          </svg>

          {/* The destination — the road runs straight into the button.
              GSAP animates the transition-free wrapper; the anchor keeps the
              CSS hover transitions (mixing both on one element lets the
              hover transition hijack the entrance tween). */}
          <div className="absolute left-[14.17%] top-[69.2%] -translate-x-1/2 -translate-y-1/2">
            <div className="road-cta">
              <CTAButton />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
