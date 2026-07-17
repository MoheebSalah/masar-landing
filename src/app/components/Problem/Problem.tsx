"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ProblemPoint from "./ProblemPoint";

gsap.registerPlugin(ScrollTrigger);

const PROBLEMS = [
  {
    word: "التنظيم",
    sentence: "البلاغات غير مرتبة، اتصالات، أوراق ورسائل واتساب — تتوزّع على قنوات متفرقة ولا تجتمع في مكان واحد، فتضيع بين الموظفين ولا يصل أغلبها إلى الجهة المسؤولة عن الإصلاح.",
    image: "/assets/Problems/Problem 1.webp",
  },
  {
    word: "الخطورة",
    sentence: "درجة خطورة الحفرة غير معروفة — لا توجد طريقة واضحة لمعرفة أيّ الحفر تشكّل خطرًا فعليًا على السائقين والمشاة، فتُعامَل كل البلاغات بالطريقة نفسها، ويتأخر إصلاح الأخطر منها.",
    image: "/assets/Problems/Problem 2.webp",
  },
  {
    word: "المتابعة",
    sentence: "متابعة عملية سد الحفرة غير مستقرة — بعد إرسال البلاغ، لا يُعرف أين وصلت المعالجة ولا متى ستُصلَح، ولا يوجد ما يثبت أن الإصلاح تمّ فعلًا بعد انتهاء العمل.",
    image: "/assets/Problems/Problem 3.webp",
  },
];

// Scroll progress (within the pinned range) that centres a given point.
const progressForPoint = (index: number) => (index + 0.5) / PROBLEMS.length;

