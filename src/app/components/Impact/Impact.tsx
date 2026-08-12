"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { getLenis } from "../SmoothScroll/lenisInstance";
import Reel, { type ReelHandle } from "./Reel";

gsap.registerPlugin(ScrollTrigger);

// The headline numbers, shown one at a time in scroll order.
const STATS = [
  { value: 5400, prefix: "+", suffix: "", title: "حفرة تم رصدها" },
  { value: 60, prefix: "-", suffix: "%", title: "انخفاض في وقت الاستجابة" },
  { value: 3200, prefix: "+", suffix: "", title: "حالة تم إصلاحها" },
  { value: 90, prefix: "+", suffix: "%", title: "من المواطنين تم إشعارهم" },
];
const N = STATS.length;

// Scroll → drum position. The number's map is deliberately dead straight: the
// first stat is centred at the very top of the track and the last at the very
// bottom, with every scrolled pixel in between turning the drum. No padding at
// the ends and no dwell on a stat, so there is no stretch of scrolling where
// nothing moves.
const NUMBER_HOLD = 0;
// The title rides the same scroll but crosses over in a rush, parked either
// side of it: a number caught halfway is the whole effect, a sentence caught
// halfway is just unreadable. It can afford to hold still — the number beside
// it never does.
const TITLE_HOLD = 0.82;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

// The (fractional) reel index for a scroll progress of 0…1.
function indexFor(progress: number, hold: number): number {
  const t = clamp01(progress) * (N - 1);
  if (hold <= 0) return t;
  const from = Math.min(N - 2, Math.floor(t));
  const f = clamp01((t - from - hold / 2) / (1 - hold));
  // Smoothstep, so the title eases out of its dwell and into the next one.
  return from + f * f * (3 - 2 * f);
}

// Where in the track stat `i` sits dead centre (the inverse of indexFor).
const progressFor = (i: number) => i / (N - 1);

