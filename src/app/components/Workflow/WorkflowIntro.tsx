"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { blurReveal } from "./blurReveal";

gsap.registerPlugin(ScrollTrigger);

/**
 * Intro row for the Workflow section: two phone mockups pushed to the far left
 * and right, with the section title centred in the wide gap between them and
 * the arrow path (see Workflow.tsx) threading down that same gap.
 *
 * Everything here drifts vertically on scroll (parallax) — the images and the
 * title all at the strong "hero" rate (unlike the gentler step text) — and
 * each element blurs into focus as it scrolls into view.
 */
export default function WorkflowIntro() {
  const rowRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;

    const ctx = gsap.context(() => {
      const parallax = {
        trigger: row,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      };

      // The left image is the deeper, faster layer; the right one trails it.
      gsap.fromTo(
        leftRef.current,
        { y: 190 },
        { y: -190, ease: "none", scrollTrigger: parallax }
      );
      gsap.fromTo(
        rightRef.current,
        { y: 110 },
        { y: -110, ease: "none", scrollTrigger: parallax }
      );

      // The title is absolutely centred (xPercent/yPercent hold the centring);
      // its parallax `y` rides on top of that, at the same strong rate as the
      // images rather than the gentle rate used for the step copy.
      gsap.set(titleRef.current, { xPercent: -50, yPercent: -50 });
      gsap.fromTo(
        titleRef.current,
        { y: 150 },
        { y: -150, ease: "none", scrollTrigger: parallax }
      );

      // Each element blurs into focus as the row scrolls in.
      [leftRef.current, rightRef.current, titleRef.current].forEach((el) => {
        if (el) blurReveal(el, row);
      });
    }, row);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={rowRef}
      className="relative flex h-150 w-full items-center justify-between"
    >
      <div ref={leftRef}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/Workflow/Workflow%200%20-%202.webp"
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          className="h-62 w-110 rounded-2xl object-cover shadow-[0_16px_40px_rgba(14,19,18,0.45)]"
        />
      </div>

      <h2
        ref={titleRef}
        dir="rtl"
        className="absolute left-1/2 top-1/2 w-95 text-center font-heading text-h2 text-text-dark"
      >
        كيف تسير عملية اكتشاف الحفر ؟
      </h2>

      <div ref={rightRef}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/Workflow/Workflow%200%20-%201.webp"
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          className="h-90 w-95 rounded-2xl object-cover shadow-[0_16px_40px_rgba(14,19,18,0.45)]"
        />
      </div>
    </div>
  );
}
