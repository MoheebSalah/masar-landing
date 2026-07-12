"use client";

import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
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
    // The column is two lines tall, so half its height is one line.
    const tween = gsap.fromTo(
      inner,
      { yPercent: 0 },
      {
        yPercent: -50,
        duration: 0.6,
        ease: "power3.inOut",
        onComplete: () => {
          // Swap the settled title into the top line, then snap the column back
          // to the start. flushSync commits the new text before the reset so the
          // top line never flashes the previous title for a frame.
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
    <div className="h-9 overflow-hidden">
      <div ref={innerRef} className="flex flex-col items-center">
        <h3 className="whitespace-nowrap font-sans text-t1 font-bold leading-9 text-(--sec-text)">
          {current}
        </h3>
        {/* The incoming title waits on the clipped second line. It stays in
            normal flow (not absolute) so the mask is as wide as the wider of
            the two titles — a longer incoming title was clipped otherwise. */}
        <span
          aria-hidden="true"
          className="whitespace-nowrap font-sans text-t1 font-bold leading-9 text-(--sec-text)"
        >
          {title}
        </span>
      </div>
    </div>
  );
}
