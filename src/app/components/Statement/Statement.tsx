"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function Statement() {
  const sectionRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const accentsRef = useRef<HTMLDivElement>(null);

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
      const accents = Array.from(accentsRef.current?.children ?? []);

      // The panel is measured rather than read off window.innerHeight: it is
      // `h-screen`, and on a phone whose URL bar is showing those two disagree
      // — the same reason the hero measures its stage. One screen of scroll is
      // the unit every phase below is counted in.
      const screen = () => panel.offsetHeight;

      // Three screens, one phase each: arrive, hold, leave. The panel is stuck
      // to the top for all of it, so every one of those is pure opacity — the
      // picture behind it changes while nothing on screen moves.
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${screen() * 3}`,
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
      });

      // Up through the hero's last frame, which is dissolving on the same
      // stretch of scroll. Linear on both sides: two crossing linear fades hand
      // over evenly, where eased ones dip through a pale patch in the middle.
      tl.fromTo(
        panel,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 1, ease: "none" },
        0
      );

      // And away again over Solution, which by now is pinned and composed
      // behind it — so this reads as one picture replacing another rather than
      // a panel being scrolled off.
      tl.to(panel, { autoAlpha: 0, duration: 1, ease: "none" }, 2);

      // The mirror of the hero captions: the words rise and shade in. Over the
      // light panel the shift runs the other way — out of the page's own text
      // colour and into primary, which is where it stays.
      const start = getComputedStyle(heading).color;
      gsap.set(words, { autoAlpha: 0, y: 32, color: start });
      gsap.set(accents, { scale: 0, autoAlpha: 0 });

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
      reveal
        .to(accents, {
          scale: 1,
          autoAlpha: 1,
          duration: 0.45,
          stagger: 0.08,
          ease: "back.out(2.2)",
        })
        .to(
          words,
          {
            autoAlpha: 1,
            y: 0,
            color: primary,
            duration: 1,
            stagger: 0.09,
            ease: "power3.out",
          },
          0.15
        );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    // Not a section that follows the hero — a panel laid over the seam between
    // the hero and Solution, contributing no height of its own (-200 + 400 -
    // 200 = 0) so neither of them moves to make room for it.
    //
    // The top margin puts its first screen exactly on the hero's last two: the
    // footage lands on its final frame two stage-heights before the hero ends,
    // and the panel's sticky starts on that very frame. The bottom margin pulls
    // Solution up under the panel's last screen, so Solution is already pinned
    // and holding still by the time the panel starts to leave. Both numbers are
    // tied to the hero's `* 2` reserve and Solution's lead-in hold; move one and
    // the other two have to move with it.
    <section
      id="statement"
      ref={sectionRef}
      className="relative z-10 mt-[-200vh] mb-[-200vh] h-[400vh] w-full"
    >
      <div
        ref={panelRef}
        className="sticky top-0 flex h-screen w-full flex-col items-center justify-center gap-10 bg-background px-8 max-md:gap-6"
      >
        <div ref={accentsRef} className="flex items-center gap-2.5" aria-hidden="true">
          <span className="block h-2.5 w-2.5 rounded-full bg-primary" />
          <span className="block h-2.5 w-2.5 rounded-full bg-primary/60" />
          <span className="block h-2.5 w-2.5 rotate-45 bg-primary/35" />
        </div>

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
