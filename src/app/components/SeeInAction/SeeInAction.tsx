"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PlayIcon, PauseIcon } from "./Icons";

gsap.registerPlugin(ScrollTrigger);

// Detection clips shown in the carousel, in display order.
const VIDEOS = [
  "/assets/Carousel/Carousel 1.mp4",
  "/assets/Carousel/Carousel 2.webm",
  "/assets/Carousel/Carousel 3.webm",
  "/assets/Carousel/Carousel 4.webm",
  "/assets/Carousel/Carousel 5.mp4",
];

// Dragging past this fraction of the viewport width commits a slide change.
const SWIPE_THRESHOLD = 0.15;
// Pointer travel below this (px) still counts as a click, not a drag.
const CLICK_TOLERANCE = 6;
// Side strips (fraction of the width) where a click pages through the clips
// instead of toggling playback: right edge → next, left edge → previous.
const EDGE_ZONE = 0.15;

type CursorZone = "prev" | "center" | "next";

export default function SeeInAction() {
  const sectionRef = useRef<HTMLElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const indexRef = useRef(0);
  const dragRef = useRef({ down: false, dragging: false, startX: 0, dx: 0 });
  const cursorTo = useRef<{
    x: gsap.QuickToFunc;
    y: gsap.QuickToFunc;
  } | null>(null);

  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [cursorShown, setCursorShown] = useState(false);
  const [cursorZone, setCursorZone] = useState<CursorZone>("center");

  useEffect(() => {
    const section = sectionRef.current;
    const frame = frameRef.current;
    const viewport = viewportRef.current;
    const cursor = cursorRef.current;
    if (!section || !frame || !viewport || !cursor) return;

    const ctx = gsap.context(() => {
      // The clip starts inset by the hero headline's side gap (px-32 on the
      // frame) and grows to full-bleed as the section scrolls up the screen;
      // the corners flatten in step so the fullscreen state has no radius.
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top 85%",
          end: "top 15%",
          scrub: 1,
        },
      });
      tl.to(frame, { paddingLeft: 0, paddingRight: 0, ease: "none" }, 0);
      tl.to(viewport, { borderRadius: 0, ease: "none" }, 0);
    }, section);

    cursorTo.current = {
      x: gsap.quickTo(cursor, "x", { duration: 0.2, ease: "power3.out" }),
      y: gsap.quickTo(cursor, "y", { duration: 0.2, ease: "power3.out" }),
    };

    // Pause whatever is playing once the section leaves the screen.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) return;
        const video = videoRefs.current[indexRef.current];
        if (video && !video.paused) video.pause();
      },
      { threshold: 0 },
    );
    observer.observe(section);

    return () => {
      ctx.revert();
      observer.disconnect();
      cursorTo.current = null;
    };
  }, []);

  // Slide to a clip; leaving a playing clip pauses it but keeps its progress
  // (the element stays mounted, so currentTime survives the swap).
  const goTo = (next: number) => {
    const clamped = Math.max(0, Math.min(VIDEOS.length - 1, next));
    const current = videoRefs.current[indexRef.current];
    if (clamped !== indexRef.current && current && !current.paused) {
      current.pause();
    }
    indexRef.current = clamped;
    setActiveIndex(clamped);
    gsap.to(trackRef.current, {
      xPercent: -100 * clamped,
      x: 0,
      duration: 0.7,
      ease: "power3.out",
    });
  };

  const togglePlay = () => {
    const video = videoRefs.current[indexRef.current];
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  };

  // Which strip of the video the pointer sits in (the viewport is ltr, so
  // the right strip means "next" and the left strip means "previous").
  const zoneAt = (clientX: number): CursorZone => {
    const viewport = viewportRef.current;
    if (!viewport) return "center";
    const rect = viewport.getBoundingClientRect();
    const ratio = (clientX - rect.left) / rect.width;
    if (ratio > 1 - EDGE_ZONE) return "next";
    if (ratio < EDGE_ZONE) return "prev";
    return "center";
  };

  const moveCursor = (e: React.PointerEvent) => {
    const viewport = viewportRef.current;
    if (!viewport || !cursorTo.current) return;
    const rect = viewport.getBoundingClientRect();
    cursorTo.current.x(e.clientX - rect.left);
    cursorTo.current.y(e.clientY - rect.top);
    setCursorZone(zoneAt(e.clientX));
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { down: true, dragging: false, startX: e.clientX, dx: 0 };
    // Grabbing mid-snap takes over from the settle tween.
    gsap.killTweensOf(trackRef.current);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    moveCursor(e);
    const drag = dragRef.current;
    if (!drag.down) return;
    drag.dx = e.clientX - drag.startX;
    if (!drag.dragging && Math.abs(drag.dx) > CLICK_TOLERANCE) {
      drag.dragging = true;
    }
    if (!drag.dragging) return;
    // Rubber-band resistance when pulling past the first or last clip.
    const atEdge =
      (indexRef.current === 0 && drag.dx > 0) ||
      (indexRef.current === VIDEOS.length - 1 && drag.dx < 0);
    gsap.set(trackRef.current, { x: atEdge ? drag.dx * 0.3 : drag.dx });
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag.down) return;
    drag.down = false;
    // A still click pages through the clips from the side strips and toggles
    // playback from the middle; a real drag picks the nearest clip instead.
    if (!drag.dragging) {
      const zone = zoneAt(e.clientX);
      if (zone === "next") goTo(indexRef.current + 1);
      else if (zone === "prev") goTo(indexRef.current - 1);
      else togglePlay();
      return;
    }
    const width = viewportRef.current?.offsetWidth ?? 1;
    let next = indexRef.current;
    if (drag.dx < -width * SWIPE_THRESHOLD) next += 1;
    else if (drag.dx > width * SWIPE_THRESHOLD) next -= 1;
    goTo(next);
  };

  const onPointerCancel = () => {
    if (!dragRef.current.down) return;
    dragRef.current.down = false;
    goTo(indexRef.current);
  };

  return (
    <section
      ref={sectionRef}
      id="see-in-action"
      className="relative w-full bg-background py-16"
    >
      {/* Padded frame — GSAP scrubs the padding to 0 as the section enters */}
      <div ref={frameRef} className="px-32">
        {/* dir=ltr so dragging right-to-left advances to the next clip */}
        <div
          ref={viewportRef}
          dir="ltr"
          className="relative h-screen w-full cursor-none touch-pan-y select-none overflow-hidden rounded-brand shadow-[0_24px_48px_-32px_rgba(14,19,18,0.35)]"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          onPointerEnter={() => setCursorShown(true)}
          onPointerLeave={() => setCursorShown(false)}
        >
          <div ref={trackRef} className="flex h-full w-full">
            {VIDEOS.map((src, i) => (
              <video
                key={src}
                ref={(el) => {
                  videoRefs.current[i] = el;
                }}
                src={src}
                className="h-full w-full shrink-0 object-cover"
                preload="metadata"
                playsInline
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
            ))}
          </div>

          {/* Custom cursor: "Next"/"Prev" over the side strips, otherwise the
              play/pause icon for the middle. GSAP moves the (zero-sized)
              anchor; all variants stay mounted, stacked on its centre, and
              cross-fade/scale so switching never looks instant. */}
          <div
            ref={cursorRef}
            className={`pointer-events-none absolute left-0 top-0 z-10 text-primary transition-opacity duration-200 ${
              cursorShown ? "opacity-100" : "opacity-0"
            }`}
          >
            <PlayIcon
              className={`absolute left-0 top-0 h-24 w-24 -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ease-out ${
                cursorZone === "center" && !isPlaying
                  ? "scale-100 opacity-100"
                  : "scale-50 opacity-0"
              }`}
            />
            <PauseIcon
              className={`absolute left-0 top-0 h-24 w-24 -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ease-out ${
                cursorZone === "center" && isPlaying
                  ? "scale-100 opacity-100"
                  : "scale-50 opacity-0"
              }`}
            />
            <span
              className={`absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap font-sans text-h2 font-bold transition-all duration-300 ease-out ${
                cursorZone === "next"
                  ? "scale-100 opacity-100"
                  : "scale-50 opacity-0"
              }`}
            >
              Next
            </span>
            <span
              className={`absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap font-sans text-h2 font-bold transition-all duration-300 ease-out ${
                cursorZone === "prev"
                  ? "scale-100 opacity-100"
                  : "scale-50 opacity-0"
              }`}
            >
              Prev
            </span>
          </div>

          {/* Indicator — inside the frame; inherits the viewport's ltr so the
              active dot travels in the same direction as the slides. It swaps
              the custom play cursor for the normal pointer and swallows
              pointerdown so clicking a dot never drags or toggles playback. */}
          <div
            className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-3"
            onPointerDown={(e) => e.stopPropagation()}
            onPointerEnter={() => setCursorShown(false)}
            onPointerLeave={() => setCursorShown(true)}
          >
            {VIDEOS.map((src, i) => (
              <button
                key={src}
                type="button"
                aria-label={`المقطع ${i + 1}`}
                onClick={() => goTo(i)}
                className={`h-2.5 cursor-pointer rounded-full transition-all duration-300 ${
                  i === activeIndex
                    ? "w-9 bg-primary"
                    : "w-2.5 bg-text-dark/50 hover:bg-text-dark/80"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
