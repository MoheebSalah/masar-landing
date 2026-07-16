"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { getLenis } from "../SmoothScroll/lenisInstance";
import { CloseIcon, ExpandIcon } from "./Icons";

// The phone version of the map: no device toggle, no morph. A single map window
// sits inline inside a dark bezel (so it reads as a device/window); tapping it
// grows that same window to fullscreen (GSAP animates its rect + corners while
// the map eases in a notch, so it feels like opening rather than just revealing
// more map). A cross shrinks it back. The intro (regional → Hebron zoom-in)
// fires the first time the window scrolls into view.

// The zoom the map rests at (matches the map's HEBRON_DEFAULT_ZOOM) and the
// slightly closer framing it eases to while going fullscreen.
const PREVIEW_ZOOM = 12.6;
const FULLSCREEN_ZOOM = 13.6;
// Bezel geometry, shared by the CSS classes and the GSAP tweens.
const FRAME_RADIUS = "2rem"; // rounded-brand (32px)
const SCREEN_RADIUS = "1.375rem"; // frame radius minus the bezel padding
const BEZEL = "0.625rem"; // p-2.5

export default function MapMobile() {
  const placeholderRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const busyRef = useRef(false);
  const playRequestedRef = useRef(false);
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

  // Play the intro once, the first time the window is on screen. The map rests
  // at its regional framing until it hears "masar-play", so triggering it here
  // (not on load) means the zoom-in actually plays as the visitor arrives.
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

  const openFullscreen = () => {
    const frame = frameRef.current;
    const screen = screenRef.current;
    if (!frame || !screen || busyRef.current || open) return;
    busyRef.current = true;

    const r = frame.getBoundingClientRect();
    setOpen(true);
    setControls(true);
    getLenis()?.stop();
    // The map eases a notch closer so the growing window reads as zooming in,
    // not as uncovering more of the map.
    post({ type: "masar-zoom", zoom: FULLSCREEN_ZOOM });

    // Pin the frame over its current spot, then grow it to fill the viewport.
    gsap.set(frame, {
      position: "fixed",
      zIndex: 100,
      margin: 0,
      top: r.top,
      left: r.left,
      width: r.width,
      height: r.height,
      borderRadius: FRAME_RADIUS,
      padding: BEZEL,
    });
    gsap.to(frame, {
      top: 0,
      left: 0,
      width: window.innerWidth,
      height: window.innerHeight,
      borderRadius: 0,
      padding: 0,
      duration: 0.55,
      ease: "power3.inOut",
      onComplete: () => {
        gsap.set(frame, { width: "100%", height: "100%" });
        busyRef.current = false;
      },
    });
    gsap.to(screen, {
      borderRadius: 0,
      duration: 0.55,
      ease: "power3.inOut",
    });
  };

  const closeFullscreen = () => {
    const frame = frameRef.current;
    const screen = screenRef.current;
    const ph = placeholderRef.current;
    if (!frame || !screen || !ph || busyRef.current) return;
    busyRef.current = true;

    const r = ph.getBoundingClientRect();
    post({ type: "masar-zoom", zoom: PREVIEW_ZOOM });
    gsap.to(frame, {
      top: r.top,
      left: r.left,
      width: r.width,
      height: r.height,
      borderRadius: FRAME_RADIUS,
      padding: BEZEL,
      duration: 0.5,
      ease: "power3.inOut",
      onComplete: () => {
        // Drop back to the in-flow preview and release everything.
        gsap.set(frame, { clearProps: "all" });
        gsap.set(screen, { clearProps: "borderRadius" });
        setOpen(false);
        setControls(false);
        getLenis()?.start();
        busyRef.current = false;
      },
    });
    gsap.to(screen, {
      borderRadius: SCREEN_RADIUS,
      duration: 0.5,
      ease: "power3.inOut",
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
    // The placeholder holds the section's height while the frame is fixed, so
    // the page below never jumps as it opens or closes.
    <div ref={placeholderRef} className="relative h-[70vh] w-full">
      {/* Dark bezel — makes the map read as a device window. */}
      <div
        ref={frameRef}
        className="absolute inset-0 rounded-brand bg-dark p-2.5 shadow-[0_8px_30px_-16px_rgba(14,19,18,0.35)]"
      >
        <div
          ref={screenRef}
          className="relative h-full w-full overflow-hidden rounded-[1.375rem] bg-background"
        >
          <iframe
            ref={iframeRef}
            src="/masar-map.html"
            title="خريطة مسار للحُفر في الخليل"
            onLoad={() => setControls(false)}
            className={`h-full w-full border-0 ${open ? "" : "pointer-events-none"}`}
          />
        </div>

        {/* Preview: a full-window tap target that expands the map. */}
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
