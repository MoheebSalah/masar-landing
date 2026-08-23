"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function Statement() {
  const sectionRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const panel = panelRef.current;
    const heading = headingRef.current;
    if (!section || !panel || !heading) return;

    const primary =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--color-primary")
        .trim() || "#34a8d8";

    const ctx = gsap.context(() => {
      const words = heading.querySelectorAll("span span");

      // The panel is measured rather than read off window.innerHeight: it is
      // `h-screen`, and on a phone whose URL bar is showing those two disagree
      // — the same reason the hero measures its stage. One screen of scroll is
      // the unit every phase below is counted in.
      const screen = () => panel.offsetHeight;

      // One screen to arrive, and that is the whole of it. The panel is stuck
      // to the top while it fades up over the hero's last frame, holds for a
      // second screen, and then simply scrolls away with the page — Solution
      // rises into the gap it leaves behind, the way any two sections meet.
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${screen()}`,
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
      });

      // Linear on both sides: two crossing linear fades hand over evenly, where
      // eased ones dip through a pale patch in the middle.
      tl.fromTo(
        panel,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 1, ease: "none" },
        0
      );

      // The mirror of the hero captions: the words rise and shade in. Over the
      // light panel the shift runs the other way — out of the page's own text
      // colour and into primary, which is where it stays.
      const start = getComputedStyle(heading).color;
      gsap.set(words, { autoAlpha: 0, y: 32, color: start });

      // Fired a quarter of a screen into the arrival rather than off the
      // heading's own position: the heading is inside a panel that is already
      // stuck to the top by then, so it never crosses the viewport the way a
      // scrolling element would, and a position-based cue would either fire
      // while the panel is still invisible or not at all.
      const reveal = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: () => `top top-=${screen() * 0.25}`,
          once: true,
        },
      });
      reveal.to(words, {
        autoAlpha: 1,
        y: 0,
        color: primary,
        duration: 1,
        stagger: 0.09,
        ease: "power3.out",
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    // The first two of its three screens overlap the hero (-200vh), where the
    // panel is stuck to the top and fades up over the footage's last frame. The
    // third is the section's own: the panel comes unstuck at the end of its
    // sticky run and scrolls off the top under its own steam, with Solution
    // rising behind it. The top margin is tied to the hero's `* 2` reserve —
    // the footage lands on its final frame exactly two stage-heights before the
    // hero ends, which is where this panel's sticky begins.
    <section
      id="statement"
      ref={sectionRef}
      className="relative z-10 mt-[-200vh] h-[300vh] w-full"
    >
      <div
        ref={panelRef}
        className="sticky top-0 flex h-screen w-full flex-col items-center justify-center bg-background px-8"
      >
        {/* Sets up the line the Solution section answers with — "مسار يغلق هذه
            الفجوة". Each word is its own span so the reveal can stagger them. */}
        <h2
          ref={headingRef}
          className="max-w-6xl text-center font-heading text-[2.5rem] leading-tight text-text md:text-[4.5rem] lg:text-[5.5rem]"
        >
          <span className="flex flex-wrap justify-center gap-x-[0.3em]">
            <span>بين</span>
            <span>ظهور</span>
            <span>الحفرة</span>
            <span>وإصلاحها</span>
          </span>
          <span className="flex flex-wrap justify-center gap-x-[0.3em]">
            <span>فجوةٌ</span>
            <span>طويلة.</span>
          </span>
        </h2>
      </div>
    </section>
  );
}
