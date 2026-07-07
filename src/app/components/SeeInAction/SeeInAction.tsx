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

  useEffect(() => {
    const section = sectionRef.current;
    const frame = frameRef.current;
    const cursor = cursorRef.current;
    if (!section || !frame || !cursor) return;

    const ctx = gsap.context(() => {
      // The clip starts inset by the hero headline's side gap (px-32 on the
      // frame) and grows to full-bleed as the section scrolls up the screen.
      gsap.to(frame, {
        paddingLeft: 0,
        paddingRight: 0,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top 85%",
          end: "top 15%",
          scrub: 1,
        },
      });
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

  const moveCursor = (e: React.PointerEvent) => {
    const viewport = viewportRef.current;
    if (!viewport || !cursorTo.current) return;
    const rect = viewport.getBoundingClientRect();
    cursorTo.current.x(e.clientX - rect.left);
    cursorTo.current.y(e.clientY - rect.top);
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

  const onPointerUp = () => {
    const drag = dragRef.current;
    if (!drag.down) return;
    drag.down = false;
    // A still click toggles playback; a real drag picks the nearest clip.
    if (!drag.dragging) {
      togglePlay();
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
          className="relative aspect-video w-full cursor-none touch-pan-y select-none overflow-hidden rounded-brand shadow-[0_24px_48px_-32px_rgba(14,19,18,0.35)]"
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

          {/* Custom cursor: play when the clip is paused, pause when playing.
              Tailwind's translate centres it on the point; GSAP moves x/y. */}
          <div
            ref={cursorRef}
            className={`pointer-events-none absolute left-0 top-0 z-10 -translate-x-1/2 -translate-y-1/2 text-primary transition-opacity duration-200 ${
              cursorShown ? "opacity-100" : "opacity-0"
            }`}
          >
            {isPlaying ? (
              <PauseIcon className="h-14 w-14 drop-shadow-[0_4px_14px_rgba(14,19,18,0.35)]" />
            ) : (
              <PlayIcon className="h-14 w-14 drop-shadow-[0_4px_14px_rgba(14,19,18,0.35)]" />
            )}
          </div>
        </div>
      </div>

      {/* Indicator — the second way to navigate between clips */}
      <div className="mt-8 flex justify-center gap-3">
        {VIDEOS.map((src, i) => (
          <button
            key={src}
            type="button"
            aria-label={`المقطع ${i + 1}`}
            onClick={() => goTo(i)}
            className={`h-2.5 cursor-pointer rounded-full transition-all duration-300 ${
              i === activeIndex ? "w-9 bg-primary" : "w-2.5 bg-muted hover:bg-light"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