export default function Problem() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const textColRef = useRef<HTMLDivElement>(null);
  const imageColRef = useRef<HTMLDivElement>(null);
  const lockRef = useRef(false);
  const lockTimer = useRef<number>(0);
  const [active, setActive] = useState(0);

  // Clicking a point scrolls the page to the position that maps to it, so the
  // selection stays in sync with the scroll-driven cycling. While that smooth
  // scroll runs we lock out scroll-driven updates so the choice doesn't flicker
  // through the intermediate points.
  const goToPoint = (index: number) => {
    const section = sectionRef.current;
    if (!section) return;

    // On phones the section is a single screen and navigation is by tapping a
    // title — no scroll choreography, just switch the active point.
    if (!window.matchMedia("(min-width: 768px)").matches) {
      setActive(index);
      return;
    }

    const scrollable = section.offsetHeight - window.innerHeight;
    lockRef.current = true;
    window.clearTimeout(lockTimer.current);
    lockTimer.current = window.setTimeout(() => {
      lockRef.current = false;
    }, 800);
    setActive(index);
    window.scrollTo({
      top: section.offsetTop + progressForPoint(index) * scrollable,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const mm = gsap.matchMedia();
    const clamp = (v: number, min: number, max: number) =>
      Math.min(max, Math.max(min, v));

    // Desktop only: drive the active point from how far we've scrolled through
    // the pinned (sticky) range — the section holds still in the middle and each
    // third of the scroll selects the next problem. Reverted below 768px, where
    // the section collapses to a single tap-navigated screen.
    mm.add("(min-width: 768px)", () => {
      let frame = 0;
      const update = () => {
        frame = 0;
        if (lockRef.current) return;
        const vh = window.innerHeight;
        const top = section.getBoundingClientRect().top;
        const scrollable = section.offsetHeight - vh;
        const progress = clamp(-top / scrollable, 0, 1);
        const index = clamp(
          Math.floor(progress * PROBLEMS.length),
          0,
          PROBLEMS.length - 1
        );
        setActive(index);
      };
      const onScroll = () => {
        if (!frame) frame = requestAnimationFrame(update);
      };
      // Release the click lock as soon as the smooth scroll settles.
      const onScrollEnd = () => {
        lockRef.current = false;
      };
      update();
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("scrollend", onScrollEnd);
      window.addEventListener("resize", onScroll);

      // Reveal the title, the problem words and the image together as the
      // section scrolls into view — the title leads, the words rise in from the
      // start side (right, in RTL) with a stagger, the image fades up alongside.
      const words = textColRef.current
        ? Array.from(textColRef.current.children)
        : [];
      gsap.set(titleRef.current, { autoAlpha: 0, y: 24 });
      gsap.set(words, { autoAlpha: 0, x: 60 });
      gsap.set(imageColRef.current, { autoAlpha: 0, y: 40, scale: 0.95 });
      const reveal = gsap.timeline({
        scrollTrigger: { trigger: section, start: "top 65%", once: true },
      });
      reveal
        .to(titleRef.current, { autoAlpha: 1, y: 0, duration: 0.7, ease: "power3.out" }, 0)
        .to(
          words,
          { autoAlpha: 1, x: 0, duration: 0.7, ease: "power3.out", stagger: 0.15 },
          0.15
        )
        .to(
          imageColRef.current,
          { autoAlpha: 1, y: 0, scale: 1, duration: 0.9, ease: "power3.out" },
          0.15
        );

      return () => {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("scrollend", onScrollEnd);
        window.removeEventListener("resize", onScroll);
        if (frame) cancelAnimationFrame(frame);
      };
    });

    // Mobile: no scroll cycling. Just a light entrance reveal — the stacked
    // titles and image fade up together once the section slides into view.
    mm.add("(max-width: 767px)", () => {
      // Lock the problems column to the height of its tallest state (all three
      // titles + the longest sentence expanded), so switching problems never
      // resizes the column — and the image below it never shifts. Any extra room
      // in shorter states falls to the bottom (the column is justify-start on
      // mobile), so the titles and image keep their positions.
      const col = textColRef.current;
      const measure = () => {
        if (!col) return;
        col.style.minHeight = "";
        const gap = parseFloat(getComputedStyle(col).rowGap) || 0;
        const titles = Array.from(col.querySelectorAll("button"));
        const sentences = Array.from(col.querySelectorAll("p"));
        if (!titles.length || !sentences.length) return;
        const titlesH = titles.reduce((sum, b) => sum + b.offsetHeight, 0);
        const gapsH = gap * (titles.length - 1);
        // scrollHeight reports each sentence's full height even while collapsed.
        const maxSentence = Math.max(...sentences.map((p) => p.scrollHeight));
        const SENTENCE_MT = 12; // the mt-3 above the expanded sentence
        col.style.minHeight = `${titlesH + gapsH + SENTENCE_MT + maxSentence}px`;
      };
      const raf = requestAnimationFrame(measure);
      document.fonts?.ready.then(measure).catch(() => {});
      window.addEventListener("resize", measure);

      const words = textColRef.current
        ? Array.from(textColRef.current.children)
        : [];
      const targets = [titleRef.current, ...words, imageColRef.current].filter(
        Boolean
      );
      gsap.set(targets, { autoAlpha: 0, y: 24 });
      const reveal = gsap.timeline({
        scrollTrigger: { trigger: section, start: "top 75%", once: true },
      });
      reveal.to(targets, {
        autoAlpha: 1,
        y: 0,
        duration: 0.6,
        ease: "power3.out",
        stagger: 0.08,
      });

      return () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("resize", measure);
        if (col) col.style.minHeight = "";
      };
    });

    return () => {
      mm.revert();
      window.clearTimeout(lockTimer.current);
    };
  }, []);

  return (
    // Tall section so the content can pin (sticky) in the middle while scrolling
    // cycles the problems. Rounded top corners give the light panel its lift as
    // it slides up over the pinned hero.
    <section
      id="problem"
      ref={sectionRef}
      className="relative z-10 h-[300vh] rounded-t-brand bg-background max-md:h-dvh"
    >
      <div className="sticky top-0 flex h-screen flex-col justify-center gap-10 max-md:h-dvh max-md:gap-6 max-md:py-20">
        {/* Section title — tells visitors this section is about the hurdles of
            keeping roads in repair (what Masar is built to fix). Padding matches
            the grid below so it lines up with the problem words. */}
        <div
          ref={titleRef}
          className="px-8 text-right md:px-16 lg:px-32"
        >
          <h2 className="font-heading text-h3 text-text lg:text-h2 max-md:text-h3">
            تحديات إدارة أضرار الطرق
          </h2>
        </div>

        {/* Side distance matches the hero headline's (px-8 / md:px-16 / lg:px-32).
            Two columns on desktop; on phones it stacks: titles on top, image
            below. */}
        <div className="grid w-full grid-cols-[1fr_1.3fr] items-stretch gap-12 px-8 md:px-16 lg:px-32 max-md:flex max-md:flex-col max-md:gap-6">
          {/* Right (start side in RTL) — the problems we solve.
              Spread to match the image's height, top and bottom. */}
          <div ref={textColRef} className="flex flex-col justify-between text-right max-md:justify-start max-md:gap-5">
            {PROBLEMS.map((problem, index) => (
              <ProblemPoint
                key={problem.word}
                word={problem.word}
                sentence={problem.sentence}
                active={index === active}
                onSelect={() => goToPoint(index)}
              />
            ))}
          </div>

          {/* Left — image of the selected problem */}
          <div
            ref={imageColRef}
            className="relative aspect-3/2 w-full self-center overflow-hidden rounded-brand max-md:max-h-[42dvh]"
          >
            {PROBLEMS.map((problem, index) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={problem.word}
                src={problem.image}
                alt=""
                aria-hidden="true"
                loading="lazy"
                decoding="async"
                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 max-md:object-contain ${index === active ? "opacity-100" : "opacity-0"
                  }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
