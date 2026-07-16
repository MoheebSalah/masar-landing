"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { getLenis } from "../SmoothScroll/lenisInstance";
import { CloseIcon, ExpandIcon } from "./Icons";

// The phone version of the map: no device toggle, no morph. The map sits inline
// as a plain rounded CARD (no device bezel); tapping it grows that same card to
// fullscreen (GSAP animates its rect + corners while the map eases in a notch,
// so it feels like opening rather than just revealing more map). A cross shrinks
// it back to exactly where it was. The intro (regional → Hebron zoom-in) fires
// the first time the card scrolls into view.

// The zoom the map rests at (matches the map's HEBRON_DEFAULT_ZOOM) and the
// slightly closer framing it eases to while going fullscreen.
const PREVIEW_ZOOM = 12.6;
const FULLSCREEN_ZOOM = 13.6;
// The card's resting corner radius (rounded-brand, 32px). Straightened to 0 in
// fullscreen and eased back on the way out.
const CARD_RADIUS = "2rem";

export default function MapMobile() {
  const placeholderRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const busyRef = useRef(false);
  const playRequestedRef = useRef(false);
  // The scroll position the card was opened from, restored on close so exiting
  // fullscreen never drops the visitor back up the page.
  const scrollYRef = useRef(0);
  const [open, setOpen] = useState(false);

  const post = (msg: Record<string, unknown>) =>
    iframeRef.current?.contentWindow?.postMessage(msg, "*");

  // Toggle the map's own zoom (+/–) control. Injected as a style into the map
  // document (same origin) so it stays hidden on the preview and returns in
  // fullscreen; the attribution stays put.
  const setControls = (visible: boolean) => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc || !doc.head) return;
    let style = doc.getElementById("masar-ctrl-hide") as HTMLStyleElement | null;
    if (!style) {
      style = doc.createElement("style");
      style.id = "masar-ctrl-hide";
      doc.head.appendChild(style);
    }
    style.textContent = visible
      ? ""
      : ".maplibregl-ctrl-top-left{display:none !important;}";
  };

  // Play the intro once, the first time the card is on screen. The map rests at
  // its regional framing until it hears "masar-play", so triggering it here (not
  // on load) means the zoom-in actually plays as the visitor arrives.
  useEffect(() => {
    const el = placeholderRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !playRequestedRef.current) {
          playRequestedRef.current = true;
          post({ type: "masar-play" });
          io.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // If the map only finishes booting after we've asked to play, replay once it
  // announces itself (mirrors the desktop handshake).
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.source !== iframeRef.current?.contentWindow) return;
      if ((e.data as { type?: string })?.type === "masar-ready") {
        setControls(open);
        if (playRequestedRef.current) post({ type: "masar-play" });
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [open]);

  // Never leave scroll frozen if we unmount mid-fullscreen.
  useEffect(() => () => void getLenis()?.start(), []);

  // Open with a GPU transform (translate + scale), NOT by animating width/height.
  // Growing the box would resize the iframe every frame, forcing MapLibre to
  // re-render its canvas each tick — the source of the laggy, low-frame feel.
  // Here the card keeps its own layout size while a scale carries it up to fill
  // the screen; one crisp reflow lands at the very end, already full-size.
  const openFullscreen = () => {
    const frame = frameRef.current;
    if (!frame || busyRef.current || open) return;
    busyRef.current = true;

    const r = frame.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    scrollYRef.current = getLenis()?.scroll ?? window.scrollY;
    setOpen(true);
    setControls(true);
    getLenis()?.stop();
    // The map eases a notch closer so the zoom reads as moving in, not as
    // uncovering more of the map.
    post({ type: "masar-zoom", zoom: FULLSCREEN_ZOOM });

    // Pin the card over its current spot at its own size (no iframe resize).
    // `right/bottom: auto` clears the `inset-0` right/bottom — in this RTL
    // document an over-constrained fixed box otherwise ignores `left` and anchors
    // right. transformOrigin top-left makes the scale grow from that corner.
    gsap.set(frame, {
      position: "fixed",
      zIndex: 100,
      margin: 0,
      top: 0,
      left: 0,
      right: "auto",
      bottom: "auto",
      width: r.width,
      height: r.height,
      transformOrigin: "top left",
      x: r.left,
      y: r.top,
      borderRadius: CARD_RADIUS,
    });
    gsap.to(frame, {
      x: 0,
      y: 0,
      scaleX: vw / r.width,
      scaleY: vh / r.height,
      borderRadius: 0,
      duration: 0.5,
      ease: "power3.inOut",
      onComplete: () => {
        // Snap to a real full-viewport box and drop the transform, so MapLibre
        // renders once at full resolution — the only reflow, unnoticed because it
        // lands while already full-screen.
        gsap.set(frame, {
          x: 0,
          y: 0,
          scaleX: 1,
          scaleY: 1,
          width: "100%",
          height: "100%",
        });
        busyRef.current = false;
      },
    });
  };

  // Close is the reverse — a scale-DOWN (zoom out) of the full-screen map back
  // onto the card, again transform-only so it stays smooth. The page is pinned
  // back to where fullscreen was entered FIRST, while the map still covers the
  // screen, so the zoom-out uncovers the map section — never a flash of the
  // section above it.
  const closeFullscreen = () => {
    const frame = frameRef.current;
    const ph = placeholderRef.current;
    if (!frame || !ph || busyRef.current) return;
    busyRef.current = true;

    const lenis = getLenis();
    lenis?.scrollTo(scrollYRef.current, { immediate: true, force: true });

    post({ type: "masar-zoom", zoom: PREVIEW_ZOOM });
    const r = ph.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Start from an exact full-viewport box at identity, then scale down onto the
    // card's rect.
    gsap.set(frame, {
      width: vw,
      height: vh,
      transformOrigin: "top left",
      x: 0,
      y: 0,
      scaleX: 1,
      scaleY: 1,
    });
    gsap.to(frame, {
      x: r.left,
      y: r.top,
      scaleX: r.width / vw,
      scaleY: r.height / vh,
      borderRadius: CARD_RADIUS,
      duration: 0.5,
      ease: "power3.inOut",
      onComplete: () => {
        // Drop back to the in-flow card and release everything.
        gsap.set(frame, { clearProps: "all" });
        setOpen(false);
        setControls(false);
        lenis?.start();
        busyRef.current = false;
      },
    });
  };

  // Esc closes fullscreen (defined after closeFullscreen so it can call it).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) closeFullscreen();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    // The placeholder holds the section's height while the card is fixed, so the
    // page below never jumps as it opens or closes. Its height is tuned so the
    // card's aspect ~matches the viewport's: the open/close zoom then scales it
    // near-uniformly to full-screen, so the map doesn't visibly stretch mid-zoom.
    <div ref={placeholderRef} className="relative h-[82vh] w-full">
      {/* A plain rounded card holding the map — no device bezel. */}
      <div
        ref={frameRef}
        className="absolute inset-0 overflow-hidden rounded-brand bg-background shadow-[0_8px_30px_-16px_rgba(14,19,18,0.35)]"
      >
        <iframe
          ref={iframeRef}
          src="/masar-map.html"
          title="خريطة مسار للحُفر في الخليل"
          onLoad={() => setControls(false)}
          className={`h-full w-full border-0 ${open ? "" : "pointer-events-none"}`}
        />

        {/* Preview: a full-card tap target that expands the map. */}
        {!open && (
          <button
            type="button"
            onClick={openFullscreen}
            aria-label="توسيع الخريطة"
            className="absolute inset-0 flex items-end justify-center"
          >
            <span className="mb-6 flex items-center gap-2 rounded-full bg-dark/70 px-5 py-2.5 font-sans text-t5 text-white backdrop-blur-sm">
              <ExpandIcon className="h-4 w-4" />
              اضغط لفتح الخريطة
            </span>
          </button>
        )}

        {/* Fullscreen: exit back to the preview. */}
        {open && (
          <button
            type="button"
            onClick={closeFullscreen}
            aria-label="إغلاق الخريطة"
            className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white text-text shadow-[0_8px_30px_-16px_rgba(14,19,18,0.4)]"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}
