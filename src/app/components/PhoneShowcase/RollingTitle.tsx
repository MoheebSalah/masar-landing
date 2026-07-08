"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

type Props = {
  // The screen title to show.
  title: string;
  // Changing this triggers the roll, even if the text is identical.
  step: number;
};

// The visible title rolls up and out of the masked box while the next title
// rises into its place from below. Both live inside an overflow-hidden box so
// they're clipped at the title's edges.
export default function RollingTitle({ title, step }: Props) {
  const innerRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(title);
  const firstRun = useRef(true);

  useEffect(() => {
    // Don't animate on the initial mount.
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const inner = innerRef.current;
    if (!inner) return;

    const next = title;
    const tween = gsap.fromTo(
      inner,
      { yPercent: 0 },
      {
        yPercent: -100,
        duration: 0.6,
        ease: "power3.inOut",
        onComplete: () => {
          // Swap the settled title in and snap the column back to the start.
          setCurrent(next);
          gsap.set(inner, { yPercent: 0 });
        },
      },
    );
    return () => {
      tween.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  return (
    <div className="h-9 overflow-hidden">
      <div ref={innerRef} className="relative flex flex-col items-center">
        <h3 className="whitespace-nowrap font-sans text-t1 font-bold leading-9 text-text-dark">
          {current}
        </h3>
        {/* The incoming title waits just below the mask. */}
        <span
          aria-hidden="true"
          className="absolute top-full whitespace-nowrap font-sans text-t1 font-bold leading-9 text-text-dark"
        >
          {title}
        </span>
      </div>
    </div>
  );
}
