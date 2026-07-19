"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { onLoaderDone } from "../Loader/loaderSignal";

gsap.registerPlugin(ScrollTrigger);

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const subheadRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const content = contentRef.current;
    if (!section || !content) return;

    const ctx = gsap.context(() => {
      // Pin the hero for one screen so the section below scrolls up and covers
      // it while it holds still, and — on the same scrubbed trigger — drift the
      // headline + subhead upward as it's covered. pinSpacing:false leaves the
      // layout untouched and lets the hero release (stop being fixed) once it's
      // fully covered, instead of lingering pinned behind the whole page.
      gsap.to(content, {
        yPercent: -28,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "+=100%",
          pin: true,
          pinSpacing: false,
          scrub: true,
        },
      });
    }, section);

    return () => ctx.revert();
  }, []);

  // Reveal the headline and subhead once the loading screen clears. Each line
  // rises into place, the subhead trailing the headline for a gentle cascade.
  useEffect(() => {
    const heading = headingRef.current;
    const subhead = subheadRef.current;
    if (!heading || !subhead) return;

    const lines = [...heading.children, ...subhead.children];
    gsap.set(lines, { autoAlpha: 0, y: 40 });
    const unsubscribe = onLoaderDone(() => {
      gsap.to(lines, {
        autoAlpha: 1,
        y: 0,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.15,
      });
    });
    return unsubscribe;
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative h-screen w-full overflow-hidden"
    >
      {/* Background video. Phones autoplay the lightweight re-encode (~1/5 the
          bytes) so the above-the-fold hero isn't gated on a full-resolution
          download; wider screens keep the original. The browser picks the first
          matching source, so the desktop load is unchanged. */}
      <video
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
      >
        <source src="/assets/Workflow/Workflow 1.mobile.mp4" media="(max-width: 767px)" type="video/mp4" />
        <source src="/assets/Workflow/Workflow 1.mp4" type="video/mp4" />
      </video>

      {/* Readability overlay: darker toward the bottom-right where the text sits */}
      <div className="absolute inset-0 bg-linear-to-tl from-dark/80 via-dark/40 to-transparent" />

      {/* On mobile the text is centred, so add a gentle uniform scrim to keep it
          legible over any frame of the video */}
      <div className="absolute inset-0 bg-dark/30 md:hidden" />

      {/* Small primary gradient rising from the bottom */}
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-primary/45 to-transparent" />

      {/* Content — centred on mobile, pinned to the bottom-right (start side in
          RTL) from `md` up */}
      <div
        ref={contentRef}
        className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center md:items-start md:justify-end md:px-16 md:pb-16 md:text-right lg:px-32 lg:pb-24"
      >
        <div className="max-w-5xl">
          <h1 ref={headingRef} className="font-heading font-semibold text-[3.25rem] leading-[1.12] text-text-dark sm:text-[3.75rem] md:text-[5.75rem] lg:text-[7.25rem]">
            <span className="block"> سجّل طريقك، ودع <span className="text-primary">مسار</span> </span>
            <span className="block">يرصد كل حفرة فيه</span>
          </h1>
          <p ref={subheadRef} className="mx-auto mt-6 max-w-2xl font-sans text-t3 font-light leading-relaxed text-subtext-dark md:mx-0 md:mt-10 md:text-t2 lg:text-t1">
            <span className="block">منصّة ذكية ترصد أضرار الطرق تلقائيًا</span>
            <span className="block text-primary">
              وتحوّلها إلى خطة إصلاح مُنظّمة وقابلة للمتابعة.
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}
