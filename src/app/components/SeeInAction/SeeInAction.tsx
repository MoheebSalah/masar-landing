"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { PlayIcon, PauseIcon } from "./Icons";

// Detection clips shown in the carousel, in display order.
const VIDEOS = [
  "/assets/Carousel/Carousel 1.mp4",
  "/assets/Carousel/Carousel 2.webm",
  "/assets/Carousel/Carousel 3.webm",
  "/assets/Carousel/Carousel 4.webm",
  "/assets/Carousel/Carousel 5.mp4",
];

// The centre clip spans the carousel width minus this gutter on each side; the
// two neighbours peek in through those gutters.
const SIDE_GUTTER = 128;
// Gap (px) between two neighbouring slide edges.
const GAP = 32;
// Beyond this many steps from centre a slide is fully off-screen, so it hides
// and — being invisible — can teleport across the wrap without being seen.
const VISIBLE_CUTOFF = 1.5;
// How dark an unselected clip gets (overlay opacity at one step out).
const DIM = 0.55;
// Pointer travel below this (px) still counts as a click, not a drag.
const CLICK_TOLERANCE = 6;

const mod = (value: number, n: number) => ((value % n) + n) % n;

export default function SeeInAction() {
  const sectionRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const overlayRefs = useRef<(HTMLDivElement | null)[]>([]);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  // Unbounded virtual index — its remainder over VIDEOS.length is the clip on
  // screen; letting it run past the ends is what makes the loop seam-free.
  const activeRef = useRef(0);
  const slideWidthRef = useRef(0);
  const stepRef = useRef(0);
  // Reused across settles so a grab mid-animation can kill the running tween.
  const proxyRef = useRef({ v: 0 });
  const cursorTo = useRef<{ x: gsap.QuickToFunc; y: gsap.QuickToFunc } | null>(
    null,
  );
  const drag = useRef({
    down: false,
    dragging: false,
    startX: 0,
    dx: 0,
    pressedIndex: 0,
  });

  const [active, setActive] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [cursorShown, setCursorShown] = useState(false);

  // Draw the track for a (possibly fractional) virtual position: place every
  // slide at its nearest wrapped copy so the centre clip sits upright while the
  // neighbours slide out, dim, and drop behind. Copies more than one step out
  // sit off-screen and are hidden, so their wrap-around jump is never seen.
  const render = (virtual: number) => {
    const n = VIDEOS.length;
    const width = slideWidthRef.current;
    const step = stepRef.current;
    slideRefs.current.forEach((slide, i) => {
      if (!slide) return;
      let signed = i - virtual;
      signed -= n * Math.round(signed / n);
      const distance = Math.abs(signed);
      const visible = distance < VISIBLE_CUTOFF;
      gsap.set(slide, {
        xPercent: -50,
        x: signed * step,
        width,
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
        zIndex: Math.round(100 - distance * 10),
      });
      const overlay = overlayRefs.current[i];
      // The centre clip is fully lit; neighbours darken with distance.
      if (overlay) gsap.set(overlay, { opacity: Math.min(DIM, distance * DIM) });
    });
  };

  useEffect(() => {
    const container = containerRef.current;
    const section = sectionRef.current;
    const cursor = cursorRef.current;
    if (!container || !section || !cursor) return;

    const measure = () => {
      slideWidthRef.current = Math.max(0, container.offsetWidth - SIDE_GUTTER * 2);
      stepRef.current = slideWidthRef.current + GAP;
      render(activeRef.current);
    };
    measure();
    window.addEventListener("resize", measure);

    cursorTo.current = {
      x: gsap.quickTo(cursor, "x", { duration: 0.2, ease: "power3.out" }),
      y: gsap.quickTo(cursor, "y", { duration: 0.2, ease: "power3.out" }),
    };

    // Pause whatever is playing once the section leaves the screen.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) return;
        const video = videoRefs.current[mod(activeRef.current, VIDEOS.length)];
        if (video && !video.paused) video.pause();
      },
      { threshold: 0 },
    );
    observer.observe(section);

    return () => {
      window.removeEventListener("resize", measure);
      observer.disconnect();
      cursorTo.current = null;
    };
  }, []);

  const togglePlay = () => {
    const video = videoRefs.current[mod(activeRef.current, VIDEOS.length)];
    if (!video) return;
    if (video.paused) video.play().catch(() => {});
    else video.pause();
  };

  // Settle onto a virtual target, taking whatever direction it points; leaving
  // a playing clip pauses it (it stays mounted, so its progress survives).
  const settle = (toVirtual: number) => {
    const from = activeRef.current;
    if (toVirtual !== from) {
      const current = videoRefs.current[mod(from, VIDEOS.length)];
      if (current && !current.paused) current.pause();
    }
    activeRef.current = toVirtual;
    setActive(mod(toVirtual, VIDEOS.length));
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

  // Jump to a real clip index by the shortest way round the loop.
  const goTo = (realTarget: number) => {
    const n = VIDEOS.length;
    let delta = realTarget - mod(activeRef.current, n);
    delta -= n * Math.round(delta / n);
    settle(activeRef.current + delta);
  };

  // Move the play/pause cursor and show it only while the pointer is over the
  // centre clip — never over the dimmed neighbours peeking at the sides.
  const moveCursor = (clientX: number, clientY: number) => {
    const container = containerRef.current;
    if (!container || !cursorTo.current) return;
    const rect = container.getBoundingClientRect();
    const localX = clientX - rect.left;
    cursorTo.current.x(localX);
    cursorTo.current.y(clientY - rect.top);
    const overCentre = Math.abs(localX - rect.width / 2) < slideWidthRef.current / 2;
    setCursorShown(overCentre);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const el = (e.target as HTMLElement).closest("[data-index]");
    const pressedIndex = el
      ? Number(el.getAttribute("data-index"))
      : mod(activeRef.current, VIDEOS.length);
    drag.current = {
      down: true,
      dragging: false,
      startX: e.clientX,
      dx: 0,
      pressedIndex,
    };
    gsap.killTweensOf(proxyRef.current);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    moveCursor(e.clientX, e.clientY);
    const d = drag.current;
    if (!d.down) return;
    d.dx = e.clientX - d.startX;
    if (!d.dragging && Math.abs(d.dx) > CLICK_TOLERANCE) d.dragging = true;
    if (!d.dragging) return;
    // Content follows the finger; the loop is endless, so no rubber-banding.
    render(activeRef.current - d.dx / stepRef.current);
  };

  const onPointerUp = () => {
    const d = drag.current;
    if (!d.down) return;
    d.down = false;
    // A still click toggles playback on the centre clip, or jumps to a
    // neighbour that was clicked; a real drag lands on the nearest clip.
    if (!d.dragging) {
      if (d.pressedIndex === mod(activeRef.current, VIDEOS.length)) togglePlay();
      else goTo(d.pressedIndex);
      return;
    }
    settle(Math.round(activeRef.current - d.dx / stepRef.current));
  };

  const onPointerCancel = () => {
    if (!drag.current.down) return;
    drag.current.down = false;
    settle(activeRef.current);
  };

  return (
    <section
      ref={sectionRef}
      id="see-in-action"
      className="w-full overflow-hidden bg-background py-24"
    >
      {/* Section heading */}
      <div className="mx-auto mb-16 max-w-3xl px-8 text-center">
        <h2 className="font-heading text-h2 text-text">شاهدها أثناء العمل</h2>
        <p className="mx-auto mt-4 max-w-xl font-sans text-t2 text-subtext">
          مقاطع حقيقية توضّح كيف يرصد النظام الحفر ويصنّف خطورتها لحظة بلحظة.
        </p>
      </div>

      {/* Infinite coverflow carousel. dir=ltr keeps the array order running
          left-to-right, so the previous (last) clip peeks on the left and the
          next clip peeks on the right. */}
      <div
        ref={containerRef}
        dir="ltr"
        className="relative h-200 w-full touch-pan-y select-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onPointerLeave={() => setCursorShown(false)}
      >
        {VIDEOS.map((src, i) => (
          <div
            key={src}
            ref={(el) => {
              slideRefs.current[i] = el;
            }}
            data-index={i}
            className={`absolute left-1/2 top-0 h-full ${
              i === active ? "cursor-none" : "cursor-pointer"
            }`}
          >
            <video
              ref={(el) => {
                videoRefs.current[i] = el;
              }}
              src={src}
              className="h-full w-full rounded-brand object-cover"
              preload="metadata"
              playsInline
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
            {/* Dimming veil — GSAP fades it in as the clip moves off centre. */}
            <div
              ref={(el) => {
                overlayRefs.current[i] = el;
              }}
              className="pointer-events-none absolute inset-0 rounded-brand bg-dark opacity-0"
            />
          </div>
        ))}

        {/* Custom cursor: the play/pause glyph trailing the pointer. Both stay
            mounted and cross-fade so switching never jumps; it only shows over
            the centre clip (moveCursor gates its visibility). */}
        <div
          ref={cursorRef}
          className={`pointer-events-none absolute left-0 top-0 z-200 text-primary transition-opacity duration-200 ${
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

      {/* Indicator — click a dot to jump to that clip. dir=ltr so the dots run
          in the same order as the clips. */}
      <div dir="ltr" className="mt-14 flex justify-center gap-3">
        {VIDEOS.map((src, i) => (
          <button
            key={src}
            type="button"
            aria-label={`المقطع ${i + 1}`}
            onClick={() => goTo(i)}
            className={`h-2.5 cursor-pointer rounded-full transition-all duration-300 ${
              i === active
                ? "w-9 bg-primary"
                : "w-2.5 bg-text/30 hover:bg-text/60"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
