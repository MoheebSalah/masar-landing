"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PlayIcon, PauseIcon, LogoArrow } from "./Icons";

gsap.registerPlugin(ScrollTrigger);

// Detection clips shown in the carousel, in display order.
const VIDEOS = [
  "/assets/Carousel/Carousel 1.mp4",
  "/assets/Carousel/Carousel 2.webm",
  "/assets/Carousel/Carousel 3.webm",
  "/assets/Carousel/Carousel 4.webm",
  "/assets/Carousel/Carousel 5.mp4",
];

// How the outgoing/incoming clips look at one full step from centre: pushed a
// full frame width aside (so at rest they sit off-stage and are clipped),
// shrunk, faded and blurred. Everything eases back to zero at the centre.
const SHRINK = 0.16; // scale drop at one step out
const FADE = 0.72; // opacity drop at one step out
const BLUR = 10; // px of blur at one step out

const mod = (value: number, n: number) => ((value % n) + n) % n;

export default function SeeInAction() {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  // Unbounded virtual index — its remainder over VIDEOS.length is the clip on
  // screen; letting it run past the ends is what makes the loop seam-free.
  const activeRef = useRef(0);
  // Distance one step moves a clip: a full viewport width, so a leaving clip
  // travels clear off the screen's edge (not just the frame's) and the arriving
  // one enters from the opposite screen edge.
  const travelRef = useRef(0);
  // Reused across settles so a new click mid-animation can kill the tween.
  const proxyRef = useRef({ v: 0 });
  const inViewRef = useRef(false);
  const cursorTo = useRef<{ x: gsap.QuickToFunc; y: gsap.QuickToFunc } | null>(
    null,
  );

  const [active, setActive] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [cursorShown, setCursorShown] = useState(false);

  // Draw the track for a (possibly fractional) virtual position. Each slide is
  // a frame-sized copy centred by xPercent -50; adding signed × one viewport
  // width shifts it a whole screen per step, so at rest the neighbours sit fully
  // off the screen's edges (the section's overflow clip hides them). As a copy
  // nears the centre it slides in from the screen edge while it un-shrinks,
  // un-fades and un-blurs — and reverses on the way out.
  const render = (virtual: number) => {
    const n = VIDEOS.length;
    const travel = travelRef.current;
    slideRefs.current.forEach((slide, i) => {
      if (!slide) return;
      let signed = i - virtual;
      signed -= n * Math.round(signed / n);
      const dist = Math.abs(signed);
      const t = Math.min(dist, 1);
      gsap.set(slide, {
        xPercent: -50,
        x: signed * travel,
        scale: 1 - t * SHRINK,
        opacity: 1 - t * FADE,
        filter: `blur(${(t * BLUR).toFixed(2)}px)`,
        zIndex: Math.round(100 - dist * 10),
        pointerEvents: dist < 0.5 ? "auto" : "none",
      });
    });
  };

  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    const cursor = cursorRef.current;
    if (!section || !stage || !cursor) return;

    const measure = () => {
      travelRef.current = window.innerWidth;
      render(activeRef.current);
    };
    measure();
    window.addEventListener("resize", measure);

    cursorTo.current = {
      x: gsap.quickTo(cursor, "x", { duration: 0.2, ease: "power3.out" }),
      y: gsap.quickTo(cursor, "y", { duration: 0.2, ease: "power3.out" }),
    };

    // Auto-play the selected clip when the section scrolls into view, and pause
    // it once the section leaves. Only the centre clip is ever touched.
    const observer = new IntersectionObserver(
      ([entry]) => {
        inViewRef.current = entry.isIntersecting;
        const video = videoRefs.current[mod(activeRef.current, VIDEOS.length)];
        if (!video) return;
        if (entry.isIntersecting) video.play().catch(() => {});
        else if (!video.paused) video.pause();
      },
      { threshold: 0.5 },
    );
    observer.observe(section);

    // Reveal the heading and sub-line as the section scrolls into view.
    const ctx = gsap.context(() => {
      const headingEls = headingRef.current
        ? Array.from(headingRef.current.children)
        : [];
      gsap.from(headingEls, {
        y: 24,
        autoAlpha: 0,
        duration: 0.6,
        ease: "power2.out",
        stagger: 0.12,
        scrollTrigger: { trigger: section, start: "top 75%", once: true },
      });
    }, section);

    return () => {
      window.removeEventListener("resize", measure);
      observer.disconnect();
      cursorTo.current = null;
      ctx.revert();
    };
  }, []);

  const togglePlay = () => {
    const video = videoRefs.current[mod(activeRef.current, VIDEOS.length)];
    if (!video) return;
    if (video.paused) video.play().catch(() => {});
    else video.pause();
  };

  // Settle onto a virtual target from whatever direction it points. The leaving
  // clip pauses (it stays mounted, so its progress survives); the arriving clip
  // starts playing if the section is on screen.
  const settle = (toVirtual: number) => {
    const from = activeRef.current;
    if (toVirtual === from) return;
    const leaving = videoRefs.current[mod(from, VIDEOS.length)];
    if (leaving && !leaving.paused) leaving.pause();

    activeRef.current = toVirtual;
    const real = mod(toVirtual, VIDEOS.length);
    setActive(real);
    const arriving = videoRefs.current[real];
    if (arriving && inViewRef.current) arriving.play().catch(() => {});

    const proxy = proxyRef.current;
    gsap.killTweensOf(proxy);
    proxy.v = from;
    gsap.to(proxy, {
      v: toVirtual,
      duration: 0.6,
      ease: "power3.out",
      onUpdate: () => render(proxy.v),
    });
  };

  // Step one clip forward (+1: current slides left, next arrives from the
  // right) or back (-1). The virtual index loops, so it never runs out.
  const step = (dir: 1 | -1) => settle(activeRef.current + dir);

  // Jump to a real clip index by the shortest way round the loop (dots).
  const goTo = (realTarget: number) => {
    const n = VIDEOS.length;
    let delta = realTarget - mod(activeRef.current, n);
    delta -= n * Math.round(delta / n);
    settle(activeRef.current + delta);
  };

  // Trail the play/pause glyph on the pointer while it is over the stage.
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const stage = stageRef.current;
    if (!stage || !cursorTo.current) return;
    const rect = stage.getBoundingClientRect();
    cursorTo.current.x(e.clientX - rect.left);
    cursorTo.current.y(e.clientY - rect.top);
    setCursorShown(true);
  };

  return (
    <section
      ref={sectionRef}
      id="see-in-action"
      className="w-full overflow-hidden bg-dark py-24"
    >
      {/* Section heading */}
      <div ref={headingRef} className="mx-auto mb-14 max-w-3xl px-8 text-center">
        <h2 className="font-heading text-h2 text-text-dark">شاهدها أثناء العمل</h2>
        <p className="mx-auto mt-4 max-w-xl font-sans text-t2 text-subtext-dark">
          مقاطع حقيقية توضّح كيف يرصد النظام الحفر ويصنّف خطورتها لحظة بلحظة.
        </p>
      </div>

      {/* Video frame + viewfinder brackets */}
      <div className="mx-auto w-full max-w-[1500px] px-8">
        <div className="relative">
          {/* Stage: a fixed 16:9 frame the centre clip fills. It is NOT clipped
              — the leaving/arriving clips slide right across the screen and are
              clipped only at the viewport by the section's overflow. `z-0` makes
              it a stacking context so the corner brackets stay above every clip.
              dir=ltr keeps the array order running left-to-right for the slide. */}
          <div
            ref={stageRef}
            dir="ltr"
            className="relative z-0 aspect-video w-full cursor-none select-none"
            onPointerMove={onPointerMove}
            onPointerLeave={() => setCursorShown(false)}
            onClick={togglePlay}
          >
            {VIDEOS.map((src, i) => (
              <div
                key={src}
                ref={(el) => {
                  slideRefs.current[i] = el;
                }}
                className="absolute left-1/2 top-0 h-full w-full"
              >
                <video
                  ref={(el) => {
                    videoRefs.current[i] = el;
                    // Set the property directly — browsers only permit scroll-in
                    // autoplay when muted, and React's `muted` attribute is unreliable.
                    if (el) el.muted = true;
                  }}
                  src={src}
                  // object-cover locks every clip into the same frame no matter
                  // its own resolution or aspect ratio. The rounding lives on the
                  // video itself now that the stage no longer clips.
                  className="h-full w-full rounded-2xl object-cover shadow-lg"
                  preload="metadata"
                  muted
                  playsInline
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
              </div>
            ))}

            {/* Custom cursor: the play/pause glyph trailing the pointer. Both
                stay mounted and cross-fade so switching never jumps. */}
            <div
              ref={cursorRef}
              className={`pointer-events-none absolute left-0 top-0 z-[200] text-white transition-opacity duration-200 ${
                cursorShown ? "opacity-100" : "opacity-0"
              }`}
            >
              <PlayIcon
                className={`absolute left-0 top-0 h-24 w-24 -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ease-out ${
                  isPlaying ? "scale-50 opacity-0" : "scale-100 opacity-100"
                }`}
              />
              <PauseIcon
                className={`absolute left-0 top-0 h-24 w-24 -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ease-out ${
                  isPlaying ? "scale-100 opacity-100" : "scale-50 opacity-0"
                }`}
              />
            </div>
          </div>

          {/* Viewfinder brackets: a short primary outline hugging each corner,
              like a capture frame. Sits a clear gap outside the frame; its corner
              radius (video's 16px + the 20px gap = 36px) keeps the curve
              concentric with the video's rounded corners. */}
          <div className="pointer-events-none absolute -inset-5 z-30">
            <span className="absolute left-0 top-0 h-14 w-14 rounded-tl-[36px] border-l-2 border-t-2 border-primary" />
            <span className="absolute right-0 top-0 h-14 w-14 rounded-tr-[36px] border-r-2 border-t-2 border-primary" />
            <span className="absolute bottom-0 left-0 h-14 w-14 rounded-bl-[36px] border-b-2 border-l-2 border-primary" />
            <span className="absolute bottom-0 right-0 h-14 w-14 rounded-br-[36px] border-b-2 border-r-2 border-primary" />
          </div>
        </div>

        {/* Controls: prev/next arrows (the logo's chevron) around a dot
            indicator. The left button steps to the clip on the left, the right
            button to the clip on the right. Each arrow points the way the strip
            slides — left button → strip slides right, right button → slides
            left — so the glyphs face opposite their button's side. */}
        <div dir="ltr" className="mt-10 flex items-center justify-center gap-6">
          <button
            type="button"
            aria-label="المقطع السابق"
            onClick={() => step(-1)}
            className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-full bg-text-dark/5 text-primary transition-colors duration-200 hover:bg-text-dark/10"
          >
            <LogoArrow className="h-10 w-10 rotate-90" />
          </button>

          <div className="flex items-center gap-3">
            {VIDEOS.map((src, i) => (
              <button
                key={src}
                type="button"
                aria-label={`المقطع ${i + 1}`}
                onClick={() => goTo(i)}
                className={`h-2.5 cursor-pointer rounded-full transition-all duration-300 ${
                  i === active
                    ? "w-9 bg-primary"
                    : "w-2.5 bg-text-dark/25 hover:bg-text-dark/50"
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            aria-label="المقطع التالي"
            onClick={() => step(1)}
            className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-full bg-text-dark/5 text-primary transition-colors duration-200 hover:bg-text-dark/10"
          >
            <LogoArrow className="h-10 w-10 -rotate-90" />
          </button>
        </div>
      </div>
    </section>
  );
}
