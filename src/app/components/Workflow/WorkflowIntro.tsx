"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Intro imagery for the Workflow section: two phone mockups pinned to the far
 * left and right, with the arrow path (see Workflow.tsx) threading straight
 * down the middle between them. No text — purely visual scene-setting.
 *
 * Both images drift vertically on scroll (parallax) at different rates so they
 * read as separate depth layers rather than one flat pair.
 */
export default function WorkflowIntro() {
  const rowRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;

    const ctx = gsap.context(() => {
      const trigger = {
        trigger: row,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      };

      // The left image is the deeper, faster layer; the right one trails it.
      gsap.fromTo(
        leftRef.current,
        { y: 190 },
        { y: -190, ease: "none", scrollTrigger: trigger }
      );
      gsap.fromTo(
        rightRef.current,
        { y: 110 },
        { y: -110, ease: "none", scrollTrigger: trigger }
      );
    }, row);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={rowRef} className="flex h-150 w-full items-center justify-between">
      <div ref={leftRef}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/Workflow/Workflow%200%20-%202.png"
          alt=""
          aria-hidden="true"
          className="h-78 w-130 rounded-2xl object-cover shadow-[0_16px_40px_rgba(14,19,18,0.45)]"
        />
      </div>

      <div ref={rightRef}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/Workflow/Workflow%200%20-%201.png"
          alt=""
          aria-hidden="true"
          className="h-112 w-110 rounded-2xl object-cover shadow-[0_16px_40px_rgba(14,19,18,0.45)]"
        />
      </div>
    </div>
  );
}
