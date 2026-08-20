"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { onLoaderDone } from "../Loader/loaderSignal";
import { signalHeroVideoReady } from "./heroVideoSignal";
import SceneCaption from "./SceneCaption";

gsap.registerPlugin(ScrollTrigger);

// Runtime of the hero footage, in seconds. The scrubbed timeline runs one unit
// per second of video, so every caption cue below can be written in video time.
const FOOTAGE = 28.36;

// Timeline units spent on the opening headline clearing out before the footage
// starts moving. At ~14vh of scroll per unit that's a little under half a
// screen — one flick of the wheel and the stage is handed over to the video.
const INTRO = 3;

// How long a caption takes to arrive and to leave, again in units/video-seconds.
const IN = 0.8;
const OUT = 0.5;

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const subheadRef = useRef<HTMLParagraphElement>(null);

  // A scroll-driven video never plays: it is seeked. Browsers only allow that
  // once the element has been handed to the decoder, and iOS in particular will
  // sit on the poster until then — so start it muted and immediately pause,
  // and try again on the first touch in case autoplay was refused.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const prime = () => {
      const played = video.play();
      if (played) played.then(() => video.pause()).catch(() => {});
    };

    prime();
    window.addEventListener("touchstart", prime, { once: true, passive: true });

    // Tell the loading screen when there's enough buffered to scrub against.
    // `error` counts as ready too: a clip that will never arrive shouldn't hold
    // the page shut waiting for it.
    const ready = () => signalHeroVideoReady();
    if (video.readyState >= 4) ready();
    video.addEventListener("canplaythrough", ready);
    video.addEventListener("error", ready);

    return () => {
      window.removeEventListener("touchstart", prime);
      video.removeEventListener("canplaythrough", ready);
      video.removeEventListener("error", ready);
    };
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    const video = videoRef.current;
    if (!section || !stage || !video) return;

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

      // The playhead is a plain object the timeline scrubs; writing it onto the
      // element is throttled to roughly a frame's worth of footage so a fast
      // fling doesn't queue up seeks the decoder can't service.
      const playhead = { t: 0 };
      tl.to(
        playhead,
        {
          t: FOOTAGE,
          duration: FOOTAGE,
          ease: "none",
          onUpdate: () => {
            if (video.readyState < 1) return;
            const end = (video.duration || FOOTAGE) - 0.05;
            const next = Math.min(Math.max(playhead.t, 0), end);
            if (Math.abs(video.currentTime - next) < 1 / 50) return;
            video.currentTime = next;
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
        // The plate keeps its own corners while it wipes open, so the radius
        // comes from the element rather than being restated here.
        const radius = getComputedStyle(caption).borderTopLeftRadius;

        // The plate wipes open from the start side (right, in RTL)…
        tl.fromTo(
          caption,
          {
            autoAlpha: 0,
            y: 26,
            clipPath: `inset(0% 0% 0% 100% round ${radius})`,
          },
          {
            autoAlpha: 1,
            y: 0,
            clipPath: `inset(0% 0% 0% 0% round ${radius})`,
            duration: IN,
            ease: "power3.out",
          },
          from
        );

        // …the primary marks pop in behind the wipe…
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
          from + 0.25
        );

        // …and the words rise word by word, each shading from primary to white.
        tl.fromTo(
          words,
          { autoAlpha: 0, y: 18, color: primary },
          {
            autoAlpha: 1,
            y: 0,
            color: (_i, target) => resting.get(target) ?? "#f7f8f7",
            duration: 0.7,
            stagger: 0.07,
            ease: "power3.out",
          },
          from + 0.15
        );

        if (body) {
          tl.fromTo(
            body,
            { autoAlpha: 0, y: 14, color: primary },
            {
              autoAlpha: 1,
              y: 0,
              color: resting.get(body) ?? "#b1b4b1",
              duration: 0.7,
              ease: "power3.out",
            },
            from + 0.45
          );
        }

        // Out, so the next scene arrives on a clear frame.
        tl.to(
          caption,
          { autoAlpha: 0, y: -26, scale: 0.97, duration: OUT, ease: "power2.in" },
          to - OUT
        );
      });
    }, section);

    return () => ctx.revert();
  }, []);

  // The opening headline reveals once the loading screen clears. It rides on
  // the lines themselves, not on the wrapper the scrubbed timeline drives, so
  // the two never write to the same element.
  useEffect(() => {
    const heading = headingRef.current;
    const subhead = subheadRef.current;
    if (!heading || !subhead) return;

    const lines = [...heading.children, ...subhead.children];
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
        {/* The story itself. Never played — the scroll position seeks it. The
            encodes carry a keyframe every 5 frames so those seeks land
            instantly; phones get the lighter one. */}
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          muted
          playsInline
          preload="auto"
          poster="/assets/Hero/0819.poster.webp"
          aria-hidden="true"
        >
          <source
            src="/assets/Hero/0819.scrub.mobile.mp4"
            media="(max-width: 767px)"
            type="video/mp4"
          />
          <source src="/assets/Hero/0819.scrub.mp4" type="video/mp4" />
        </video>

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
            <p
              ref={subheadRef}
              className="mx-auto mt-6 max-w-2xl font-sans text-t3 leading-relaxed text-subtext md:mt-9 md:text-t2 lg:text-t1"
            >
              <span className="block">منصّة ذكية ترصد أضرار الطرق تلقائيًا</span>
              {/* The deep layer, not the flat primary — the footage behind this
                  line is near-white, where #34A8D8 all but disappears. */}
              <span className="block text-primary-700">
                وتحوّلها إلى خطة إصلاح مُنظّمة وقابلة للمتابعة.
              </span>
            </p>
          </div>
        </div>

        {/* Scene captions. Each one names the slice of footage it belongs to and
            where it sits on the stage; Hero's timeline reads both back off the
            DOM. Phones centre every card and only vary its height. */}
        <div className="absolute inset-0 z-10">
          <SceneCaption
            from={0.2}
            to={3.9}
            position="top-[26%] left-[14%] w-96 max-md:top-[15%] max-md:left-1/2 max-md:w-[86vw] max-md:-translate-x-1/2"
            title="بلاغات بلا نظام"
          >
            مكالمات وأوراق ورسائل متفرّقة تتكدّس على مكتب واحد، فيضيع أغلبها قبل
            أن يصل إلى من يملك إصلاح الطريق.
          </SceneCaption>

          <SceneCaption
            from={4.2}
            to={9}
            position="top-[17%] left-1/2 w-104 -translate-x-1/2 max-md:top-[14%] max-md:w-[86vw]"
            title="ابدأ بالقيادة فقط"
          >
            ثبّت هاتفك وافتح مسار. لا استمارات ولا بلاغات — رحلتك اليومية نفسها
            تتحوّل إلى مسحٍ مستمر للطريق.
          </SceneCaption>

          <SceneCaption
            from={9.3}
            to={17}
            position="top-1/2 left-[6%] w-96 -translate-y-1/2 max-md:left-1/2 max-md:w-[86vw] max-md:-translate-x-1/2"
            title="الكاميرا ترى ما يفوت العين"
          >
            يرصد الذكاء الاصطناعي كل حفرة وشقّ أثناء المرور، ويسجّل موقعه وحجمه
            ودرجة خطورته لحظة بلحظة.
          </SceneCaption>

          <SceneCaption
            from={17.3}
            to={23}
            position="top-[63%] left-1/2 w-104 -translate-x-1/2 max-md:top-auto max-md:bottom-[10%] max-md:w-[86vw]"
            title="خريطة واحدة تُرتّب الأولويات"
          >
            تصل كل الأضرار إلى لوحة تحكّم واحدة، مصنّفة حسب الخطورة ومرتّبة في
            خطة عمل توجّه الفرق إلى الأهم أولًا.
          </SceneCaption>

          <SceneCaption
            from={23.3}
            to={28.36}
            position="top-1/2 right-[7%] w-96 -translate-y-1/2 max-md:right-auto max-md:left-1/2 max-md:w-[86vw] max-md:-translate-x-1/2"
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
