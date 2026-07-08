"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type Props = {
  // Title is forced onto two lines, so it comes in as two halves.
  lines: [string, string];
  // Target the number counts up to.
  value: number;
  // Sign shown before the digits (e.g. "+" or "-").
  prefix?: string;
  // Unit shown after the digits (e.g. "%").
  suffix?: string;
  // false → title on the start side (right), number on the end (left).
  // true  → the sides swap, so consecutive rows mirror each other.
  reversed?: boolean;
};

export default function StatRow({
  lines,
  value,
  prefix = "",
  suffix = "",
  reversed = false,
}: Props) {
  const numberRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = numberRef.current;
    if (!el) return;

    // Tween a plain proxy and write the rounded value out on every frame; the
    // count runs once when the row first scrolls into view.
    const counter = { v: 0 };
    const ctx = gsap.context(() => {
      gsap.to(counter, {
        v: value,
        duration: 2,
        ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 85%", once: true },
        onUpdate: () => {
          el.textContent = `${prefix}${Math.round(counter.v)}${suffix}`;
        },
      });
    });

    return () => ctx.revert();
  }, [value, prefix, suffix]);

  const title = (
    <div
      className={`font-sans text-h2 font-light leading-tight text-text ${
        reversed ? "text-left" : "text-right"
      }`}
    >
      <span className="block">{lines[0]}</span>
      <span className="block">{lines[1]}</span>
    </div>
  );

  // dir=ltr so the sign sits to the left of the digits; tabular-nums keeps the
  // width steady so the layout doesn't jitter while the count ticks up.
  const number = (
    <span
      ref={numberRef}
      dir="ltr"
      className="font-sans text-[7.5rem] font-extrabold leading-none tabular-nums text-primary"
    >
      {`${prefix}0${suffix}`}
    </span>
  );

  return (
    <div className="flex items-center justify-between gap-12 py-24">
      {reversed ? (
        <>
          {number}
          {title}
        </>
      ) : (
        <>
          {title}
          {number}
        </>
      )}
    </div>
  );
}
