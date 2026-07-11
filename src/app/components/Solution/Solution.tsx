"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Blueprint from "./Blueprint";

gsap.registerPlugin(ScrollTrigger);

// The five frames of the story: pothole detected → fixed.
// Ordered by the numbering in their file names.
const FRAMES = [
  "/assets/Solution/Light/Frame%201.png",
  "/assets/Solution/Light/Frame%202.png",
  "/assets/Solution/Light/Frame%203.png",
  "/assets/Solution/Light/Frame%204.png",
  "/assets/Solution/Light/Frame%205.png",
];

export default function Solution() {
  const sectionRef = useRef<HTMLElement>(null);
  const frameRefs = useRef<(HTMLImageElement | null)[]>([]);
  const rightRef = useRef<HTMLSpanElement>(null);
  const leftRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      const frames = frameRefs.current.filter(Boolean) as HTMLImageElement[];

      // How far apart the two sentence halves start, relative to the viewport.
      const offset = window.innerWidth * 0.3;

      // The first frame is always visible underneath; the rest fade in on top.
      gsap.set(frames.slice(1), { opacity: 0 });
      gsap.set(rightRef.current, { x: offset });
      gsap.set(leftRef.current, { x: -offset });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top", // begins once the section fills the screen
          end: "+=300%", // three viewport-heights of scroll drive the scene
          pin: true,
          scrub: 1, // smooth, scroll-tied progress
        },
      });

      // The two halves glide toward each other across the whole scroll.
      tl.to(rightRef.current, { x: 0, ease: "none", duration: 4 }, 0);
      tl.to(leftRef.current, { x: 0, ease: "none", duration: 4 }, 0);

      // The gap between the halves shrinks linearly from 2*offset to 0 over the
      // x tweens (duration 4). Just before they meet — when the gap reaches
      // 250px — flip the text from primary to white.
      const gapThreshold = 250;
      const timeAtThreshold = (1 - gapThreshold / (2 * offset)) * 4;
      gsap.set(textRef.current, { color: "#34A8D8" });
      tl.to(
        textRef.current,
        { color: "#F7F8F7", ease: "none", duration: 0.6 },
        Math.max(0, timeAtThreshold - 0.6)
      );

      // Crossfade through the frames, one transition per scroll segment.
      frames.slice(1).forEach((frame, i) => {
        tl.to(frame, { opacity: 1, ease: "none", duration: 1 }, i);
      });

      // Over the last stretch of the pinned scroll, blend this section's own
      // background from light (#EEEAE0) to the Workflow section's dark
      // (#0E1312). Because the darkening happens while still inside Solution,
      // the two sections read as one continuous background — the dark
      // Workflow simply picks up where Solution left off, with no hard seam.
      tl.to(
        section,
        { backgroundColor: "#0E1312", ease: "none", duration: 1.3 },
        2.7
      );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="solution"
      className="relative h-screen w-full overflow-hidden bg-background"
    >
      {/* Animated construction blueprint behind everything */}
      <Blueprint />

      {/* Frame stack — centered block of street */}
      {FRAMES.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src}
          ref={(el) => {
            frameRefs.current[i] = el;
          }}
          src={src}
          alt=""
          aria-hidden="true"
          className="absolute left-1/2 top-1/2 z-1 h-auto w-[64%] max-w-250 -translate-x-1/2 -translate-y-1/2"
        />
      ))}

      {/* Converging sentence */}
      <div className="absolute inset-0 z-10 flex items-center justify-center">
        <div
          ref={textRef}
          className="flex items-center gap-[0.35em] font-heading text-[3rem] text-primary md:text-[5rem] lg:text-[6rem]"
        >
          <span ref={rightRef} className="whitespace-nowrap">
            مسار يغلق
          </span>
          <span ref={leftRef} className="whitespace-nowrap">
            هذه الفجوة
          </span>
        </div>
      </div>
    </section>
  );
}
