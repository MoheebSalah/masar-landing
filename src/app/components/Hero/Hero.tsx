"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { onLoaderDone } from "../Loader/loaderSignal";
import { signalHeroFootageReady } from "./heroFootageSignal";
import { setHeroLogoLanded } from "./heroLogoSignal";
import FrameSequence from "./FrameSequence";
import SceneCaption from "./SceneCaption";
import Logo from "../Logo/Logo";

gsap.registerPlugin(ScrollTrigger);

// Runtime of each cut of the hero footage, in seconds. The scrubbed timeline
// runs one unit per second of footage, so every caption cue below can be
// written in the same units as the story — the sequence index is derived from
// it. Phones get their own cut, shot portrait and half the length, so they get
// their own runtime and their own cue list; nothing about the two is shared
// beyond the shape of this file.
const FOOTAGE = 28.36;
// The phone cut is 14.83s on disk, but it opens and closes on fades to white of
// its own — 0.4s in front, 0.8s behind. Both are trimmed off the sequence, so
// what is left is 13.6s of picture and nothing else. The page does its own
// arriving and leaving at both ends (the headline clears out over the first
// frame, the statement dissolves up through the last), and a clip that had gone
// white underneath either of them would hand over a blank screen.
const MOBILE_FOOTAGE = 13.6;

// Enough of the run downloaded, front to back, to hand the stage over. The rest
// keeps arriving behind the visitor as they scroll; until a frame lands the
// canvas holds the closest one it already has.
const READY_FRACTION = 0.14;

// Timeline units spent on the opening headline clearing out before the footage
// starts moving. At ~14vh of scroll per unit that's a little under half a
// screen — one flick of the wheel and the stage is handed to the footage.
// Phones run far more scroll per unit than that, so three units there would cost
// most of a screen before anything moved; two keeps the handover about as quick
// as it feels on desktop and leaves the rest of the run to the footage.
const INTRO = 3;
const MOBILE_INTRO = 2;

// How much scroll the mark's flight into the navbar takes, as a share of one
// screen. It is deliberately short of the navbar's own threshold (0.4 of a
// screen, where the bar collapses into its centred pill): the mark has to be
// delivered while the slot it is aiming at is still the wide opening one, or it
// would spend the last of the flight chasing a target that had moved. The gap
// between the two also gives the landing a moment to read before the bar starts
// morphing around it.
const LOGO_FLIGHT = 0.35;

