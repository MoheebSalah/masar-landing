"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { onLoaderDone } from "../Loader/loaderSignal";
import { signalHeroFootageReady } from "./heroFootageSignal";
import FrameSequence from "./FrameSequence";
import SceneCaption from "./SceneCaption";

gsap.registerPlugin(ScrollTrigger);

// Runtime of the hero footage, in seconds. The scrubbed timeline runs one unit
// per second of footage, so every caption cue below can be written in the same
// units as the story — the sequence index is derived from it.
const FOOTAGE = 28.36;

// Enough of the run downloaded, front to back, to hand the stage over. The rest
// keeps arriving behind the visitor as they scroll; until a frame lands the
// canvas holds the closest one it already has.
const READY_FRACTION = 0.14;

// Timeline units spent on the opening headline clearing out before the footage
// starts moving. At ~14vh of scroll per unit that's a little under half a
// screen — one flick of the wheel and the stage is handed to the footage.
const INTRO = 3;

// How long a caption takes to arrive and to leave, again in footage seconds.
const IN = 0.8;
const OUT = 0.5;

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
    const count = Number(canvas.dataset.frames);
    if (!template || !count) return;

    const urls = Array.from({ length: count }, (_, i) =>
      template.replace("[n]", String(i + 1).padStart(4, "0"))
    );

    // 2x on both. The source resolution, not the backing store, is what caps
    // sharpness — scene three shows a quarter of the frame's width across the
    // whole screen, so it is always upscaled somewhere. A smaller backing
    // store doesn't avoid that, it just splits the upscale into two steps
    // (canvas, then the browser), which comes out softer than doing it once.
    const sequence = new FrameSequence(canvas, urls, 2);
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
          // itself, the other is the run the statement card needs to climb the
          // screen while the stage stays stuck behind it. The footage therefore
          // lands on its last frame exactly as the card starts to rise — no
          // stretch of scrolling where nothing moves.
          //
          // Measured off the stage, not window.innerHeight: the section height
          // and the card's negative margin are both in vh, and on phones those
          // two disagree whenever the URL bar is showing.
          end: () => `+=${section.offsetHeight - stage.offsetHeight * 2}`,
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
      });

      // The opening headline lifts away the moment scrolling starts.
      tl.to(
        introRef.current,
        { autoAlpha: 0, y: -70, scale: 0.94, duration: INTRO, ease: "power2.in" },
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
          t: FOOTAGE,
          duration: FOOTAGE,
          ease: "none",
          onUpdate: () => {
            const sequence = sequenceRef.current;
            if (!sequence) return;
            const progress = Math.min(Math.max(playhead.t / FOOTAGE, 0), 1);
            sequence.seek(progress * (sequence.length - 1));
          },
        },
        INTRO
      );

      // Captions. Every cue is read off the markup, so the scene text and its
      // timing stay together in the JSX below.
      captions.forEach((caption) => {
        const from = INTRO + Number(caption.dataset.from);
        const to = INTRO + Number(caption.dataset.to);
        const words = caption.querySelectorAll("[data-scene-word]");
        const body = caption.querySelector("[data-scene-body]");
        const accents = caption.querySelectorAll("[data-scene-accent]");

        // A gate rather than an animation, and the one tween that keeps every
        // other scene's text off the frame. A staggered fromTo only renders its
        // "from" state for the first target, so the words and marks below can't
        // be trusted to start hidden on their own — this single un-staggered
        // tween covers the whole block.
        tl.fromTo(
          caption,
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 0.2, ease: "none" },
          from
        );

        // With no plate to reveal, the type does its own arriving: the primary
        // marks pop in first…
        tl.fromTo(
          accents,
          { scale: 0, autoAlpha: 0 },
          {
            scale: 1,
            autoAlpha: 1,
            duration: 0.45,
            stagger: 0.08,
            ease: "back.out(2.2)",
          },
          from
        );

        // …then the words rise one by one, each shading out of primary and
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
          from + IN * 0.2
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
            from + IN * 0.55
          );
        }

        // Out, so the next scene arrives on a clear frame.
        tl.to(
          caption,
          { autoAlpha: 0, y: -26, duration: OUT, ease: "power2.in" },
          to - OUT
        );
      });

      // Phones reframe the footage scene by scene. The clip was shot for a
      // landscape stage, so running it full-bleed throughout wastes most of
      // every frame on a portrait screen — instead each scene gets the slice
      // that carries its story, in a box sized to suit it, with the rest of
      // the screen frosted over. Desktop never touches this: leaving the
      // layout unset keeps the sequence filling the canvas as before.
      if (window.matchMedia("(max-width: 767px)").matches) {
        const framings = captions.map((caption) => {
          const raw = JSON.parse(caption.dataset.mobileFrame ?? "{}") as {
            band: [number, number];
            box: [number, number, number, number];
            radius: number;
          };
          return {
            sx: raw.band[0],
            sy: 0,
            sw: raw.band[1],
            sh: 1,
            dx: raw.box[0],
            dy: raw.box[1],
            dw: raw.box[2],
            dh: raw.box[3],
            radius: raw.radius,
          };
        });

        // One live object the timeline tweens. Every number moves at once, so
        // the box glides and resizes while the crop pans across the frame —
        // a camera move between scenes rather than a cut or a cross-fade.
        const live = { ...framings[0] };
        const apply = () => sequenceRef.current?.setLayout(live);
        apply();

        for (let i = 1; i < framings.length; i++) {
          // Starts as the outgoing caption begins to leave and settles just
          // after the incoming one starts writing itself on, so the reframe
          // happens in the space between the two.
          const leaves = INTRO + Number(captions[i - 1].dataset.to) - OUT;
          const arrives = INTRO + Number(captions[i].dataset.from) + IN * 0.5;
          tl.to(
            live,
            {
              ...framings[i],
              duration: arrives - leaves,
              ease: "power2.inOut",
              onUpdate: apply,
            },
            leaves
          );
        }
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
    // Tall enough to hold the whole scrubbed run: one screen of stage, ~14vh of
    // scroll per second of footage, and a closing screen the statement card
    // climbs while the stage stays stuck behind it. Phones get a shorter run so
    // the story isn't a marathon of swipes. These heights are the single source
    // of truth — the timeline measures the section rather than restating them.
    <section
      ref={sectionRef}
      className="relative h-[640vh] max-md:h-[560vh]"
    >
      {/* Stage height is 100vh on every screen, not dvh: the statement card
          pulls itself up by exactly this much, and a dvh stage would drift out
          of step with it every time a phone's URL bar slid away. */}
      <div ref={stageRef} className="sticky top-0 h-screen w-full overflow-hidden">
        {/* The story itself: 567 AVIF stills at 20fps rather than a video, so
            moving through it is a decode and never a seek. `[n]` stands in for
            the zero-padded frame number, and phones get the narrower set. The
            poster underneath shows frame one until the canvas has anything to
            paint. */}
        <canvas
          ref={canvasRef}
          data-frames={567}
          data-src="/assets/Hero/seq/[n].avif"
          data-mobile-src="/assets/Hero/seq-mobile/[n].avif"
          className="absolute inset-0 h-full w-full bg-[url('/assets/Hero/0819.poster.webp')] bg-cover bg-center max-md:bg-[url('/assets/Hero/0819.poster.mobile.webp')]"
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

        {/* Scene captions. Each one names the slice of footage it belongs to,
            where it sits on the stage, and — on phones — how the frame itself
            is cropped and boxed for that scene. Hero's timeline reads all of
            it back off the DOM. */}
        <div className="absolute inset-0 z-10">
          {/* Edge to edge, on the same portrait slice the phone showed before. */}
          <SceneCaption
            from={0.2}
            to={3.9}
            position="top-[26%] left-[14%] w-96 max-md:top-[15%] max-md:left-1/2 max-md:w-[86vw] max-md:-translate-x-1/2"
            mobileFrame={{ band: [0.242, 0.517], box: [0, 0, 1, 1], radius: 0 }}
            title="بلاغات بلا نظام"
          >
            مكالمات وأوراق ورسائل متفرّقة تتكدّس على مكتب واحد، فيضيع أغلبها قبل
            أن يصل إلى من يملك إصلاح الطريق.
          </SceneCaption>

          {/* A square of the frame's centre, run full width across the lower half. */}
          <SceneCaption
            from={4.2}
            to={9}
            position="top-[17%] left-1/2 w-104 -translate-x-1/2 max-md:top-[14%] max-md:w-[86vw]"
            mobileFrame={{ band: [0, 1], box: [0, 0.538, 1, 0.462], radius: 0 }}
            title="ابدأ بالقيادة فقط"
          >
            ثبّت هاتفك وافتح مسار. لا استمارات ولا بلاغات — رحلتك اليومية نفسها
            تتحوّل إلى مسحٍ مستمر للطريق.
          </SceneCaption>

          {/* The third of four equal columns — where the detection lands — run
              edge to edge. Its 0.44 aspect all but matches a phone screen. */}
          <SceneCaption
            from={9.3}
            to={17}
            position="top-1/2 left-[6%] w-96 -translate-y-1/2 max-md:top-[30%] max-md:left-1/2 max-md:w-[86vw] max-md:-translate-x-1/2 max-md:translate-y-0"
            mobileFrame={{ band: [0.5, 0.442], box: [0, 0, 1, 1], radius: 0 }}
            title="الكاميرا ترى ما يفوت العين"
          >
            يرصد الذكاء الاصطناعي كل حفرة وشقّ أثناء المرور، ويسجّل موقعه وحجمه
            ودرجة خطورته لحظة بلحظة.
          </SceneCaption>

          {/* The same centre square as scene two, this time flush to the top. */}
          <SceneCaption
            from={17.3}
            to={23}
            position="top-[63%] left-1/2 w-104 -translate-x-1/2 max-md:top-auto max-md:bottom-[10%] max-md:w-[86vw]"
            mobileFrame={{ band: [0, 1], box: [0, 0, 1, 0.462], radius: 0 }}
            title="خريطة واحدة تُرتّب الأولويات"
          >
            تصل كل الأضرار إلى لوحة تحكّم واحدة، مصنّفة حسب الخطورة ومرتّبة في
            خطة عمل توجّه الفرق إلى الأهم أولًا.
          </SceneCaption>

          {/* Wide enough to hold the inspector and the pothole together, which
              is what caps the box at 60% of the screen height: a taller one would be
              too portrait to keep both in shot. */}
          <SceneCaption
            from={23.3}
            to={28.36}
            position="top-1/2 right-[7%] w-96 -translate-y-1/2 max-md:top-auto max-md:right-auto max-md:bottom-[8%] max-md:left-1/2 max-md:w-[86vw] max-md:-translate-x-1/2 max-md:translate-y-0"
            mobileFrame={{ band: [0.047, 0.819], box: [0, 0, 1, 0.6], radius: 0 }}
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
