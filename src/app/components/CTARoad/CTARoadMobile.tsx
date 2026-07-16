"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import CTAButton from "./CTAButton";

gsap.registerPlugin(ScrollTrigger);

// The same road as the desktop version, stood upright for phones: it runs top
// (where damage is detected) to bottom (the demo button), passing the repair
// and the proof. The reveal wipes downward and the button waits at the end.
const ROAD_PATH =
  "M 235 50 C 235 150 150 165 150 260 C 150 355 235 370 235 470 C 235 545 175 555 175 620";
const VB_H = 660; // viewBox height — the wipe travels this far

export default function CTARoadMobile() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: root, start: "top 75%", once: true },
        defaults: { ease: "power2.out" },
      });

      // 1. The asphalt is wiped in from the top down (a clip rect growing its
      //    height), so it lays smoothly toward the button.
      tl.fromTo(
        ".mroad-surface-rect",
        { attr: { y: 0, height: 0 } },
        { attr: { y: 0, height: VB_H }, duration: 0.9, ease: "power2.inOut" },
        0.25,
      );

      // 2. The lane lines follow along the road from the top; the CSS dash-march
      //    keeps running underneath.
      const revealStart = 1.15;
      const revealDur = 1.0;
      tl.fromTo(
        ".mroad-reveal-rect",
        { attr: { y: 0, height: 0 } },
        { attr: { y: 0, height: VB_H }, duration: revealDur, ease: "none" },
        revealStart,
      );

      // Each status stop pops exactly as the downward wipe reaches its spot.
      const markerAt = (y: number) => revealStart + (y / VB_H) * revealDur;
      const popMarker = (id: string, y: number) =>
        tl.from(
          id,
          { scale: 0, transformOrigin: "50% 50%", duration: 0.45, ease: "back.out(2.5)" },
          markerAt(y),
        );
      popMarker("#mroad-detect", 50);
      popMarker("#mroad-repair", 260);
      popMarker("#mroad-proof", 470);

      // 3. Once the road has landed, the button arrives at the bottom.
      tl.from(
        ".mroad-cta",
        { opacity: 0, scale: 0.85, duration: 0.5, ease: "back.out(1.8)" },
        revealStart + revealDur,
      );
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={rootRef} className="mt-8 flex flex-col items-center md:hidden">
      <svg
        viewBox={`0 0 340 ${VB_H}`}
        className="w-full max-w-sm"
        fill="none"
        aria-hidden="true"
      >
        <defs>
          <clipPath id="mroad-surface-reveal" clipPathUnits="userSpaceOnUse">
            <rect className="mroad-surface-rect" x={0} y={0} width={340} height={VB_H} />
          </clipPath>
          <clipPath id="mroad-reveal" clipPathUnits="userSpaceOnUse">
            <rect className="mroad-reveal-rect" x={0} y={0} width={340} height={VB_H} />
          </clipPath>
        </defs>

        {/* Asphalt */}
        <path
          d={ROAD_PATH}
          className="stroke-text"
          strokeWidth={34}
          strokeLinecap="round"
          clipPath="url(#mroad-surface-reveal)"
        />
        {/* Lane dashes — march toward the button (see globals.css) */}
        <path
          d={ROAD_PATH}
          strokeDasharray="14 22"
          className="road-dash stroke-text-dark"
          strokeWidth={3}
          clipPath="url(#mroad-reveal)"
        />

        {/* رصد — where the damage is detected */}
        <g id="mroad-detect">
          <circle cx={235} cy={50} r={18} className="fill-negative/25" />
          <circle cx={235} cy={50} r={8} className="fill-negative" />
          <text
            x={205}
            y={56}
            textAnchor="end"
            className="fill-subtext font-sans text-t5 font-bold [direction:ltr]"
          >
            رصد الأضرار
          </text>
        </g>

        {/* الإصلاح — the bend of the road */}
        <g id="mroad-repair">
          <circle cx={150} cy={260} r={18} className="fill-notice/25" />
          <circle cx={150} cy={260} r={8} className="fill-notice" />
          <text
            x={120}
            y={266}
            textAnchor="end"
            className="fill-subtext font-sans text-t5 font-bold [direction:ltr]"
          >
            الإصلاح
          </text>
        </g>

        {/* إثبات الإصلاح — the last stop before the destination */}
        <g id="mroad-proof">
          <circle cx={235} cy={470} r={18} className="fill-success/25" />
          <circle cx={235} cy={470} r={8} className="fill-success" />
          <text
            x={205}
            y={476}
            textAnchor="end"
            className="fill-subtext font-sans text-t5 font-bold [direction:ltr]"
          >
            إثبات الإصلاح
          </text>
        </g>
      </svg>

      {/* The destination — centred just below the road. */}
      <div className="mroad-cta -mt-4">
        <CTAButton />
      </div>
    </div>
  );
}
