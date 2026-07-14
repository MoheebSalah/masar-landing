"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

// Five fixed columns, each a vertical reel that only ever rolls up/down — never
// sideways. Column 0 is the sign; columns 1-4 hold the number + suffix,
// right-aligned so unused leading places sit as blanks that roll in and out.
// The units column carries "%" alongside the digits so a "%" ↔ "0" swap is also
// just a vertical roll. Each column keeps a fixed glyph set, so its width never
// changes and the whole number stays put as its contents roll.
const DIGITS = [" ", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
const SIGN = [" ", "+", "-"];
// "%" sits right after the blank so a "0" ↔ "%" swap is a short, adjacent roll.
const UNITS = [" ", "%", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

// Reel per column: sign, three digit columns, then the units/suffix column.
const COLUMN_GLYPHS = [SIGN, DIGITS, DIGITS, DIGITS, UNITS];
const COLUMNS = COLUMN_GLYPHS.length;
const DIGIT_COLUMNS = COLUMNS - 1; // everything after the sign

type Props = {
  value: number;
  prefix: string;
  suffix: string;
  // Bumping this rolls every reel to the new number.
  step: number;
};

// The five glyphs to show for a value, e.g. -60% → ["-", " ", "6", "0", "%"].
// The number + suffix are right-aligned in the four columns after the sign, so
// higher, unused places show as blanks.
function columnsFor(prefix: string, value: number, suffix: string): string[] {
  const body = (String(value) + suffix).padStart(DIGIT_COLUMNS, " ");
  return [prefix, ...body.split("")];
}

// Where a glyph sits on its column's reel (blank when it isn't on that reel).
function indexOf(set: string[], ch: string): number {
  const i = set.indexOf(ch);
  return i < 0 ? 0 : i;
}

// A mechanical-odometer number: every column is a vertical reel that rolls from
// its old glyph to the new one — no fading, no sideways motion. The row of
// columns never changes width, so the number holds its place while digits,
// blanks, the sign and "%" all roll into and out of view.
export default function OdometerNumber({ value, prefix, suffix, step }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const firstRun = useRef(true);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const strip = (i: number) =>
      root.querySelector<HTMLElement>(`[data-strip="${i}"]`);

    const first = strip(0);
    if (!first || !first.children[0]) return;

    // One glyph's height drives every roll distance; all reels share it.
    const lineH = (first.children[0] as HTMLElement).clientHeight;
    const DUR = 0.75;
    const EASE = "power3.inOut";

    // Roll each column to its target glyph: queued onto `tl` when animating, set
    // instantly when `tl` is null.
    const rollTo = (cols: string[], tl: gsap.core.Timeline | null) => {
      cols.forEach((ch, i) => {
        const el = strip(i);
        if (!el) return;
        const y = -indexOf(COLUMN_GLYPHS[i], ch) * lineH;
        if (tl) tl.to(el, { y, duration: DUR, ease: EASE }, 0);
        else gsap.set(el, { y });
      });
    };

    // First appearance: the number counts up from 0 to its value the moment it
    // scrolls into view. Because the columns are fixed width, it climbs in place
    // (units spinning fastest, leading blanks rolling into digits) with no
    // reflow. The sign and suffix stay in place throughout.
    if (firstRun.current) {
      firstRun.current = false;

      rollTo(columnsFor(prefix, 0, suffix), null);

      const proxy = { v: 0 };
      const intro = gsap.timeline({ paused: true });
      intro.to(proxy, {
        v: value,
        duration: 1.6,
        ease: "power2.out",
        onUpdate: () =>
          rollTo(columnsFor(prefix, Math.round(proxy.v), suffix), null),
      });

      let played = false;
      const io = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !played) {
            played = true;
            intro.play();
            io.disconnect();
          }
        },
        { threshold: 0.4 }
      );
      io.observe(root);

      return () => {
        io.disconnect();
        intro.kill();
      };
    }

    // Later steps: roll straight from the current reels to the new value.
    const tl = gsap.timeline();
    rollTo(columnsFor(prefix, value, suffix), tl);

    return () => {
      tl.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  return (
    <div
      ref={rootRef}
      dir="ltr"
      className="flex items-start font-numeric text-[27rem] font-normal leading-none tabular-nums text-text"
    >
      {COLUMN_GLYPHS.map((glyphs, i) => (
        <div key={i} className="h-[1em] overflow-hidden">
          {/* w-max keeps the reel at its natural (widest-glyph) width, so the
              column never resizes as it rolls between glyphs. */}
          <div data-strip={i} className="flex w-max flex-col">
            {glyphs.map((g, gi) => (
              <span key={gi} className="block h-[1em] text-center leading-none">
                {g === " " ? " " : g}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