// How long a caption takes to arrive and to leave, again in footage seconds.
// The phone cut's scenes run half as long, so its captions have to move in and
// out in half the footage-time to leave the same share of each scene sitting
// still. In scroll they cost about the same, because its shorter run is
// stretched over a proportionally taller section.
const IN = 0.8;
const OUT = 0.5;
const MOBILE_IN = 0.5;
const MOBILE_OUT = 0.35;

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sequenceRef = useRef<FrameSequence | null>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const markRef = useRef<HTMLDivElement>(null);
  const markRevealRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const veilRef = useRef<HTMLDivElement>(null);
  const lapRef = useRef<HTMLDivElement>(null);

  // Build the sequence and start pulling frames straight away — this runs
  // while the loading screen is still up, which is the whole point: the
  // loader holds (briefly, and capped) on the signal fired below.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const phone = window.matchMedia("(max-width: 767px)").matches;
    const template = phone ? canvas.dataset.mobileSrc : canvas.dataset.src;
    const count = Number(phone ? canvas.dataset.mobileFrames : canvas.dataset.frames);
    if (!template || !count) return;

    const urls = Array.from({ length: count }, (_, i) =>
      template.replace("[n]", String(i + 1).padStart(4, "0"))
    );

    // Whatever it takes to do the upscale exactly once. Capping the backing
    // store below the screen's own pixel ratio doesn't avoid an enlargement,
    // it splits one into two — canvas, then browser — and two come out softer
    // than one. A 3x phone therefore gets a 3x canvas, where the 1080-wide cut
    // lands within a whisker of 1:1. Desktop stays at 2x because it is already
    // drawing its frame larger than the source, so more backing pixels buy
    // nothing and cost fill rate.
    //
    // The phone cut is composed 9:16 with its labels, framing marks and
    // read-outs hard against all four edges, so it is fitted rather than
    // cropped — see FrameFit.
    const sequence = new FrameSequence(
      canvas,
      urls,
      phone ? 3 : 2,
      phone ? "fit-bottom" : "cover"
    );
    sequenceRef.current = sequence;
    sequence.resize();

    const enough = Math.ceil(count * READY_FRACTION);
    sequence
      .load(6, (ready) => {
        if (ready >= enough) signalHeroFootageReady();
      })
      // However it ends — complete, or every frame refused — the loading
      // screen must not be left waiting on it.
      .finally(() => signalHeroFootageReady());

    const onResize = () => sequence.resize();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      sequence.destroy();
      sequenceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    if (!section || !stage) return;

    const ctx = gsap.context(() => {
      const captions = gsap.utils.toArray<HTMLElement>("[data-scene]", section);

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          // Two stage-heights are held back from the scrub: one is the stage
          // itself, the other is the screen the picture spends dissolving into
          // the statement. The footage therefore lands on its last frame
          // exactly as that handover begins — no stretch of scrolling where
          // nothing moves.
          //
          // Measured off the stage, not window.innerHeight: the section height
          // and the card's negative margin are both in vh, and on phones those
          // two disagree whenever the URL bar is showing.
          end: () => `+=${section.offsetHeight - stage.offsetHeight * 2}`,
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
      });

      // Which cut this visitor is watching. Everything downstream — the
      // runtime, the caption cues, how long the headline takes to clear and how
      // long a caption takes to arrive — is picked from it here and never
      // branched on again.
      const phone = window.matchMedia("(max-width: 767px)").matches;
      const footage = phone ? MOBILE_FOOTAGE : FOOTAGE;
      const intro = phone ? MOBILE_INTRO : INTRO;
      const arrive = phone ? MOBILE_IN : IN;
      const leave = phone ? MOBILE_OUT : OUT;

      // The opening headline lifts away the moment scrolling starts.
      tl.to(
        introRef.current,
        { autoAlpha: 0, y: -70, scale: 0.94, duration: intro, ease: "power2.in" },
        0
      );

      // The veil that holds the first frame back behind the headline clears
      // over exactly the same span, so the picture is sharp and unshaded on the
      // scroll position where the footage starts moving — not a moment before,
      // not a moment after. Fading its opacity blends the blurred, tinted
      // backdrop back toward the untouched frame underneath, so the dim and the
      // blur ease off together rather than one outliving the other.
      //
      // `autoAlpha` rather than plain opacity, on purpose: it parks the layer at
      // visibility:hidden once it is clear, which takes a viewport-sized
      // backdrop-filter out of compositing for the whole of the scrubbed run
      // behind it.
      //
      // Eased in rather than linear, and that is a legibility decision, not a
      // taste one. The headline is white and the footage it sits over is very
      // nearly white too, so the shade is the only thing holding the type up.
      // A linear fade thins it to about half while the headline — on its own
      // slower `power2.in` — is still at full opacity, and measured over the
      // opening frame that window lands near 2:1 against white. `power1.in`
      // keeps most of the shade for as long as the type is worth reading and
      // spends it in the last third, where the headline is going anyway. It is
      // still lifting from the first pixel of scroll and still gone exactly
      // when the footage starts.
      tl.to(veilRef.current, { autoAlpha: 0, duration: intro, ease: "power1.in" }, 0);

      // The playhead is a plain object the timeline scrubs, kept in footage
      // seconds so it shares units with the caption cues. Each update just
      // names a frame; the sequence coalesces requests on its own, so calling
      // this on every scroll frame costs nothing.
      const playhead = { t: 0 };
      tl.to(
        playhead,
        {
          t: footage,
          duration: footage,
          ease: "none",
          onUpdate: () => {
            const sequence = sequenceRef.current;
            if (!sequence) return;
            const progress = Math.min(Math.max(playhead.t / footage, 0), 1);
            sequence.seek(progress * (sequence.length - 1));
          },
        },
        intro
      );

      // Captions. Every cue is read off the markup, so the scene text and its
      // timing stay together in the JSX below.
      captions.forEach((caption) => {
        const from =
          intro + Number(phone ? caption.dataset.mobileFrom : caption.dataset.from);
        const to =
          intro + Number(phone ? caption.dataset.mobileTo : caption.dataset.to);
        const words = caption.querySelectorAll("[data-scene-word]");
        const body = caption.querySelector("[data-scene-body]");

        // The block arrives as one piece: a soft rise out of nothing, with no
        // rule drawing itself around the words any more. It is also the one
        // tween that keeps every other scene's text off the frame — a staggered
        // fromTo only renders its "from" state for the first target, so the
        // words below can't be trusted to start hidden on their own, and this
        // single un-staggered tween covers the whole block.
        //
        // On phones all five scenes now share one slot, so a caption change is
        // a line of type being replaced in place. That is the whole reason the
        // in and out are eased fades over a real stretch of footage rather than
        // the old 0.2-unit gate: what used to be five blocks appearing in five
        // different corners has to read as one dissolving into the next.
        tl.fromTo(
          caption,
          { autoAlpha: 0, y: 24 },
          { autoAlpha: 1, y: 0, duration: arrive, ease: "power2.out" },
          from
        );

        // The words still come up one behind the next, but only just — enough
        // to keep the line from arriving as a slab.
        tl.fromTo(
          words,
          { autoAlpha: 0, y: 14 },
          {
            autoAlpha: 1,
            y: 0,
            duration: arrive * 0.9,
            stagger: arrive * 0.1,
            ease: "power3.out",
          },
          from + arrive * 0.15
        );

        if (body) {
          tl.fromTo(
            body,
            { autoAlpha: 0, y: 12 },
            { autoAlpha: 1, y: 0, duration: arrive * 0.9, ease: "power3.out" },
            from + arrive * 0.45
          );
        }

        // Out, so the next scene arrives on a clear frame. Eased at both ends —
        // over a shared slot an accelerating exit reads as the words being
        // yanked off, where this hands over.
        tl.to(
          caption,
          { autoAlpha: 0, y: -24, duration: leave, ease: "power2.inOut" },
          to - leave
        );
      });

      // The progress lap: one primary hairline that leaves the top-left corner
      // as the footage starts and runs clockwise right round the stage, closing
      // the loop on the last frame. It reads as how much of the story is left
      // without a bar sitting anywhere in the picture.
      //
      // Four scaled spans rather than one stroked <rect>: an outline that has
      // to stretch to the viewport can't be traced with a dash pattern, because
      // the pattern is measured in one coordinate space and the geometry drawn
      // in another, and the lap comes out short. Each span is anchored where
      // the previous one finished, so scaling them in turn draws one
      // continuous line.
      //
      // Their durations are shares of the perimeter rather than equal quarters:
      // a landscape stage's top edge is a much longer walk than its side, and
      // quarters would have the line crawl across the top and sprint down the
      // sides. Measured once here — a resize shifts the speed a little but
      // never where the lap starts or ends.
      const lap = lapRef.current;
      if (lap) {
        const edges = Array.from(
          lap.querySelectorAll<HTMLElement>("[data-hero-lap]")
        );
        const perimeter = 2 * (stage.offsetWidth + stage.offsetHeight);
        let at = intro;
        [stage.offsetWidth, stage.offsetHeight, stage.offsetWidth, stage.offsetHeight].forEach(
          (length, i) => {
            const edge = edges[i];
            if (!edge) return;
            const axis = edge.dataset.heroLap === "x" ? "scaleX" : "scaleY";
            const span = (length / perimeter) * footage;
            tl.fromTo(
              edge,
              { [axis]: 0 },
              { [axis]: 1, duration: span, ease: "none" },
              at
            );
            at += span;
          }
        );
      }

      // The mark's flight. It opens the page in the middle of the hero, above
      // the headline, and rather than lifting away with it, it travels up into
      // the navbar's logo slot and stays there — so the mark the visitor met on
      // arrival is the same one that sits in the bar for the rest of the page.
      //
      // Measured rather than placed. The target is the navbar's own logo, which
      // is in the document from the first paint (kept invisible until this
      // lands, precisely so there is something to measure), so the landing spot
      // is whatever that bar's responsive padding and mark size work out to at
      // this width — and phones, where the slot is the top-right corner rather
      // than the top-left, need no separate case at all.
      const mark = markRef.current;
      const slot = document.querySelector<HTMLElement>(
        phone ? '[data-navbar-logo="mobile"]' : '[data-navbar-logo="desktop"]'
      );

      if (mark && slot) {
        let flying: gsap.core.Timeline | null = null;
        const flight = { dx: 0, dy: 0, scale: 1 };

        // Set when a reading had to be refused because the bar could not be
        // trusted at the time; the next time the visitor is back at the very
        // top — where it can be — the numbers are taken again.
        let stale = false;

        const measure = () => {
          // Only ever read the slot while the bar is still wearing its opening
          // shape. Past the flight's range it has collapsed into the centred
          // pill, and a refresh down there — a resize, say — would record the
          // pill as the target and fly the mark into the middle of the screen
          // on the way back up.
          //
          // The boundary itself is refused too, and it has to be: the bar swaps
          // its shape back from a React state change on the same scroll event
          // that would trigger the reading, and there is no ordering guarantee
          // between that render and this callback — deferring a frame is not
          // enough, because a default-priority React update can land after the
          // next animation frame. So the only readings taken are ones where the
          // answer cannot be in doubt.
          if (window.scrollY > window.innerHeight * LOGO_FLIGHT) {
            stale = true;
            return;
          }
          stale = false;

          // Cleared first, so the "from" box is the mark's resting place rather
          // than wherever the flight has currently put it.
          gsap.set(mark, { x: 0, y: 0, scale: 1 });
          const from = mark.getBoundingClientRect();
          const to = slot.getBoundingClientRect();

          // Centres, not corners: GSAP scales about the centre, so lining those
          // two up is what makes the landed mark and the bar's own mark the
          // same mark.
          flight.dx = to.left + to.width / 2 - (from.left + from.width / 2);
          flight.dy = to.top + to.height / 2 - (from.top + from.height / 2);
          flight.scale = to.height / from.height;

          // Invalidating makes the tween re-read the numbers above, but it does
          // not repaint on its own, and the reset above has just put the mark
          // back at its resting spot. It has to be replayed, or the mark sits
          // at home until the next scroll event moves it — which, if the
          // visitor has stopped, is never. Handing `progress` the value it
          // already holds is a no-op, hence the nudge through zero.
          if (flying) {
            const progress = flying.progress();
            flying.invalidate().progress(0).progress(progress);
          }
        };

        // The swap. Once the mark is home the navbar shows its own — same spot,
        // same size, same colour — and this copy steps out, so the bar is free
        // to hide and morph on scroll without dragging a second mark around
        // with it. Latched, because it is called on every scroll frame.
        let landed = false;
        const handover = (value: boolean) => {
          if (value === landed) return;
          landed = value;
          gsap.set(mark, { autoAlpha: value ? 0 : 1 });
          setHeroLogoLanded(value);
        };

        flying = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: () => `+=${window.innerHeight * LOGO_FLIGHT}`,
            // Unsmoothed, unlike the footage scrub above. The handover happens
            // on a scroll position, and a mark lagging six tenths of a second
            // behind it would arrive after the bar had already shown its own.
            scrub: true,
            invalidateOnRefresh: true,
            onRefreshInit: measure,
            onUpdate: (self) => {
              handover(self.progress >= 1);
              // Back at the very top with a reading owed. Here the bar is
              // unambiguously the wide one and the mark is already home, so
              // taking it costs nothing and shows nothing.
              if (stale && self.progress === 0) measure();
            },
            onRefresh: (self) => handover(self.progress >= 1),
          },
        });

        flying.to(
          mark,
          {
            x: () => flight.dx,
            y: () => flight.dy,
            scale: () => flight.scale,
            ease: "none",
            duration: 1,
          },
          0
        );

        // Primary the whole way up, and the bar's own mark colour only as it
        // arrives — the mark reads as itself in flight, and as part of the
        // navbar once it is there. Both ends stated rather than inherited from
        // the class, so a refresh mid-flight can't record a half-changed colour
        // as the starting one.
        flying.fromTo(
          mark,
          { color: "#34A8D8" },
          { color: "#F7F8F7", ease: "none", duration: 0.2 },
          0.8
        );

        measure();
      }

      // The handover. With the footage on its last frame the stage still has
      // one screen of sticky scroll in it, and that screen is spent dissolving
      // the picture away where it stands while the statement panel — laid over
      // exactly this patch of viewport, and starting its own sticky run on the
      // same scroll position — comes up through it. Neither moves; they only
      // trade opacity, so the story ends by fading out rather than by being
      // pushed off by a card.
      //
      // Its own trigger rather than a tail on the scrub above, because the two
      // measure different runs: the scrub stops a stage-height short of this.
      const handover = () => section.offsetHeight - stage.offsetHeight * 2;
      gsap.to(stage, {
        autoAlpha: 0,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: () => `top top-=${handover()}`,
          end: () => `top top-=${handover() + stage.offsetHeight}`,
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
      });

      // The lap closes on the last frame and then lets go, over the first half
      // of that same handover — ahead of the picture on purpose, so the line
      // has cleared the corners before the statement is legible through them
      // rather than hanging around the edge of somebody else's section.
      if (lap) {
        gsap.to(lap, {
          autoAlpha: 0,
          ease: "power2.in",
          scrollTrigger: {
            trigger: section,
            start: () => `top top-=${handover()}`,
            end: () => `top top-=${handover() + stage.offsetHeight * 0.5}`,
            scrub: 0.6,
            invalidateOnRefresh: true,
          },
        });
      }
    }, section);

    return () => ctx.revert();
  }, []);

  // The opening headline reveals once the loading screen clears. It rides on
  // the lines themselves, not on the wrapper the scrubbed timeline drives, so
  // the two never write to the same element.
  useEffect(() => {
    const heading = headingRef.current;
    if (!heading) return;

    // The mark leads, the two lines follow it — one stagger over the lot. The
    // mark's *inner* box, because the outer one is the flight's to write.
    const reveal = [markRevealRef.current, ...heading.children].filter(Boolean);
    gsap.set(reveal, { autoAlpha: 0, y: 40 });
    return onLoaderDone(() => {
      gsap.to(reveal, {
        autoAlpha: 1,
        y: 0,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.15,
      });
    });
  }, []);

  return (
    // Tall enough to hold the whole scrubbed run: one screen of stage, the
    // footage, and a closing screen the picture spends dissolving into the
    // statement while the stage stays stuck behind it.
    //
    // The two cuts are now dimensioned separately. Desktop spends 660vh of
    // scrub on 28.4s of footage — half again what it used to get, because at
    // 440vh the run was over before the visitor had settled into it. The phone
    // keeps its 400vh over 13.6s, which is still more scroll per second of
    // footage than desktop; its cut packs the same five scenes into half the
    // runtime, so scene for scene it costs about the same to get through and
    // making it taller as well would only stretch the gaps. These heights are
    // the single source of truth: the timeline measures the section rather
    // than restating them.
    <section
      ref={sectionRef}
      className="relative h-[860vh] max-md:h-[600vh]"
    >
      {/* Stage height is 100vh on every screen, not dvh: the statement card
          pulls itself up by exactly this much, and a dvh stage would drift out
          of step with it every time a phone's URL bar slid away. */}
      <div ref={stageRef} className="sticky top-0 h-screen w-full overflow-hidden">
        {/* The story itself: AVIF stills at 20fps rather than a video, so
            moving through it is a decode and never a seek. `[n]` stands in for
            the zero-padded frame number. The two cuts are separate edits —
            567 landscape frames for desktop, 297 portrait ones for phones — so
            each carries its own count.

            The poster underneath shows frame one until the canvas has anything
            to paint, and is laid out the way the canvas will draw: cover on
            desktop, and on phones sat on the bottom edge over the frame's own
            top tone, so the handover to the canvas is invisible. */}
        <canvas
          ref={canvasRef}
          data-frames={567}
          data-mobile-frames={273}
          data-src="/assets/Hero/seq/[n].avif"
          data-mobile-src="/assets/Hero/seq-mobile/[n].avif"
          className="absolute inset-0 h-full w-full bg-[url('/assets/Hero/0819.poster.webp')] bg-cover bg-center bg-no-repeat max-md:bg-[url('/assets/Hero/hero-mobile.poster.webp')] max-md:bg-[#f9fbfa] max-md:bg-contain max-md:bg-bottom"
          aria-hidden="true"
        />

        {/* The opening veil. It sits over the canvas and under everything else,
            so the first frame reads as a held, out-of-focus backdrop while the
            headline has the stage, and the picture only resolves as the visitor
            scrolls into the footage.

            Both halves of it are on this one element: `bg-dark/60` is the dim,
            `backdrop-blur` the softening of whatever the canvas has painted
            behind it. A milder radius below `md` — the phone rasterises this
            layer over the full viewport on the very first scroll, alongside the
            frame decodes, and 24px there buys nothing the smaller one doesn't.

            Below the captions' `z-10` as well as the headline, but that never
            matters in practice: the first caption arrives after this has already
            gone to visibility:hidden, so nothing is ever asked to blend against
            a shaded frame. */}
        <div
          ref={veilRef}
          aria-hidden="true"
          className="absolute inset-0 z-5 bg-dark/60 backdrop-blur-xl max-md:backdrop-blur-md"
        />

        {/* Opening headline — centred and light, over the veiled frame */}
        <div className="absolute inset-0 z-20 flex items-center justify-center px-6 text-center">
          <div className="max-w-5xl">
            {/* The mark above the headline, in primary — it carries over the
                darkened frame where the navbar's dark version would not.

                It stays in flow, so the column below it sits exactly where it
                did and its own resting box is measurable at any time, but it is
                deliberately *not* inside the wrapper the intro tween lifts
                away: it does not leave with the headline, it flies to the
                navbar. Three nested elements because three animations want the
                same mark and none of them may share a transform — the flight
                drives this box, the loader reveal drives the one inside it, and
                the hover animation in globals.css drives the paths. */}
            <div ref={markRef} className="mx-auto mb-6 w-fit text-primary md:mb-8">
              <div ref={markRevealRef}>
                <Logo className="h-16 w-auto md:h-24" />
              </div>
            </div>
            <div ref={introRef}>
              <h1
                ref={headingRef}
                className="font-heading font-semibold text-[3rem] leading-[1.12] text-text-dark sm:text-[3.5rem] md:text-[5rem] lg:text-[6.25rem]"
              >
                <span className="block">
                  سجّل طريقك، ودع <span className="text-primary">مسار</span>
                </span>
                <span className="block">يرصد كل حفرة فيه</span>
              </h1>
            </div>
          </div>
        </div>

        {/* Scene captions. Each one carries its cue in both cuts and its
            desktop placement; Hero's timeline reads all of it back off the DOM.
            On phones the placement is not per-scene any more — every caption
            shares one slot, set inside SceneCaption.

            The phone cut dissolves between scenes at 2.5 / 5.2 / 8.6 / 11.1s,
            so its cues sit inside those and clear of the dissolves.

            `mix-blend-difference` is the whole contrast strategy, and it goes
            on this wrapper rather than on the type: an element blends with
            whatever is painted beneath it *inside the nearest stacking
            context*, and this layer is one (`z-10`), so a blend set on the
            captions themselves would find nothing under them but their own
            transparent parent. Set here, the layer blends against the canvas.
            The type is near-white, so it inverts to near-black over the
            footage's pale frames and turns light wherever the picture goes
            dark — contrast that follows the scene with nothing sampling
            pixels at runtime. The sticky stage is the outer stacking context,
            so none of it leaks onto the sections around the hero.

            The scenes are therefore split across three such layers rather than
            one: scene two opts out of the blend on phones, and a layer's blend
            is all-or-nothing for what it contains. Its own comment below says
            why. */}
        <div className="absolute inset-0 z-10 mix-blend-difference">
          {/* Desk buried in paper — the caption sits high and left of it. */}
          <SceneCaption
            from={0.2}
            to={3.9}
            position="top-[26%] left-[14%] w-96"
            mobileFrom={0.1}
            mobileTo={2.25}
            title="بلاغات بلا نظام"
          >
            مكالمات وأوراق ورسائل متفرّقة تتكدّس على مكتب واحد، فيضيع أغلبها قبل
            أن يصل إلى من يملك إصلاح الطريق.
          </SceneCaption>
        </div>

        {/* Scene two, in a layer of its own because it is the one exception to
            the blend — and only on phones. The phone cut is fitted rather than
            cropped, so the band above the picture is the frame's own top row
            stretched up through the gap (see FrameSequence): rgb(252,255,254)
            in every scene but this one, where the top row is the cabin's sun
            visor at #706b61. Differenced against that, near-white ink comes
            back a muddy mid-grey sitting on a dark band, and no other ink
            would do better — a difference blend cannot produce white over a
            mid-dark backdrop at all. So the blend is off below 768px and the
            type paints as what it already is: white, which is exactly what
            that band wants. From md up the blend is back, because the desktop
            cut is pale behind this caption and the type has to invert to dark
            there like everywhere else. */}
        <div className="absolute inset-0 z-10 md:mix-blend-difference">
          {/* Cabin, with the phone clamped to the windscreen — the caption
              sits dead centre of the stage. */}
          <SceneCaption
            from={4.2}
            to={9}
            position="top-1/2 left-1/2 w-104 -translate-x-1/2 -translate-y-1/2"
            mobileFrom={2.7}
            mobileTo={5}
            title="ابدأ بالقيادة فقط"
          >
            ثبّت هاتفك وافتح مسار. لا استمارات ولا بلاغات — رحلتك اليومية نفسها
            تتحوّل إلى مسحٍ مستمر للطريق.
          </SceneCaption>
        </div>

        <div className="absolute inset-0 z-10 mix-blend-difference">
          {/* The cracks and their read-out cross the frame, with the
              coordinates along the bottom. The caption hangs off the centre
              line and runs left from it: `right-1/2` puts its right edge on
              the middle of the stage, so the block fills the quarter just left
              of centre rather than being pushed out to the margin. */}
          <SceneCaption
            from={9.3}
            to={17}
            position="top-1/2 right-1/2 w-96 -translate-y-1/2"
            mobileFrom={5.45}
            mobileTo={8.25}
            title="الكاميرا ترى ما يفوت العين"
          >
            يرصد الذكاء الاصطناعي كل حفرة وشقّ أثناء المرور، ويسجّل موقعه وحجمه
            ودرجة خطورته لحظة بلحظة.
          </SceneCaption>

          {/* Over the operator's shoulder at the dashboard — the caption sits
              low, on the shoulder, under the map on the screen. */}
          <SceneCaption
            from={17.3}
            to={23}
            position="top-[63%] left-1/2 w-104 -translate-x-1/2"
            mobileFrom={8.9}
            mobileTo={10.75}
            title="خريطة واحدة تُرتّب الأولويات"
          >
            تصل كل الأضرار إلى لوحة تحكّم واحدة، مصنّفة حسب الخطورة ومرتّبة في
            خطة عمل توجّه الفرق إلى الأهم أولًا.
          </SceneCaption>

          {/* The inspector standing over the sealed hole, verified badge at
              his feet; the closing caption sits dead centre of the stage. */}
          <SceneCaption
            from={23.3}
            to={28.36}
            position="top-1/2 left-1/2 w-96 -translate-x-1/2 -translate-y-1/2"
            mobileFrom={11.45}
            mobileTo={13.6}
            title="إصلاحٌ موثَّق بالدليل"
          >
            يوثّق الفريق العمل من الميدان بصورة قبل وبعد، فيُغلق البلاغ بدليل
            واضح — لا وعود، بل طرق مُصلَحة.
          </SceneCaption>
        </div>

        {/* The progress lap. Four hairlines laid along the edges of the stage
            in the order the line travels — top left-to-right, right down,
            bottom right-to-left, left up — each anchored (`origin-*`) at the
            corner where the previous one finished, so scaling them in turn
            draws one unbroken line clockwise from the top-left corner.

            Physical `left`/`right`/`origin-*` rather than logical properties:
            the document is RTL, and the lap is a fixture of the screen, not of
            the reading direction. Above the captions, and outside their blend
            — it stays primary over whatever the footage is doing. */}
        <div
          ref={lapRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-30"
        >
          <span
            data-hero-lap="x"
            className="absolute top-0 left-0 h-1 w-full origin-left bg-primary"
          />
          <span
            data-hero-lap="y"
            className="absolute top-0 right-0 h-full w-1 origin-top bg-primary"
          />
          <span
            data-hero-lap="x"
            className="absolute bottom-0 left-0 h-1 w-full origin-right bg-primary"
          />
          <span
            data-hero-lap="y"
            className="absolute top-0 left-0 h-full w-1 origin-bottom bg-primary"
          />
        </div>
      </div>
    </section>
  );
}