export default function Impact() {
  const sectionRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<ScrollTrigger | null>(null);
  const eyebrowRef = useRef<HTMLParagraphElement>(null);
  const capsuleRef = useRef<HTMLDivElement>(null);
  const titleRowRef = useRef<HTMLDivElement>(null);
  const numberReelRef = useRef<ReelHandle>(null);
  const titleReelRef = useRef<ReelHandle>(null);
  // Which stat the reel is nearest (0…N-1) — read only by the indicator dots;
  // the reels themselves are moved imperatively, off React's render path, since
  // they update on every scroll frame.
  const [step, setStep] = useState(0);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      // Every width: the section is a tall track with a sticky inner panel doing
      // the visual pinning via CSS. This trigger only *reads* the scroll
      // progress — no GSAP pin — and feeds it straight to the two reels, so the
      // numbers travel with the page scroll in both directions, on a phone
      // exactly as on a desktop.
      const update = (progress: number) => {
        const index = indexFor(progress, NUMBER_HOLD);
        numberReelRef.current?.setIndex(index);

        // The title slides too, but dissolves through its (short) crossover
        // so it is never caught sitting there as two sliced halves.
        const titleIndex = indexFor(progress, TITLE_HOLD);
        titleReelRef.current?.setIndex(titleIndex);
        titleReelRef.current?.setAlpha(
          1 - 2 * Math.abs(titleIndex - Math.round(titleIndex))
        );

        const nearest = Math.round(index);
        setStep((prev) => (prev === nearest ? prev : nearest));
      };

      triggerRef.current = ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => update(self.progress),
        // Seats the reel on load / after a layout change, wherever the page
        // already happens to be scrolled to.
        onRefresh: (self) => update(self.progress),
      });
    }, section);

    return () => {
      triggerRef.current = null;
      ctx.revert();
    };
  }, []);

  // As the section first arrives, the eyebrow, the capsule and the title rise
  // into place in that order.
  useEffect(() => {
    const section = sectionRef.current;
    const eyebrow = eyebrowRef.current;
    const capsule = capsuleRef.current;
    const titleRow = titleRowRef.current;
    if (!section || !eyebrow || !capsule || !titleRow) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      gsap.set(eyebrow, { autoAlpha: 0, y: 24 });
      gsap.set(capsule, { autoAlpha: 0, y: 40 });
      gsap.set(titleRow, { autoAlpha: 0, y: 24 });

      const tl = gsap.timeline({
        scrollTrigger: { trigger: section, start: "top 20%", once: true },
      });
      tl.to(eyebrow, { autoAlpha: 1, y: 0, duration: 0.7, ease: "power3.out" }, 0)
        .to(
          capsule,
          { autoAlpha: 1, y: 0, duration: 0.9, ease: "power3.out" },
          0.1
        )
        .to(
          titleRow,
          { autoAlpha: 1, y: 0, duration: 0.8, ease: "power3.out" },
          0.35
        );
    }, section);

    return () => ctx.revert();
  }, []);

  // Jump to the point in the track where stat `i` sits dead centre; the reel
  // then simply follows that scroll like any other.
  const scrollToStep = (i: number) => {
    const st = triggerRef.current;
    if (!st) return;
    const target = st.start + progressFor(i) * (st.end - st.start);
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(target, { duration: 1 });
    else window.scrollTo({ top: target, behavior: "smooth" });
  };

  // The clickable indicator dots — a vertical rail on the desktop right edge.
  // Phones don't get them: there the drum, its title and the scroll itself say
  // where you are, and the rail only crowded the screen.
  const renderDots = () =>
    STATS.map((s, i) => (
      <button
        key={s.title}
        type="button"
        onClick={() => scrollToStep(i)}
        aria-label={s.title}
        className={`cursor-pointer rounded-full transition-all duration-300 ${
          i === step
            ? "h-9 w-2.5 bg-text-dark"
            : "h-2.5 w-2.5 bg-muted-dark hover:bg-light-dark"
        }`}
      />
    ));

  return (
    <section
      ref={sectionRef}
      id="impact"
      /* A scroll track with a sticky, full-screen panel inside it: the panel
         holds the capsule still while the scrolled distance turns the drum.
         Desktop h-[520vh] == 1.3 viewports of scroll per stat (STATS has 4);
         phones get a shorter track, since a thumb covers less ground than a
         wheel and 1.3 screens per number would be a long haul. */
      className="relative h-[520vh] w-full bg-primary max-md:h-[400vh]"
    >
      {/* translateZ promotes the pinned panel to its own layer on phones, so the
          giant sticky number no longer shimmers against Lenis' sub-pixel scroll. */}
      <div className="sticky top-0 flex h-screen flex-col items-center justify-center max-md:h-dvh max-md:[transform:translateZ(0)]">
        {/* Content column matches the showcase width; the whole stat — eyebrow,
            capsule, title — is stacked on its centre line. */}
        <div className="flex w-full max-w-375 flex-col items-center px-8 max-md:px-5">
          {/* Eyebrow — quiet context above the number */}
          {/* On phones it sits a step larger and further off the capsule, so the
              air above the capsule matches the air below it. */}
          <p
            ref={eyebrowRef}
            className="mb-26 font-sans text-t2 text-text-dark max-md:mb-27 max-md:text-t1"
          >
            أرقامٌ تعكس أثراً ملموساً
          </p>

          {/* The capsule: a primary-coloured pill acting as the reel's window.
              It sets the number's size (everything inside is in `em`), paints it
              white, and clips the drum — so the stats either side of the shown
              one stay half-visible.
              Below `md` the size is fluid: the capsule is 4.2em wide, so
              `23.8vw - 9.5px` is exactly the size at which it spans the screen
              less a 20px margin either side (matching the column's px-5). */}
          <div
            ref={capsuleRef}
            className="relative h-[2em] w-[4.2em] overflow-hidden rounded-full bg-text-dark font-numeric text-[calc(23.8vw-9.5px)] md:text-[8rem] lg:text-[11rem] xl:text-[13rem]"
          >
            {/* The stats either side of the shown one fade out towards the
                capsule's top and bottom edges, while the shown one keeps the
                fully opaque middle band. */}
            {/* Numbers fade only right at the pill's rounded ends. The opaque
                band has to be this wide because the drum is a fat one: a number
                is well off centre for most of its travel, and a narrower band
                would leave it washed out for most of the roll. */}
            <div className="absolute inset-0 mask-[linear-gradient(to_bottom,transparent_2%,#000_18%,#000_82%,transparent_98%)] mask-no-repeat mask-size-[100%_100%]">
              {/* The drum: perspective on the items' own parent, so their
                  rotation reads as depth. `step` is the gap between numbers as
                  a share of the capsule's height, and `curve` the degrees they
                  turn crossing it — a wider gap turned through a shallower
                  angle is a fatter cylinder (here ~33° per number). `fade` is
                  set to keep the neighbour's brightness across that longer
                  reach. */}
              <Reel
                ref={numberReelRef}
                step={72}
                curve={24}
                fade={0.64}
                className="absolute inset-0 perspective-[2.5em]"
                itemClassName="leading-none tabular-nums text-text"
                items={STATS.map((s) => (
                  <span key={s.title} dir="ltr">
                    {s.prefix}
                    {s.value}
                    {s.suffix}
                  </span>
                ))}
              />
            </div>
          </div>

          {/* The stat's title, centred right under the capsule, on a reel of its
              own so it travels with the number instead of swapping separately. */}
          <div
            ref={titleRowRef}
            /* The margins either side of the capsule are set so the *painted*
               gaps match — the title's window is taller than its line (the
               mask's fade has to land on slack), so equal margins would not
               look equal. */
            className="relative mt-23 h-14 w-full overflow-hidden mask-[linear-gradient(to_bottom,transparent_0%,#000_12%,#000_88%,transparent_100%)] mask-no-repeat mask-size-[100%_100%] max-md:h-10"
          >
            {/* Flat, not on a drum: the titles are read, not watched. The
                window is a little taller than a line, so the mask's fade lands
                on the slack rather than on the resting title. */}
            <Reel
              ref={titleReelRef}
              className="absolute inset-0"
              itemClassName="whitespace-nowrap font-sans text-[2rem] font-bold text-text-dark max-md:text-[1.375rem]"
              items={STATS.map((s) => (
                <span key={s.title}>{s.title}</span>
              ))}
            />
          </div>

        </div>

        {/* Desktop-only clickable progress indicator: a vertical rail on the
            right edge. */}
        <div className="absolute right-10 top-1/2 hidden -translate-y-1/2 flex-col items-center gap-3 md:flex">
          {renderDots()}
        </div>
      </div>
    </section>
  );
}
