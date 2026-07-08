"use client";

import { useEffect, useRef, useState } from "react";
import ProblemPoint from "./ProblemPoint";

const PROBLEMS = [
  {
    word: "التنظيم",
    sentence: "البلاغات غير مرتبة، اتصالات، أوراق ورسائل واتساب",
    image: "/assets/Problems/Problem 1.png",
  },
  {
    word: "الخطورة",
    sentence: "درجة خطورة الحفرة غير معروفة",
    image: "/assets/Problems/Problem 2.png",
  },
  {
    word: "المتابعة",
    sentence: "متابعة عملية سد الحفرة غير مستقرة",
    image: "/assets/Problems/Problem 1.png",
  },
];

export default function Problem() {
  const sectionRef = useRef<HTMLElement>(null);
  const revealRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

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
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
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
                  onSelect={() => setActive(index)}
                />
              ))}
            </div>

            {/* Left — image of the selected problem */}
            <div className="relative aspect-square w-full overflow-hidden rounded-brand">
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
