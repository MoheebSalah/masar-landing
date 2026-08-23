"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { onLoaderDone } from "../Loader/loaderSignal";
import { signalHeroFootageReady } from "./heroFootageSignal";
import FrameSequence from "./FrameSequence";
import SceneCaption from "./SceneCaption";

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
  const headingRef = useRef<HTMLHeadingElement>(null);

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

    // The shade every caption fades *out of* as it arrives. Read from the
    // theme rather than repeated as a literal, so the brand colour stays in
    // one place.
    const primary =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--color-primary")
        .trim() || "#34a8d8";

    const ctx = gsap.context(() => {
      const captions = gsap.utils.toArray<HTMLElement>("[data-scene]", section);

      // Each caption's resting colour, captured before any tween overwrites it,
      // so the shift can land exactly where the stylesheet put it.
      const resting = new Map<Element, string>();
      captions.forEach((caption) => {
        caption
          .querySelectorAll("[data-scene-word], [data-scene-body]")
          .forEach((el) => resting.set(el, getComputedStyle(el).color));
      });

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
        const edges = Array.from(
          caption.querySelectorAll<HTMLElement>("[data-scene-edge]")
        );

        // A gate rather than an animation, and the one tween that keeps every
        // other scene's text off the frame. A staggered fromTo only renders its
        // "from" state for the first target, so the words below can't be
        // trusted to start hidden on their own — this single un-staggered tween
        // covers the whole block.
        tl.fromTo(
          caption,
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 0.2, ease: "none" },
          from
        );

        // The rule draws itself around the words, one edge after the next, like
        // the detection box in the footage closing on what it found. Linear and
        // evenly divided so the trace holds a steady speed through the corners.
        const lap = arrive * 1.3;
        edges.forEach((edge, i) => {
          const axis = edge.dataset.sceneEdge === "x" ? "scaleX" : "scaleY";
          tl.fromTo(
            edge,
            { [axis]: 0 },
            { [axis]: 1, duration: lap / edges.length, ease: "none" },
            from + (lap / edges.length) * i
          );
        });

        // The words rise one by one behind it, each shading out of primary and
        // into the page's ink, which is where they stay.
        tl.fromTo(
          words,
          { autoAlpha: 0, y: 18, color: primary },
          {
            autoAlpha: 1,
            y: 0,
            color: (_i, target) => resting.get(target) ?? "#191919",
            duration: 0.7,
            stagger: 0.07,
            ease: "power3.out",
          },
          from + arrive * 0.2
        );

        if (body) {
          tl.fromTo(
            body,
            { autoAlpha: 0, y: 14, color: primary },
            {
              autoAlpha: 1,
              y: 0,
              color: resting.get(body) ?? "#191919",
              duration: 0.7,
              ease: "power3.out",
            },
            from + arrive * 0.55
          );
        }

        // Out, so the next scene arrives on a clear frame.
        tl.to(
          caption,
          { autoAlpha: 0, y: -26, duration: leave, ease: "power2.in" },
          to - leave
        );
      });

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
    }, section);

    return () => ctx.revert();
  }, []);

  // The opening headline reveals once the loading screen clears. It rides on
  // the lines themselves, not on the wrapper the scrubbed timeline drives, so
  // the two never write to the same element.
  useEffect(() => {
    const heading = headingRef.current;
    if (!heading) return;

    const lines = [...heading.children];
    gsap.set(lines, { autoAlpha: 0, y: 40 });
    return onLoaderDone(() => {
      gsap.to(lines, {
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
    // The two cuts are nearly the same height for opposite reasons. Desktop
    // spends 440vh on 28.4s of footage; the phone spends 400vh on 13.6s, which
    // is close to twice the scroll per second — but its cut has the same five
    // scenes packed into half the runtime, so scene for scene the two end up
    // costing about the same to get through. These heights are the single
    // source of truth: the timeline measures the section rather than restating
    // them.
    <section
      ref={sectionRef}
      className="relative h-[640vh] max-md:h-[600vh]"
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

        {/* Opening headline — centred, dark against the near-white footage */}
        <div className="absolute inset-0 z-20 flex items-center justify-center px-6 text-center">
          <div ref={introRef} className="max-w-5xl">
            <h1
              ref={headingRef}
              className="font-heading font-semibold text-[3rem] leading-[1.12] text-text sm:text-[3.5rem] md:text-[5rem] lg:text-[6.25rem]"
            >
              <span className="block">
                سجّل طريقك، ودع <span className="text-primary">مسار</span>
              </span>
              <span className="block">يرصد كل حفرة فيه</span>
            </h1>
          </div>
        </div>

        {/* Scene captions. Each one carries its cue in both cuts and where it
            sits on the stage in each; Hero's timeline reads all of it back off
            the DOM.

            The phone cut dissolves between scenes at 2.5 / 5.2 / 8.6 / 11.1s,
            so its cues sit inside those and clear of the dissolves. It also
            draws labels of its own — a recording chip, a detection read-out, a
            map card, a verified badge — hard against the frame's edges, and
            those are what the phone positions below are keeping clear of. */}
        <div className="absolute inset-0 z-10">
          {/* Desk buried in paper. It sits across the middle of the phone
              frame, so the caption drops into the lower half and leaves the
              pile above it to carry the scene. */}
          <SceneCaption
            from={0.2}
            to={3.9}
            position="top-[26%] left-[14%] w-96 max-md:top-[60%] max-md:left-1/2 max-md:w-[86vw] max-md:-translate-x-1/2"
            mobileFrom={0.1}
            mobileTo={2.25}
            title="بلاغات بلا نظام"
          >
            مكالمات وأوراق ورسائل متفرّقة تتكدّس على مكتب واحد، فيضيع أغلبها قبل
            أن يصل إلى من يملك إصلاح الطريق.
          </SceneCaption>

          {/* Cabin, with the phone clamped to the windscreen. The recording
              chip rides the top-right corner and the wheel fills the bottom
              third, so the caption takes the windscreen between them. */}
          <SceneCaption
            from={4.2}
            to={9}
            position="top-[17%] left-1/2 w-104 -translate-x-1/2 max-md:top-[31%] max-md:w-[86vw]"
            mobileFrom={2.7}
            mobileTo={5}
            title="ابدأ بالقيادة فقط"
          >
            ثبّت هاتفك وافتح مسار. لا استمارات ولا بلاغات — رحلتك اليومية نفسها
            تتحوّل إلى مسحٍ مستمر للطريق.
          </SceneCaption>

          {/* The cracks and their read-out cross the middle of the frame and
              the coordinates run along the bottom, so the caption rides high —
              on the phone it takes the top of the stage, clear of both. */}
          <SceneCaption
            from={9.3}
            to={17}
            position="top-1/2 left-[6%] w-96 -translate-y-1/2 max-md:top-[18%] max-md:left-1/2 max-md:w-[86vw] max-md:-translate-x-1/2 max-md:translate-y-0"
            mobileFrom={5.45}
            mobileTo={8.25}
            title="الكاميرا ترى ما يفوت العين"
          >
            يرصد الذكاء الاصطناعي كل حفرة وشقّ أثناء المرور، ويسجّل موقعه وحجمه
            ودرجة خطورته لحظة بلحظة.
          </SceneCaption>

          {/* Over the operator's shoulder at the dashboard. The map card
              hangs in the upper half of the phone frame and the operator fills
              the lower one, so on desktop the caption sits low on the
              shoulder, and on the phone it rides the very top of the stage,
              above the card. */}
          <SceneCaption
            from={17.3}
            to={23}
            position="top-[63%] left-1/2 w-104 -translate-x-1/2 max-md:top-[4%] max-md:w-[86vw]"
            mobileFrom={8.9}
            mobileTo={10.75}
            title="خريطة واحدة تُرتّب الأولويات"
          >
            تصل كل الأضرار إلى لوحة تحكّم واحدة، مصنّفة حسب الخطورة ومرتّبة في
            خطة عمل توجّه الفرق إلى الأهم أولًا.
          </SceneCaption>

          {/* The inspector standing over the sealed hole, verified badge at
              his feet. He runs from the upper third to the bottom of the phone
              frame, so the caption takes the sky above his head. */}
          <SceneCaption
            from={23.3}
            to={28.36}
            position="top-1/2 right-[7%] w-96 -translate-y-1/2 max-md:top-[11%] max-md:right-auto max-md:left-1/2 max-md:w-[86vw] max-md:-translate-x-1/2 max-md:translate-y-0"
            mobileFrom={11.45}
            mobileTo={13.6}
            title="إصلاحٌ موثَّق بالدليل"
          >
            يوثّق الفريق العمل من الميدان بصورة قبل وبعد، فيُغلق البلاغ بدليل
            واضح — لا وعود، بل طرق مُصلَحة.
          </SceneCaption>
        </div>
      </div>
    </section>
  );
}
