"use client";

import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import gsap from "gsap";

type Props = {
  // The stat title to show next to the bullet.
  title: string;
  // Changing this triggers the roll, even if the text is identical.
  step: number;
};

// The visible title rolls up and out of a masked box while the next title rises
// into its place from below — the same swap the phone-showcase title uses.
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
    // The column is two lines tall, so half its height is one line.
    const tween = gsap.fromTo(
      inner,
      { yPercent: 0 },
      {
        yPercent: -50,
        duration: 0.6,
        ease: "power3.inOut",
        onComplete: () => {
          // Commit the settled title into the top line before snapping the
          // column back, so the top line never flashes the previous title.
          flushSync(() => setCurrent(next));
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
    <div className="h-12 overflow-hidden">
      <div ref={innerRef} className="flex flex-col">
        <span className="whitespace-nowrap font-sans text-[2rem] font-bold leading-12 text-text">
          {current}
        </span>
        {/* The incoming title waits on the clipped second line, kept in normal
            flow so the mask is as wide as the wider of the two titles. */}
        <span
          aria-hidden="true"
          className="whitespace-nowrap font-sans text-[2rem] font-bold leading-12 text-text"
        >
          {title}
        </span>
      </div>
    </div>
  );
}
