"use client";

import { useEffect, useRef, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import CTAButton from "./CTAButton";
import { getLenis } from "../SmoothScroll/lenisInstance";

gsap.registerPlugin(ScrollTrigger);

// The same road as the desktop version, stood upright for phones: it runs top
// (where damage is detected) to bottom (the demo button), passing the repair
// and the proof. The reveal wipes downward and the button waits at the end.
const ROAD_PATH =
  "M 235 50 C 235 150 150 165 150 260 C 150 355 235 370 235 470 C 235 545 175 555 175 620";
const VB_H = 660; // viewBox height — the wipe travels this far

export default function CTARoadMobile({
  sectionRef,
}: {
  sectionRef: RefObject<HTMLElement | null>;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  // The catch is a one-time event for the whole visit: once the road has been
  // laid, scrolling back up through the section must never grab hold again.
  const playedRef = useRef(false);

  useEffect(() => {
    const root = rootRef.current;
    const section = sectionRef.current;
    if (!root || !section) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const mm = gsap.matchMedia();

    // Phones: the section catches the visitor, and their own scrolling is what
    // lays the road. When the last beat lands the pin lets go for good.
    mm.add("(max-width: 767px)", () => {
      if (playedRef.current) return;

      const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

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

      // The section is a little taller than a phone screen, so it is held at
      // its centre — that keeps the heading, the whole road and the button on
      // screen for the length of the scene.
      const st = ScrollTrigger.create({
        trigger: section,
        start: "center center",
        end: "+=160%", // how much scrolling it takes to lay the whole road
        pin: true,
        pinSpacing: true,
        anticipatePin: 1,
        scrub: true, // progress is the visitor's scroll, nothing else
        animation: tl,
        onLeave: () => release(),
      });

      // Letting go. Dropping the trigger also drops the spacer it inserted for
      // the pin, so the page shortens and everything below it slides up. We
      // measure how far the section actually moved and take exactly that much
      // out of the scroll position in the same frame, so the view does not
      // budge — the visitor only notices that nothing is holding them any
      // more. Reverting the trigger restores the markup's authored state,
      // which is the finished road, so the section stays fully drawn.
      const release = () => {
        if (playedRef.current) return;
        playedRef.current = true;

        // Deferred a frame: tearing a trigger down inside its own callback
        // runs while ScrollTrigger is still mid-update.
        requestAnimationFrame(() => {
          const lenis = getLenis();
          const before = section.getBoundingClientRect().top;

          st.kill(true, true); // drop the pin, keep the road as drawn
          // Both of these have to happen before the scroll is corrected:
          // refresh() puts the scroll back where it recorded it, which would
          // undo the correction if we applied it first.
          lenis?.resize();
          ScrollTrigger.refresh();

          const shift = section.getBoundingClientRect().top - before;
          const target = Math.max(0, window.scrollY + shift);

          if (lenis) {
            // Lenis interpolates from its own internal value, so nudging its
            // position fields does nothing — the jump has to go through
            // scrollTo, which resets its velocity. Whatever travel it still
            // had queued is therefore re-issued from the new spot, so a flick
            // that is mid-flight carries on instead of stopping dead here.
            const carry = lenis.targetScroll - lenis.animatedScroll;
            lenis.scrollTo(target, { immediate: true, force: true });
            if (Math.abs(carry) > 1) lenis.scrollTo(target + carry, { force: true });
          } else {
            window.scrollTo(0, target);
          }
        });
      };
    });

    return () => mm.revert();
  }, [sectionRef]);

  return (
    <div ref={rootRef} className="mt-8 flex flex-col items-center md:hidden">
      {/* The height cap is what makes the held scene work on a short phone:
          the heading, the whole road and the button all have to be on screen
          at once, so the road gives way rather than pushing them off. */}
      <svg
        viewBox={`0 0 340 ${VB_H}`}
        className="w-full max-w-sm max-h-[calc(100svh-12rem)]"
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
