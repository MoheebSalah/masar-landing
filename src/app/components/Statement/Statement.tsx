"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function Statement() {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const accentsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const heading = headingRef.current;
    if (!section || !heading) return;

    const primary =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--color-primary")
        .trim() || "#34a8d8";

    const ctx = gsap.context(() => {
      const words = heading.querySelectorAll("span span");
      const accents = Array.from(accentsRef.current?.children ?? []);

      // The mirror of the hero captions: the words rise and shade in. Over the
      // light card the shift runs the other way — out of the page's own text
      // colour and into primary, which is where it stays.
      const start = getComputedStyle(heading).color;
      gsap.set(words, { autoAlpha: 0, y: 32, color: start });
      gsap.set(accents, { scale: 0, autoAlpha: 0 });

      // Triggered off the heading, not the section: the card is a full screen
      // tall, so by the time its top edge clears the fold the words are still
      // far below it — firing there would spend the whole reveal off-screen.
      const reveal = gsap.timeline({
        scrollTrigger: { trigger: heading, start: "top 80%", once: true },
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
    // A curtain, not the next section down: the negative margin pulls the card
    // back over the last screen of the hero, so it climbs the viewport on its
    // rounded lip while the footage behind it holds perfectly still.
    //
    // The card itself is only half a screen tall (a quarter on phones) — as
    // much room as the line needs and no more. The pull stays a full stage
    // height regardless, because that is what times the rise against the
    // hero's sticky release, not the card's own height. Whatever the card
    // doesn't cover by then, the Solution section behind it does: same
    // background, no lip of its own, so the two read as one panel.
    <section
      id="statement"
      ref={sectionRef}
      className="relative z-10 mt-[-100vh] flex h-[50vh] w-full flex-col items-center justify-center gap-10 rounded-t-brand bg-background px-8 max-md:h-[25vh] max-md:gap-6"
    >
      <div ref={accentsRef} className="flex items-center gap-2.5" aria-hidden="true">
        <span className="block h-2.5 w-2.5 rounded-full bg-primary" />
        <span className="block h-2.5 w-2.5 rounded-full bg-primary/60" />
        <span className="block h-2.5 w-2.5 rotate-45 bg-primary/35" />
      </div>

      {/* Sets up the line the Solution section answers with — "مسار يغلق هذه
          الفجوة". Each word is its own span so the reveal can stagger them. */}
      <h2 ref={headingRef} className="max-w-6xl text-center font-heading text-[2.5rem] leading-tight text-text md:text-[4.5rem] lg:text-[5.5rem]">
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
    </section>
  );
}
