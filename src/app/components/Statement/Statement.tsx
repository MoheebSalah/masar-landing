"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Blueprint from "./Blueprint";

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
      // `h-svh`, and on a phone whose URL bar is showing those two disagree
      // — the same reason the hero measures its stage. One screen of scroll is
      // the unit every phase below is counted in.
      const screen = () => panel.offsetHeight;

      // One screen to arrive, and that is the whole of it — its length is not
      // free, it has to match the hero's fade-out exactly for the two crossing
      // fades to hand over evenly. Half a screen of stillness follows so the
      // line can be read, and then the leaving fade below takes over.
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

      // The blueprint backdrop arrives with the panel. It is fixed to the
      // viewport, so from here until the end of the Solution scene it never
      // moves again — the frames climb over shapes that are already standing
      // still, which is the only way that climb reads as a picture rising
      // rather than a whole background sliding up behind it. Its own fade
      // multiplies with the panel's, so the lines surface a little later than
      // the cream does: they settle in behind the line of text, never race it.
      tl.fromTo(
        "#statement-blueprint",
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

      // Leaving. The panel does not move and the page does not carry it off:
      // the words dissolve on the spot, over the one screen of scroll that
      // Solution spends climbing into the viewport from below. The two are cut
      // from the same geometry — Solution is pulled up by exactly one screen
      // (`mt-[-100svh]`), so it leaves the bottom edge as this fade starts and
      // lands filling the screen, its frame centred, as the fade finishes.
      //
      // The heading fades and not the panel: the panel's background is the
      // page's own and has to stay opaque behind the line to the very end, and
      // its opacity already belongs to the arrival above.
      gsap.to(heading, {
        autoAlpha: 0,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: () => `top top-=${screen() * 1.5}`,
          end: () => `top top-=${screen() * 2.5}`,
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    // Three and a half screens, the first two overlapping the hero (-200svh).
    // They divide as fade-in / hold / fade-out / handover: one screen stuck to
    // the top fading up over the footage's last frame, half a screen of
    // stillness so the line can be read, one screen dissolving that line away
    // where it stands while Solution climbs over the panel from the bottom of
    // the screen, and a last screen after the sticky releases — by then
    // Solution is pinned and filling the viewport, so the panel sliding away
    // behind it is never seen. The panel itself never moves at any point in
    // that; the only thing travelling is the section arriving in front of it.
    //
    // The hold is only half a screen on purpose: a whole one was a full screen
    // of scrolling spent on a motionless, fully-opaque panel. The top margin is
    // tied to the hero's `* 2` reserve — the footage lands on its final frame
    // exactly two stage-heights before the hero ends, which is where this
    // sticky begins.
    <section
      id="statement"
      ref={sectionRef}
      className="relative z-10 mt-[-200svh] h-[350svh] w-full"
    >
      <div
        ref={panelRef}
        className="sticky top-0 flex h-svh w-full flex-col items-center justify-center bg-background px-8"
      >
        {/* Construction line art, behind the line of text — and behind
            everything the section after this one brings with it */}
        <Blueprint />

        {/* Sets up the line the Solution section answers with — "مسار يغلق هذه
            الحفرة". Each word is its own span so the reveal can stagger them.
            The size is one fluid rule instead of breakpoint steps because the
            line has to land in exactly two: the longer row measures 11.16× the
            font size (its four words plus three `0.3em` gaps), and the panel
            gives it `100vw − 4rem`, so anything above ~6.9vw wraps it to three.
            The `5.5rem` cap takes over from ~1275px up, where there is room.
            The second row is the shorter of the two, so it is the first that
            fixes the size — leave that row at four words if it is ever
            rewritten. */}
        <h2
          ref={headingRef}
          className="relative z-10 max-w-6xl text-center font-heading text-[min(6.9vw,5.5rem)] leading-tight text-text"
        >
          <span className="flex flex-wrap justify-center gap-x-[0.3em]">
            <span>بين</span>
            <span>ظهور</span>
            <span>الحفرة</span>
            <span>وإصلاحها</span>
          </span>
          <span className="flex flex-wrap justify-center gap-x-[0.3em]">
            <span>خطرٌ</span>
            <span>يتراكم.</span>
          </span>
        </h2>
      </div>
    </section>
  );
}
