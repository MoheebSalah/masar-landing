"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

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

    // The light → dark swap is a single flip, not a scrubbed colour: crossing
    // the trigger point writes data-dark on the section and CSS takes over from
    // there (a composited opacity fade on the backdrop layer + a colour
    // transition on the sentence). Nothing repaints per scroll frame, and the
    // fade plays at its own steady pace however fast the visitor scrolls.
    const flipAt = (progress: number, point: number) => {
      const dark = progress >= point ? "true" : "false";
      if (section.dataset.dark !== dark) section.dataset.dark = dark;
    };

    // The blueprint backdrop is the statement's, fixed to the viewport and
    // already standing still by the time this section starts climbing over it.
    // It is faded out from here rather than from there because only this scene
    // knows when it is finished with: the dark fill above has covered it since
    // the flip, and it has to be gone before the pin releases or a fixed layer
    // would go on floating over Workflow.
    const backdrop = document.getElementById("statement-blueprint");

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

      // Entrance, in two beats, because the section climbs over the statement
      // now rather than following it. The frame comes up first, the instant the
      // section's top crosses the bottom of the screen — which is where the
      // climb begins — so the picture is there for the whole of it and is what
      // the statement's line dissolves into. The sentence waits until the climb
      // is all but over: it answers that line, so the two must never be
      // legible at the same time.
      //
      // Each half slides in from its own edge — the right half from the right,
      // the left half from the left — then settles. The slide lives on the
      // wrapper spans so it composes cleanly with the scrubbed convergence that
      // the inner spans (rightRef/leftRef) drive.
      const slideIn = window.innerWidth * 0.35;
      gsap.set(frames[0], { autoAlpha: 0 });
      gsap.set(rightSlideRef.current, { autoAlpha: 0, x: slideIn });
      gsap.set(leftSlideRef.current, { autoAlpha: 0, x: -slideIn });
      ScrollTrigger.create({
        trigger: section,
        start: "top bottom",
        once: true,
        onEnter: () =>
          gsap.to(frames[0], { autoAlpha: 1, duration: 0.9, ease: "power2.out" }),
      });
      ScrollTrigger.create({
        trigger: section,
        start: "top 15%",
        once: true,
        onEnter: () =>
          gsap.to([rightSlideRef.current, leftSlideRef.current], {
            autoAlpha: 1,
            x: 0,
            duration: 1,
            ease: "power3.out",
          }),
      });

      // The scene's own length. The pin engages the moment the climb ends, on
      // the frame the section lands on, so the scene starts where the handover
      // finishes with nothing in between.
      const SCENE = 4;

      // The point in the pinned scroll where the section swaps to dark: just as
      // the two halves are about to meet. Because the swap still happens inside
      // Solution, it and the dark Workflow below read as one continuous
      // background — no hard seam between the sections.
      const DARK_AT = 0.68;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top", // begins once the section fills the screen
          end: "+=300%", // three viewport-heights of scene
          pin: true,
          scrub: 1, // smooth, scroll-tied progress
          onUpdate: (self) => flipAt(self.progress, DARK_AT),
          // Keeps the state right when the page is reloaded or resized mid-scene.
          onRefresh: (self) => flipAt(self.progress, DARK_AT),
        },
      });

      // The two halves glide toward each other across the whole scroll.
      tl.to(rightRef.current, { x: 0, ease: "none", duration: SCENE }, 0);
      tl.to(leftRef.current, { x: 0, ease: "none", duration: SCENE }, 0);

      // Crossfade through the frames. The cues are deliberately uneven rather
      // than one transition per scroll segment: back-to-back fades never leave
      // any frame alone on screen for more than an instant. Frame 3 — the
      // middle of the five — is the one to dwell on, so it gets a long solo
      // stretch (~1.25 of the timeline's 4) while the others pass through
      // quickly. Frame 5 lands exactly as the two sentence halves meet.
      const frameFade = 0.45;
      const frameCues = [0.4, 1.15, 2.85, 3.55]; // Frame 2, 3, 4, 5 fade-in points
      frames.slice(1).forEach((frame, i) => {
        tl.to(
          frame,
          { opacity: 1, ease: "none", duration: frameFade },
          frameCues[i]
        );
      });

      // The statement's line art leaves with the scene. It has been out of
      // sight behind the dark fill since the flip, so the fade costs nothing to
      // look at — it is there to take a fixed layer off the page before the pin
      // releases and Workflow arrives underneath it.
      if (backdrop) {
        tl.to(
          backdrop,
          { autoAlpha: 0, ease: "none", duration: 0.35 },
          SCENE - 0.35
        );
      }

      return () => {
        section.dataset.dark = "false";
      };
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

      // The first frame fades up as the section leaves the bottom of the screen
      // and starts its climb over the statement, as on desktop.
      ScrollTrigger.create({
        trigger: section,
        start: "top bottom",
        once: true,
        onEnter: () =>
          gsap.to(frames[0], { autoAlpha: 1, duration: 0.9, ease: "power2.out" }),
      });

      // As on desktop, the scene starts on the frame the section pins — which
      // is the frame the climb over the statement ends on.
      const SCENE = 3;

      // Halfway through the pinned scroll — the lines are still travelling, so
      // the background has already turned by the time they settle.
      const DARK_AT = 0.5;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "+=125%", // the scene's own length
          pin: true,
          onUpdate: (self) => flipAt(self.progress, DARK_AT),
          onRefresh: (self) => flipAt(self.progress, DARK_AT),
          // Pin a hair early so the switch to fixed lands before the section
          // fully meets the top — removes the "catch" as the pin engages.
          anticipatePin: 1,
          // Smaller scrub lag so the scene tracks the finger closely and the pin
          // releases without the animation still visibly catching up.
          scrub: 0.5,
        },
      });

      // Both lines glide from off-screen to centre, fading in as they arrive,
      // and meet at the end of the pinned scroll.
      tl.to(
        rightRef.current,
        { x: 0, autoAlpha: 1, ease: "none", duration: SCENE },
        0
      );
      tl.to(
        leftRef.current,
        { x: 0, autoAlpha: 1, ease: "none", duration: SCENE },
        0
      );

      // Crossfade through the five frames. The cues are deliberately uneven: the
      // third frame is held on screen the longest (its solo stretch dwarfs the
      // others), so that's the one the visitor lingers on; the last frame lands
      // just as the sentence settles in the centre.
      const frameFade = 0.35;
      const frameCues = [0.35, 0.95, 2.2, 2.65]; // Frame 2, 3, 4, 5 fade-in points
      frames.slice(1).forEach((frame, i) => {
        tl.to(
          frame,
          { opacity: 1, ease: "none", duration: frameFade },
          frameCues[i]
        );
      });

      // As on desktop, the line art is taken off the page with the scene.
      if (backdrop) {
        tl.to(
          backdrop,
          { autoAlpha: 0, ease: "none", duration: 0.35 },
          SCENE - 0.35
        );
      }

      return () => {
        section.dataset.dark = "false";
      };
    });

    return () => mm.revert();
  }, []);

  return (
    // Pulled up by one screen so it overlaps the statement's last one: the
    // section climbs from the bottom edge of the screen to filling it while the
    // statement's line dissolves in place above, and lands with its frame
    // centred exactly as that line finishes going. `z-20` is what makes the
    // climb visible at all — the statement panel is `z-10` and stays opaque, so
    // without it this would arrive underneath.
    //
    // No background of its own, deliberately: an opaque fill here would climb
    // with the section and wipe the statement's fixed line art up the screen
    // along with it, which is the one thing that must not travel. What shows
    // through is the statement's panel — the same cream, so the rising edge
    // stays invisible — with the blueprint standing still on top of it, and the
    // only thing seen to move is the picture. The dark fill below is this
    // section's own and does travel with it, which is what keeps the whole
    // screen dark as the section finally scrolls up into Workflow. The pin
    // keeps the arrangement: ScrollTrigger hands the margin to the spacer it
    // wraps this in.
    <section
      ref={sectionRef}
      id="solution"
      data-dark="false"
      className="group relative z-20 mt-[-100vh] h-screen w-full overflow-hidden"
    >
      {/* The dark backdrop, faded in at the flip point. Fading a layer's
          opacity is composited on the GPU, so the swap costs no repaint of the
          section — unlike animating background-color would. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 bg-dark opacity-0 transition-opacity duration-700 ease-out group-data-[dark=true]:opacity-100"
      />

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
          className="flex items-center gap-[0.35em] font-heading text-[3rem] leading-[1.05] text-primary transition-colors duration-700 ease-out group-data-[dark=true]:text-text-dark max-md:flex-col max-md:gap-64 md:text-[5rem] lg:text-[6rem] max-md:text-[4.5rem]"
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
