"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PlayIcon, PauseIcon, ChevronIcon, FullscreenIcon } from "./Icons";
import FullscreenPlayer from "./FullscreenPlayer";

gsap.registerPlugin(ScrollTrigger);

// Detection clips shown in the carousel, in display order.
const VIDEOS = [
  "/assets/Carousel/Carousel 1.mp4",
  "/assets/Carousel/Carousel 2.mp4",
  "/assets/Carousel/Carousel 3.mp4",
  "/assets/Carousel/Carousel 4.mp4",
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
  // Fired once, when the first clip has a frame ready — fades the stage in.
  const revealedRef = useRef(false);
  const cursorTo = useRef<{ x: gsap.QuickToFunc; y: gsap.QuickToFunc } | null>(
    null,
  );

  const [isPlaying, setIsPlaying] = useState(false);
  const [cursorShown, setCursorShown] = useState(false);
  // True while a clip is sliding to a new one — the mobile play/fullscreen
  // controls fade out for the duration and reappear once the clip settles, so
  // they don't hang in mid-air over the travelling frames.
  const [transitioning, setTransitioning] = useState(false);
  // The real clip on screen — drives the indicator dots below the frame.
  const [activeDot, setActiveDot] = useState(0);
  // Mobile fullscreen overlay for the current clip.
  const [fsOpen, setFsOpen] = useState(false);
  // Swipe tracking (touch). A tap fires a click (→ play/pause); a horizontal
  // drag suppresses the click, so it only ever navigates — no extra guard.
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Phones keep every clip paused until tapped; only wider screens autoplay the
  // centre clip as it scrolls through.
  const canAutoplay = () => window.matchMedia("(min-width: 768px)").matches;

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

  // Ease the whole stage in the first time a clip has an actual frame to show,
  // so the video never hard-cuts (“snaps”) in once it finishes loading. Runs
  // once; the fallback timer below guarantees it fires even if a clip stalls.
  const revealStage = () => {
    if (revealedRef.current) return;
    const stage = stageRef.current;
    if (!stage) return;
    revealedRef.current = true;
    gsap.to(stage, { autoAlpha: 1, y: 0, duration: 0.7, ease: "power3.out" });
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

    // Start hidden and slightly lowered; revealStage() fades it up once the
    // first frame is ready. (render() above only touches the per-slide opacity,
    // not the stage wrapper, so the two don't fight.)
    gsap.set(stage, { autoAlpha: 0, y: 24 });

    cursorTo.current = {
      x: gsap.quickTo(cursor, "x", { duration: 0.2, ease: "power3.out" }),
      y: gsap.quickTo(cursor, "y", { duration: 0.2, ease: "power3.out" }),
    };

    // Keep the play/pause glyph correct even when the page SCROLLS the stage
    // under a stationary pointer. No pointermove fires on scroll, so relying on
    // it alone left the glyph hidden — and since the stage sets `cursor-none`,
    // NO cursor showed at all — until the mouse was nudged. We track the pointer
    // in viewport space and re-evaluate on every move AND scroll: inside the
    // stage → show + position the glyph; outside → hide it.
    let pointerX = 0;
    let pointerY = 0;
    let pointerKnown = false;
    let cursorInside = false;
    const syncCursor = () => {
      if (!pointerKnown || !cursorTo.current) return;
      const rect = stage.getBoundingClientRect();
      const inside =
        pointerX >= rect.left &&
        pointerX <= rect.right &&
        pointerY >= rect.top &&
        pointerY <= rect.bottom;
      if (inside) {
        const x = pointerX - rect.left;
        const y = pointerY - rect.top;
        // Jump straight to the pointer on first entry (no visible slide from a
        // stale spot); follow smoothly once already shown.
        if (!cursorInside) gsap.set(cursor, { x, y });
        else {
          cursorTo.current.x(x);
          cursorTo.current.y(y);
        }
        cursorInside = true;
        setCursorShown(true);
      } else if (cursorInside) {
        cursorInside = false;
        setCursorShown(false);
      }
    };
    const trackPointer = (e: PointerEvent) => {
      pointerX = e.clientX;
      pointerY = e.clientY;
      pointerKnown = true;
      syncCursor();
    };
    let scrollRaf = 0;
    const onScroll = () => {
      if (scrollRaf) return;
      scrollRaf = requestAnimationFrame(() => {
        scrollRaf = 0;
        syncCursor();
      });
    };
    window.addEventListener("pointermove", trackPointer, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });

    // Auto-play the selected clip as the section nears view, and pause it once
    // the section leaves. Only the centre clip is ever touched. The bottom
    // rootMargin starts the (preload="none") clip loading ~a third of a screen
    // early, so it has a frame decoded by the time it's actually on screen.
    const observer = new IntersectionObserver(
      ([entry]) => {
        inViewRef.current = entry.isIntersecting;
        const video = videoRefs.current[mod(activeRef.current, VIDEOS.length)];
        if (!video) return;
        if (entry.isIntersecting) {
          if (canAutoplay()) video.play().catch(() => {});
          // Safety net: reveal even if the clip stalls and never fires
          // onLoadedData, so the stage can't get stuck hidden.
          window.setTimeout(revealStage, 1200);
        } else if (!video.paused) video.pause();
      },
      { threshold: 0, rootMargin: "0px 0px 33% 0px" },
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
      window.removeEventListener("pointermove", trackPointer);
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(scrollRaf);
      observer.disconnect();
      cursorTo.current = null;
      ctx.revert();
    };
  }, []);

  // On phones the clips don't autoplay, so nudge each one to load its first
  // frame — the paused clip shows a still behind the play button instead of a
  // blank box. (Desktop keeps preload="none" and lazy-loads on scroll-in.)
  useEffect(() => {
    if (!window.matchMedia("(max-width: 767px)").matches) return;
    videoRefs.current.forEach((v) => {
      if (v) {
        v.preload = "metadata";
        v.load();
      }
    });
  }, []);

  const togglePlay = () => {
    const video = videoRefs.current[mod(activeRef.current, VIDEOS.length)];
    if (!video) return;
    if (video.paused) video.play().catch(() => {});
    else video.pause();
  };

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
      // Swipe left → next clip; swipe right → previous.
      step(dx < 0 ? 1 : -1);
    }
  };

  // Open the fullscreen overlay for the current clip; pause the inline one so
  // only the fullscreen copy plays.
  const openFullscreen = () => {
    const video = videoRefs.current[mod(activeRef.current, VIDEOS.length)];
    if (video && !video.paused) video.pause();
    setFsOpen(true);
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
    setActiveDot(real);
    const arriving = videoRefs.current[real];
    if (arriving && inViewRef.current && canAutoplay())
      arriving.play().catch(() => {});

    const proxy = proxyRef.current;
    gsap.killTweensOf(proxy);
    proxy.v = from;
    setTransitioning(true);
    gsap.to(proxy, {
      v: toVirtual,
      duration: 0.6,
      ease: "power3.out",
      onUpdate: () => render(proxy.v),
      onComplete: () => setTransitioning(false),
    });
  };

  // Step one clip forward (+1: current slides left, next arrives from the
  // right) or back (-1). The virtual index loops, so it never runs out.
  const step = (dir: 1 | -1) => settle(activeRef.current + dir);

  // Jump straight to a clip from the indicator dots. Resolve the nearest
  // virtual index congruent to the target so the track takes the short way.
  const goToDot = (real: number) => {
    const current = activeRef.current;
    const n = VIDEOS.length;
    settle(real + n * Math.round((current - real) / n));
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

      {/* Video frame with the navigation arrows sitting outside it */}
      <div className="mx-auto w-full max-w-375 px-8 max-md:px-3">
        {/* dir=ltr keeps the previous arrow on the left and next on the right */}
        <div dir="ltr" className="flex items-center gap-4 md:gap-6">
          {/* Previous clip — sits to the left of the video, no backdrop.
              Hidden on phones, where navigation is by swipe / dots. */}
          <button
            type="button"
            aria-label="المقطع السابق"
            onClick={() => step(-1)}
            className="group shrink-0 cursor-pointer p-2 max-md:hidden"
          >
            <ChevronIcon className="h-10 w-10 text-primary transition-transform duration-300 group-hover:-translate-x-1.5" />
          </button>

          {/* Stage: a fixed 16:9 frame the centre clip fills. It is NOT clipped
              — the leaving/arriving clips slide right across the screen and are
              clipped only at the viewport by the section's overflow. `z-0` makes
              it a stacking context so the corner brackets stay above every clip.
              dir=ltr keeps the array order running left-to-right for the slide. */}
          <div
            ref={stageRef}
            dir="ltr"
            className="relative z-0 aspect-video w-full flex-1 select-none md:cursor-none"
            onClick={togglePlay}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
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
                  className="h-full w-full rounded-2xl object-cover shadow-lg max-md:rounded-xl"
                  preload="none"
                  loop
                  muted
                  playsInline
                  onLoadedData={revealStage}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
              </div>
            ))}

            {/* Custom cursor (desktop): the play/pause glyph trailing the
                pointer. Both stay mounted and cross-fade so switching never
                jumps. */}
            <div
              ref={cursorRef}
              className={`pointer-events-none absolute left-0 top-0 z-200 text-white transition-opacity duration-200 max-md:hidden ${
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

            {/* Mobile: a fixed play glyph in the centre while the clip is
                paused. Visual only (pointer-events-none) so taps and swipes are
                handled by the stage. */}
            <div className="pointer-events-none absolute inset-0 z-150 flex items-center justify-center md:hidden">
              <span
                className={`flex h-16 w-16 items-center justify-center rounded-full bg-dark/50 transition-all duration-300 ${
                  isPlaying || transitioning ? "scale-75 opacity-0" : "scale-100 opacity-100"
                }`}
              >
                <PlayIcon className="h-7 w-7 translate-x-0.5 text-white" />
              </span>
            </div>

            {/* Mobile: fullscreen control in the corner. stopPropagation keeps
                the tap from also toggling play/pause. */}
            <button
              type="button"
              aria-label="ملء الشاشة"
              onClick={(e) => {
                e.stopPropagation();
                openFullscreen();
              }}
              className={`absolute bottom-3 right-3 z-160 flex h-10 w-10 items-center justify-center rounded-full bg-dark/50 text-white transition-opacity duration-200 md:hidden ${
                transitioning ? "pointer-events-none opacity-0" : "opacity-100"
              }`}
            >
              <FullscreenIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Next clip — sits to the right of the video, no backdrop.
              Hidden on phones, where navigation is by swipe / dots. */}
          <button
            type="button"
            aria-label="المقطع التالي"
            onClick={() => step(1)}
            className="group shrink-0 cursor-pointer p-2 max-md:hidden"
          >
            <ChevronIcon className="h-10 w-10 rotate-180 text-primary transition-transform duration-300 group-hover:translate-x-1.5" />
          </button>
        </div>

        {/* Indicator: one dot per clip below the frame; the active one widens.
            dir=ltr so the dots run in the same order as the arrows/slide. */}
        <div dir="ltr" className="mt-8 flex justify-center gap-2.5">
          {VIDEOS.map((src, i) => (
            <button
              key={src}
              type="button"
              aria-label={`المقطع ${i + 1}`}
              aria-current={i === activeDot}
              onClick={() => goToDot(i)}
              className={`h-2.5 cursor-pointer rounded-full transition-all duration-300 ${
                i === activeDot
                  ? "w-7 bg-primary"
                  : "w-2.5 bg-muted-dark hover:bg-subtext-dark"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Mobile fullscreen overlay for the current clip */}
      {fsOpen && (
        <FullscreenPlayer
          src={VIDEOS[activeDot]}
          onClose={() => setFsOpen(false)}
          onPrev={() => step(-1)}
          onNext={() => step(1)}
        />
      )}
    </section>
  );
}
