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

    // Whatever it takes to do the upscale exactly once. Phones show about a
    // quarter of the frame's width across the whole screen, so the picture is
    // always enlarged somewhere; capping the backing store below the screen's
    // own pixel ratio doesn't avoid that, it just splits one enlargement into
    // two (canvas, then the browser), and two come out softer than one. A 3x
    // phone therefore gets a 3x canvas. Desktop stays at 2x because it is
    // already drawing the frame larger than the source at that point, so more
    // backing pixels buy nothing and cost fill rate.
    const sequence = new FrameSequence(canvas, urls, phone ? 3 : 2);
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

      // The opening headline lifts away the moment scrolling starts.
      tl.to(
        introRef.current,
        { autoAlpha: 0, y: -70, scale: 0.94, duration: INTRO, ease: "power2.in" },
        0
      );

      // Phones can't hold the frame's width, so they show a slice of it and
      // slide that window sideways through each shot — see `mobilePan` on the
      // scene tags below. The window position is read straight off the
      // playhead rather than tweened alongside it: a scrub runs both ways, and
      // one function of time can't fall out of step with the frame on screen
      // the way a second set of overlapping tweens could.
      const phone = window.matchMedia("(max-width: 767px)").matches;
      const pans = phone
        ? captions.map(
            (caption) =>
              JSON.parse(caption.dataset.mobilePan ?? "{}") as {
                cut: number;
                from: number;
                to: number;
                span?: number;
              }
          )
        : [];

      const glide = gsap.parseEase("power1.inOut");
      const panAt = (t: number) => {
        let i = pans.length - 1;
        while (i > 0 && t < pans[i].cut) i -= 1;
        const shot = (i + 1 < pans.length ? pans[i + 1].cut : FOOTAGE) - pans[i].cut;
        const travelled = gsap.utils.clamp(
          0,
          1,
          (t - pans[i].cut) / (shot * (pans[i].span ?? 1))
        );
        return pans[i].from + (pans[i].to - pans[i].from) * glide(travelled);
      };

      // The playhead is a plain object the timeline scrubs, kept in footage
      // seconds so it shares units with the caption cues. Each update just
      // names a frame; the sequence coalesces requests on its own, so calling
      // this on every scroll frame costs nothing.
      const playhead = { t: 0 };
      if (phone) sequenceRef.current?.setPan(panAt(0));
      tl.to(
        playhead,
        {
          t: FOOTAGE,
          duration: FOOTAGE,
          ease: "none",
          onUpdate: () => {
            const sequence = sequenceRef.current;
            if (!sequence) return;
            if (phone) sequence.setPan(panAt(playhead.t));
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
        const lap = IN * 1.3;
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
    // Tall enough to hold the whole scrubbed run: one screen of stage, ~14vh of
    // scroll per second of footage, and a closing screen the picture spends
    // dissolving into the statement while the stage stays stuck behind it.
    // Phones get a shorter run so the story isn't a marathon of swipes. These
    // heights are the single source of truth — the timeline measures the
    // section rather than restating them.
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
            the zero-padded frame number. Phones get the same framing at the
            footage's native width and a leaner bitrate — they magnify a
            quarter of it across the whole screen, so detail is what they need
            and spare resolution is worth more to them than spare bits. The
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
            where it sits on the stage, and — on phones — where the viewing
            window opens on the frame and how far it travels while the shot
            runs. Hero's timeline reads all of it back off the DOM. */}
        <div className="absolute inset-0 z-10">
          {/* Held on the desk, dead centre — the framing the phone already
              showed, and the only one this scene needs. The desk fills the
              middle of the frame and the strewn paper runs to the bottom
              edge, so the caption sits low over the paper rather than in the
              empty sky above it. */}
          <SceneCaption
            from={0.2}
            to={3.9}
            position="top-[26%] left-[14%] w-96 max-md:top-auto max-md:bottom-[9%] max-md:left-1/2 max-md:w-[86vw] max-md:-translate-x-1/2"
            mobilePan={{ cut: 0, from: 0.5, to: 0.5 }}
            title="بلاغات بلا نظام"
          >
            مكالمات وأوراق ورسائل متفرّقة تتكدّس على مكتب واحد، فيضيع أغلبها قبل
            أن يصل إلى من يملك إصلاح الطريق.
          </SceneCaption>

          {/* Opens hard left on the driver and rides across the cabin to the
              phone clamped to the windscreen — the shot's own subject, and the
              one a centred crop cuts in half. The phone's screen spans
              0.680–0.842 of the frame and its mount a little past both, so
              0.762 is the middle of it: settle there and the whole prop clears
              either edge whatever slice the viewport takes. */}
          <SceneCaption
            from={4.2}
            to={9}
            position="top-[17%] left-1/2 w-104 -translate-x-1/2 max-md:top-[14%] max-md:w-[86vw]"
            mobilePan={{ cut: 4.05, from: 0, to: 0.762, span: 0.9 }}
            title="ابدأ بالقيادة فقط"
          >
            ثبّت هاتفك وافتح مسار. لا استمارات ولا بلاغات — رحلتك اليومية نفسها
            تتحوّل إلى مسحٍ مستمر للطريق.
          </SceneCaption>

          {/* Parked over the lane the detections land in. The road rushes at
              the camera on its own here, so a pan would only fight it. The
              caption rides high, just under the horizon: everything this scene
              has to show crosses the lower two thirds. */}
          <SceneCaption
            from={9.3}
            to={17}
            position="top-1/2 left-[6%] w-96 -translate-y-1/2 max-md:top-[15%] max-md:left-1/2 max-md:w-[86vw] max-md:-translate-x-1/2 max-md:translate-y-0"
            mobilePan={{ cut: 9.15, from: 0.625, to: 0.625 }}
            title="الكاميرا ترى ما يفوت العين"
          >
            يرصد الذكاء الاصطناعي كل حفرة وشقّ أثناء المرور، ويسجّل موقعه وحجمه
            ودرجة خطورته لحظة بلحظة.
          </SceneCaption>

          {/* Starts behind the inspector's head and travels the width of the
              monitor, arriving on the pinned report and the pothole photo
              beside it just as the map zooms in. */}
          <SceneCaption
            from={17.3}
            to={23}
            position="top-[63%] left-1/2 w-104 -translate-x-1/2 max-md:top-auto max-md:bottom-[10%] max-md:w-[86vw]"
            mobilePan={{ cut: 17.2, from: 0.16, to: 0.685, span: 0.9 }}
            title="خريطة واحدة تُرتّب الأولويات"
          >
            تصل كل الأضرار إلى لوحة تحكّم واحدة، مصنّفة حسب الخطورة ومرتّبة في
            خطة عمل توجّه الفرق إلى الأهم أولًا.
          </SceneCaption>

          {/* Leaves the inspector for the pothole inside the first third of
              the shot — the hole seals over a second and a half in, so the
              window has to be there to catch it — then holds for the tick.
              That pins the caption to the middle of the phone's screen rather
              than an edge: the pothole sits in the bottom sixth of the frame
              and the tick lands in the top third, and this is the empty
              stretch of road between them. */}
          <SceneCaption
            from={23.3}
            to={28.36}
            position="top-1/2 right-[7%] w-96 -translate-y-1/2 max-md:top-[44%] max-md:right-auto max-md:left-1/2 max-md:w-[86vw] max-md:-translate-x-1/2 max-md:translate-y-0"
            mobilePan={{ cut: 23.25, from: 0.325, to: 0.605, span: 0.32 }}
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
