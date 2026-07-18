"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Blueprint from "./Blueprint";

gsap.registerPlugin(ScrollTrigger);

// The five frames of the story: pothole detected → fixed.
// Ordered by the numbering in their file names.
const FRAMES = [
  "/assets/Solution/Light/Frame%201.webp",
  "/assets/Solution/Light/Frame%202.webp",
  "/assets/Solution/Light/Frame%203.webp",
  "/assets/Solution/Light/Frame%204.webp",
  "/assets/Solution/Light/Frame%205.webp",
];

export default function Solution() {
  const sectionRef = useRef<HTMLElement>(null);
  const frameRefs = useRef<(HTMLImageElement | null)[]>([]);
  const rightRef = useRef<HTMLSpanElement>(null);
  const leftRef = useRef<HTMLSpanElement>(null);
  const rightSlideRef = useRef<HTMLSpanElement>(null);
  const leftSlideRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const mm = gsap.matchMedia();

    // Desktop: the two halves converge into a single line over three
    // viewport-heights of pinned scroll while the frames crossfade.
    mm.add("(min-width: 768px)", () => {
      const frames = frameRefs.current.filter(Boolean) as HTMLImageElement[];

      // How far apart the two sentence halves start, relative to the viewport.
      const offset = window.innerWidth * 0.3;

      // The first frame is always visible underneath; the rest fade in on top.
      gsap.set(frames.slice(1), { opacity: 0 });
      gsap.set(rightRef.current, { x: offset });
      gsap.set(leftRef.current, { x: -offset });

      // Entrance: as the section scrolls into view, the first frame fades up
      // and each sentence half slides in from its own edge — the right half
      // travels in from the right, the left half from the left — then settles.
      // The slide lives on the wrapper spans so it composes cleanly with the
      // scrubbed convergence that the inner spans (rightRef/leftRef) drive.
      const slideIn = window.innerWidth * 0.35;
      gsap.set(frames[0], { autoAlpha: 0 });
      gsap.set(rightSlideRef.current, { autoAlpha: 0, x: slideIn });
      gsap.set(leftSlideRef.current, { autoAlpha: 0, x: -slideIn });
      ScrollTrigger.create({
        trigger: section,
        start: "top 70%",
        once: true,
        onEnter: () => {
          gsap.to(frames[0], { autoAlpha: 1, duration: 0.9, ease: "power2.out" });
          gsap.to([rightSlideRef.current, leftSlideRef.current], {
            autoAlpha: 1,
            x: 0,
            duration: 1,
            ease: "power3.out",
          });
        },
      });

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
    });

    // Mobile: the phone is too narrow for the halves to sit side by side, so
    // they settle stacked on two lines. Each line starts fully off-screen (the
    // width can't show them yet) and glides to the centre while fading in, over
    // a shorter pinned scroll than the desktop's. The frames still crossfade
    // and the background still darkens into Workflow.
    mm.add("(max-width: 767px)", () => {
      const frames = frameRefs.current.filter(Boolean) as HTMLImageElement[];

      // Start each line a full viewport off its own side — invisible until it
      // slides in.
      const offset = window.innerWidth;

      gsap.set(frames.slice(1), { opacity: 0 });
      gsap.set(frames[0], { autoAlpha: 0 });
      // Neutralise the desktop wrapper offsets; the convergence is driven from
      // the inner spans here.
      gsap.set([rightSlideRef.current, leftSlideRef.current], { autoAlpha: 1, x: 0 });
      gsap.set(rightRef.current, { x: offset, autoAlpha: 0 });
      gsap.set(leftRef.current, { x: -offset, autoAlpha: 0 });
      gsap.set(textRef.current, { color: "#34A8D8" });

      // The first frame fades up as the section arrives.
      ScrollTrigger.create({
        trigger: section,
        start: "top 70%",
        once: true,
        onEnter: () =>
          gsap.to(frames[0], { autoAlpha: 1, duration: 0.9, ease: "power2.out" }),
      });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "+=125%", // a longer pinned scroll so the scene plays out slower
          pin: true,
          // Pin a hair early so the switch to fixed lands before the section
          // fully meets the top — removes the "catch" as the pin engages.
          anticipatePin: 1,
          // Smaller scrub lag so the scene tracks the finger closely and the pin
          // releases without the animation still visibly catching up.
          scrub: 0.5,
        },
      });

      // Both lines glide from off-screen to centre, fading in as they arrive, and
      // meet at t=3 (the end of the pinned scroll).
      const converge = 3;
      tl.to(rightRef.current, { x: 0, autoAlpha: 1, ease: "none", duration: converge }, 0);
      tl.to(leftRef.current, { x: 0, autoAlpha: 1, ease: "none", duration: converge }, 0);

      // Darken light → Workflow dark WHILE the lines are still travelling, so the
      // background has already turned by the time they settle — not as a separate
      // beat after they stop.
      tl.to(section, { backgroundColor: "#0E1312", ease: "none", duration: 1.6 }, 0.6);

      // Flip primary → white during the final stretch of their approach.
      tl.to(textRef.current, { color: "#F7F8F7", ease: "none", duration: 0.6 }, converge - 0.9);

      // Crossfade through the five frames. The cues are deliberately uneven: the
      // third frame is held on screen the longest (its solo stretch dwarfs the
      // others), so that's the one the visitor lingers on; the last frame lands
      // just as the sentence settles in the centre.
      const frameFade = 0.35;
      const frameCues = [0.35, 0.95, 2.2, 2.65]; // Frame 2, 3, 4, 5 fade-in points
      frames.slice(1).forEach((frame, i) => {
        tl.to(frame, { opacity: 1, ease: "none", duration: frameFade }, frameCues[i]);
      });
    });

    return () => mm.revert();
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
          loading="lazy"
          decoding="async"
          className="absolute left-1/2 top-1/2 z-1 h-auto w-[64%] max-w-250 -translate-x-1/2 -translate-y-1/2 transform-[translateZ(0)] backface-hidden max-md:w-full max-md:max-w-none"
        />
      ))}

      {/* Converging sentence */}
      <div className="absolute inset-0 z-10 flex items-center justify-center">
        <div
          ref={textRef}
          className="flex items-center gap-[0.35em] font-heading text-[3rem] leading-[1.05] text-primary max-md:flex-col max-md:gap-12 md:text-[5rem] lg:text-[6rem] max-md:text-[4.5rem]"
        >
          <span ref={rightSlideRef} className="inline-block">
            <span ref={rightRef} className="inline-block whitespace-nowrap">
              مسار يغلق
            </span>
          </span>
          <span ref={leftSlideRef} className="inline-block">
            <span ref={leftRef} className="inline-block whitespace-nowrap">
              هذه الفجوة
            </span>
          </span>
        </div>
      </div>
    </section>
  );
}
