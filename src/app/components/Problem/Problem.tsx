"use client";

import { useEffect, useRef, useState } from "react";
import ProblemPoint from "./ProblemPoint";

const PROBLEMS = [
  {
    word: "التنظيم",
    sentence: "البلاغات غير مرتبة، اتصالات، أوراق ورسائل واتساب — تتوزّع على قنوات متفرقة ولا تجتمع في مكان واحد، فتضيع بين الموظفين ولا يصل أغلبها إلى الجهة المسؤولة عن الإصلاح.",
    image: "/assets/Problems/Problem 1.png",
  },
  {
    word: "الخطورة",
    sentence: "درجة خطورة الحفرة غير معروفة — لا توجد طريقة واضحة لمعرفة أيّ الحفر تشكّل خطرًا فعليًا على السائقين والمشاة، فتُعامَل كل البلاغات بالطريقة نفسها، ويتأخر إصلاح الأخطر منها.",
    image: "/assets/Problems/Problem 2.png",
  },
  {
    word: "المتابعة",
    sentence: "متابعة عملية سد الحفرة غير مستقرة — بعد إرسال البلاغ، لا يُعرف أين وصلت المعالجة ولا متى ستُصلَح، ولا يوجد ما يثبت أن الإصلاح تمّ فعلًا بعد انتهاء العمل.",
    image: "/assets/Problems/Problem 3.png",
  },
];

// Fraction of the pinned scroll spent opening the reveal window before the
// point selection begins — keep in sync with the reveal math below so a
// selected point always lands on a fully-open (fully-scaled) section.
const REVEAL_END = 0.3;

// Scroll progress that centres a given point within the post-reveal range.
const progressForPoint = (index: number) =>
  REVEAL_END + ((index + 0.5) / PROBLEMS.length) * (1 - REVEAL_END);

export default function Problem() {
  const sectionRef = useRef<HTMLElement>(null);
  const revealRef = useRef<HTMLDivElement>(null);
  const lockRef = useRef(false);
  const lockTimer = useRef<number>(0);
  const [active, setActive] = useState(0);
  const [imageVisible, setImageVisible] = useState(false);

  // Scroll the page to the position that maps to a given point, so clicking a
  // point stays in sync with the scroll-driven selection. While the smooth
  // scroll runs we lock out scroll-driven updates so the selection jumps
  // straight to the target instead of flickering through each segment.
  const goToPoint = (index: number) => {
    const section = sectionRef.current;
    if (!section) return;
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
    const reveal = revealRef.current;
    if (!section || !reveal) return;

    let frame = 0;
    const clamp = (v: number, min: number, max: number) =>
      Math.min(max, Math.max(min, v));
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const update = () => {
      frame = 0;
      const vh = window.innerHeight;
      const top = section.getBoundingClientRect().top;
      // Begin opening while the section is still approaching from below
      // (top ≈ 0.6vh, before it centres/pins), and finish shortly after it
      // pins. A larger distance = a slower reveal.
      const start = vh * 1;
      const distance = vh * 1.3;
      const wp = clamp((start - top) / distance, 0, 1);

      const x = lerp(34, 0, wp);
      const y = lerp(34, 0, wp);
      const r = lerp(40, 0, wp);
      // Set directly (not via a CSS class) so the browser parses the shape.
      reveal.style.clipPath = `inset(${y}% ${x}% round ${r}px)`;

      // Drive the active point from how far we've scrolled through the pinned
      // section — but only after the reveal has finished opening, and never
      // while a click-driven smooth scroll is in progress.
      if (!lockRef.current) {
        const scrollable = section.offsetHeight - vh;
        const progress = clamp(-top / scrollable, 0, 1);
        const p = clamp((progress - REVEAL_END) / (1 - REVEAL_END), 0, 1);
        const index = clamp(
          Math.floor(p * PROBLEMS.length),
          0,
          PROBLEMS.length - 1
        );
        setActive(index);
      }
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

    // Reveal the image with an entrance animation once the section is in view.
    const observer = new IntersectionObserver(
      ([entry]) => setImageVisible(entry.isIntersecting),
      { threshold: 0.25 }
    );
    observer.observe(section);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("scrollend", onScrollEnd);
      window.removeEventListener("resize", onScroll);
      observer.disconnect();
      window.clearTimeout(lockTimer.current);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section id="problem" ref={sectionRef} className="relative h-[220vh]">
      {/* Pin the dark stage; the reveal window opens to show the light content */}
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden bg-dark">
        <div
          ref={revealRef}
          className="problem-reveal absolute inset-0 flex items-center bg-background"
        >
          <div className="mx-auto grid w-full max-w-360 grid-cols-2 items-stretch gap-10 px-12">
            {/* Right (start side in RTL) — the problems we solve.
                Spread to match the image's height, top and bottom. */}
            <div className="flex flex-col justify-between text-right">
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
              className={`relative aspect-3/2 w-full self-center overflow-hidden rounded-brand transition-all duration-700 ease-out ${imageVisible
                ? "translate-y-0 scale-100 opacity-100"
                : "translate-y-8 scale-95 opacity-0"
                }`}
            >
              {PROBLEMS.map((problem, index) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={problem.word}
                  src={problem.image}
                  alt=""
                  aria-hidden="true"
                  className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${index === active ? "opacity-100" : "opacity-0"
                    }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
