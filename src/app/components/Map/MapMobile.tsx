"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { getLenis } from "../SmoothScroll/lenisInstance";
import { CloseIcon, MapIcon } from "./Icons";

// The phone version of the map. Instead of an inline map card, the section shows
// a single glowing "open the map" button below the heading. Tapping it slides a
// full-screen map panel in from the right; the visitor pans/zooms freely, and
// closing slides it back out — restoring the exact scroll position they left, so
// the map never costs them their place on the page. The regional → Hebron intro
// plays the first time the panel opens.

// How long the panel takes to slide in / out.
const SLIDE_DURATION = 0.55;

export default function MapMobile() {
  const panelRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const busyRef = useRef(false);
  // The map plays its zoom-in intro the first time the panel is opened.
  const introRequestedRef = useRef(false);
  // The scroll position the panel was opened from, restored on close so exiting
  // never drops the visitor to a different spot on the page.
  const scrollYRef = useRef(0);
  const [open, setOpen] = useState(false);

  const post = (msg: Record<string, unknown>) =>
    iframeRef.current?.contentWindow?.postMessage(msg, "*");

  // Show the map's own zoom (+/–) control — it lives hidden by default and is
  // only wanted now the map is a full, interactive surface.
  const showControls = () => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc || !doc.head) return;
    let style = doc.getElementById("masar-ctrl-hide") as HTMLStyleElement | null;
    if (!style) {
      style = doc.createElement("style");
      style.id = "masar-ctrl-hide";
      doc.head.appendChild(style);
    }
    style.textContent = "";
  };

  // If the map only finishes booting after we've asked it to play, replay once
  // it announces itself (mirrors the desktop handshake).
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.source !== iframeRef.current?.contentWindow) return;
      if ((e.data as { type?: string })?.type === "masar-ready") {
        showControls();
        if (introRequestedRef.current) post({ type: "masar-play" });
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  // Never leave scroll frozen (or the page overflow-clipped) if we unmount while
  // the panel is open.
  useEffect(
    () => () => {
      getLenis()?.start();
      document.documentElement.style.overflowX = "";
    },
    [],
  );

  // Slide the full-screen map in from the right. The panel is display:none at
  // rest, so it never adds page height or a stray horizontal scrollbar; opening
  // reveals it, parks it one screen to the right (xPercent 100) and eases it to
  // 0. Scroll is locked and the page is overflow-clipped for the duration, so
  // the off-screen panel can't scroll the page sideways mid-slide. In this RTL
  // document GSAP's transform is still physical, so xPercent 100 is always "one
  // screen to the right".
  const openPanel = () => {
    const panel = panelRef.current;
    if (!panel || busyRef.current || open) return;
    busyRef.current = true;

    scrollYRef.current = getLenis()?.scroll ?? window.scrollY;
    getLenis()?.stop();
    document.documentElement.style.overflowX = "clip";
    setOpen(true);
    showControls();

    // Play the zoom-in intro the first time the map is revealed.
    if (!introRequestedRef.current) {
      introRequestedRef.current = true;
      post({ type: "masar-play" });
    }

    gsap.set(panel, { display: "block", xPercent: 100 });
    gsap.to(panel, {
      xPercent: 0,
      duration: SLIDE_DURATION,
      ease: "power3.out",
      onComplete: () => {
        document.documentElement.style.overflowX = "";
        busyRef.current = false;
      },
    });
  };

  // Slide the panel back off to the right and hand the page back exactly where
  // it was. The scroll is pinned first (while the map still covers the screen),
  // then the slide-out uncovers the map section underneath — never a flash of a
  // different section.
  const closePanel = () => {
    const panel = panelRef.current;
    if (!panel || busyRef.current || !open) return;
    busyRef.current = true;

    const lenis = getLenis();
    lenis?.scrollTo(scrollYRef.current, { immediate: true, force: true });
    document.documentElement.style.overflowX = "clip";

    gsap.to(panel, {
      xPercent: 100,
      duration: SLIDE_DURATION,
      ease: "power3.in",
      onComplete: () => {
        gsap.set(panel, { display: "none", clearProps: "transform" });
        document.documentElement.style.overflowX = "";
        setOpen(false);
        lenis?.start();
        busyRef.current = false;
      },
    });
  };

  // Esc / the Android back-gesture-as-Escape closes the panel.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) closePanel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <>
      {/* The tap target: a glowing primary button that opens the map. */}
      <button
        type="button"
        onClick={openPanel}
        aria-label="افتح الخريطة التفاعلية"
        className="map-btn-glow relative mx-auto flex items-center gap-3 overflow-hidden rounded-brand bg-primary px-8 py-5 transition-transform duration-200 active:scale-95"
      >
        {/* Diagonal highlight that sweeps across the button. */}
        <span className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 map-btn-shine bg-gradient-to-r from-transparent via-white/45 to-transparent" />
        <MapIcon className="relative h-7 w-7 text-white" />
        <span className="relative font-sans text-t2 text-white">
          افتح الخريطة التفاعلية
        </span>
      </button>

      {/* Full-screen map panel — display:none at rest, slid in on open. */}
      <div
        ref={panelRef}
        aria-hidden={!open}
        className="fixed inset-0 z-[100] hidden bg-background"
      >
        <iframe
          ref={iframeRef}
          src="/masar-map.html"
          title="خريطة مسار للحُفر في الخليل"
          className="h-full w-full border-0"
        />

        <button
          type="button"
          onClick={closePanel}
          aria-label="إغلاق الخريطة"
          className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white text-text shadow-[0_8px_30px_-16px_rgba(14,19,18,0.4)]"
        >
          <CloseIcon className="h-5 w-5" />
        </button>
      </div>
    </>
  );
}
