"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

// Leading blank + the ten digits. The blank sits at index 0 so an unused column
// (e.g. the thousands place of "60") can roll to "nothing" and collapse away.
const DIGIT_GLYPHS = [" ", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
const SIGN_GLYPHS = ["+", "-"];
const SUFFIX_GLYPHS = [" ", "%"];
// The widest value has four digits, so every number is padded to four columns.
const MAX_DIGITS = 4;

type Props = {
  value: number;
  prefix: string;
  suffix: string;
  // Bumping this rolls every reel to the new number.
  step: number;
};

// Each reel to show `value`: index 0 = blank, digit d shown at index d + 1.
function digitIndices(value: number): number[] {
  return String(value)
    .padStart(MAX_DIGITS, " ")
    .split("")
    .map((c) => (c === " " ? 0 : c.charCodeAt(0) - 47));
}

// A mechanical-odometer number: every digit is a vertical reel that rolls from
// its old value to the new one (no fading). Leading columns that aren't needed
// roll to blank and collapse their width, so the number stays centred as it
// shrinks and grows between e.g. "+5400" and "-60%".
export default function OdometerNumber({ value, prefix, suffix, step }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const firstRun = useRef(true);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const strip = (id: string) =>
      root.querySelector<HTMLElement>(`[data-strip="${id}"]`);
    const wrap = (id: string) =>
      root.querySelector<HTMLElement>(`[data-wrap="${id}"]`);

    const firstDigit = strip("d0");
    if (!firstDigit || !firstDigit.children[0]) return;

    // One glyph's height drives the roll distance; all reels share it.
    const lineH = (firstDigit.children[0] as HTMLElement).clientHeight;

    const signIdx = prefix === "-" ? 1 : 0;
    const suffixIdx = suffix === "%" ? 1 : 0;
    const dIdx = digitIndices(value);
    const DUR = 0.75;
    const EASE = "power3.inOut";

    // Roll a reel to glyph `idx`: queued onto `tl` when animating, set instantly
    // when `tl` is null.
    const roll = (tl: gsap.core.Timeline | null, id: string, idx: number) => {
      const el = strip(id);
      if (!el) return;
      if (tl) tl.to(el, { y: -idx * lineH, duration: DUR, ease: EASE }, 0);
      else gsap.set(el, { y: -idx * lineH });
    };

    // Open/close a column's width (0 when its glyph is blank) so the row recentres.
    const openWidth = (tl: gsap.core.Timeline | null, id: string, open: boolean) => {
      const w = wrap(id);
      const s = strip(id);
      if (!w || !s) return;
      const natural = s.offsetWidth; // glyph width, unaffected by clipping
      if (tl) tl.to(w, { width: open ? natural : 0, duration: DUR, ease: EASE }, 0);
      else gsap.set(w, { width: open ? natural : 0 });
    };

    // First appearance: park every reel on the blank glyph (widths already set
    // to their final columns) so the number is invisible, then roll it in like a
    // mechanical odometer spinning up the moment it scrolls into view.
    if (firstRun.current) {
      firstRun.current = false;

      roll(null, "sign", signIdx);
      dIdx.forEach((idx, i) => {
        roll(null, `d${i}`, 0);
        openWidth(null, `d${i}`, idx !== 0);
      });
      roll(null, "suffix", 0);
      openWidth(null, "suffix", suffixIdx !== 0);

      const intro = gsap.timeline({ paused: true });
      roll(intro, "sign", signIdx);
      dIdx.forEach((idx, i) => roll(intro, `d${i}`, idx));
      roll(intro, "suffix", suffixIdx);

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
    roll(tl, "sign", signIdx);
    dIdx.forEach((idx, i) => {
      roll(tl, `d${i}`, idx);
      openWidth(tl, `d${i}`, idx !== 0);
    });
    roll(tl, "suffix", suffixIdx);
    openWidth(tl, "suffix", suffixIdx !== 0);

    return () => {
      tl.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const reel = (id: string, glyphs: string[]) => (
    <div key={id} data-wrap={id} className="h-[1em] overflow-hidden">
      {/* w-max keeps the strip at its natural glyph width even while the wrapper
          is clipped to 0, so re-opening a column measures a real width. */}
      <div data-strip={id} className="flex w-max flex-col">
        {glyphs.map((g, i) => (
          <span key={i} className="block h-[1em] text-center leading-none">
            {g}
          </span>
        ))}
      </div>
    </div>
  );

  return (
    <div
      ref={rootRef}
      dir="ltr"
      className="flex items-start font-numeric text-[27rem] font-normal leading-none tabular-nums text-text"
    >
      {reel("sign", SIGN_GLYPHS)}
      {Array.from({ length: MAX_DIGITS }).map((_, i) => reel(`d${i}`, DIGIT_GLYPHS))}
      {reel("suffix", SUFFIX_GLYPHS)}
    </div>
  );
}
