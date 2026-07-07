"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Intro loading screen — a nod to what the product does. A pothole sits on a
 * dark stage, a primary detection frame locks onto it (blinking like a
 * computer-vision bounding box), then the frame becomes a window: its inside
 * clears, the pothole fades, and it grows until the page shows through.
 *
 * The "window" is the shadow element: a centred box whose giant box-shadow
 * paints everything around it dark. Turning its background transparent and
 * growing it reveals the page inside while the outside stays dark until the
 * shadow leaves the viewport.
 */
export default function Loader() {
  const [done, setDone] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);
  const potholeRef = useRef<HTMLImageElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const overlay = overlayRef.current;
    const shadowWindow = windowRef.current;
    const pothole = potholeRef.current;
    const frame = frameRef.current;
    const label = labelRef.current;
    if (!overlay || !shadowWindow || !pothole || !frame || !label) return;

    // Skip the whole show for users who opt out of motion.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const raf = requestAnimationFrame(() => setDone(true));
      return () => cancelAnimationFrame(raf);
    }

    const html = document.documentElement;
    const prevOverflow = html.style.overflow;
    const prevGutter = html.style.scrollbarGutter;
    // Keep the scrollbar's space reserved while overflow is hidden. Without
    // this the viewport gets a scrollbar-width wider during the loader, and
    // ScrollTrigger pins measured in that window keep the stale width —
    // leaving a horizontal overflow once the scrollbar returns.
    html.style.scrollbarGutter = "stable";
    html.style.overflow = "hidden";
    window.scrollTo(0, 0);

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          html.style.overflow = prevOverflow;
          html.style.scrollbarGutter = prevGutter;
          // Pinned sections measured themselves while the scrollbar was
          // hidden; re-measure now that it's back, or they end up a
          // scrollbar-width too wide (horizontal overflow).
          ScrollTrigger.refresh();
          setDone(true);
        },
      });

      // The pothole emerges on the dark stage.
      tl.fromTo(
        pothole,
        { autoAlpha: 0, scale: 0.9 },
        { autoAlpha: 1, scale: 1, duration: 0.7, ease: "power2.out" },
        0.05
      );

      // The detection frame (with its "حفرة" tag) locks onto it, then blinks
      // like a live bounding box confirming the hit.
      tl.fromTo(
        frame,
        { autoAlpha: 0, scale: 1.35 },
        { autoAlpha: 1, scale: 1, duration: 0.4, ease: "power3.out" },
        0.7
      );
      tl.to(frame, { opacity: 0.45, duration: 0.16, repeat: 3, yoyo: true, ease: "power1.inOut" }, 1.2);

      // Reveal: the pothole and tag fade while the frame's inside clears and
      // the square grows into a window onto the page beneath.
      const reveal = 2.35;
      const cover = Math.max(window.innerWidth, window.innerHeight) * 1.02;
      tl.to(pothole, { autoAlpha: 0, duration: 0.6, ease: "power1.out" }, reveal);
      tl.to(label, { autoAlpha: 0, duration: 0.25 }, reveal);
      tl.to(shadowWindow, { backgroundColor: "rgba(14,19,18,0)", duration: 0.3 }, reveal);
      tl.to(
        [shadowWindow, frame],
        { width: cover, height: cover, duration: 1.15, ease: "power4.inOut" },
        reveal
      );
      tl.to(frame, { autoAlpha: 0, duration: 0.35 }, reveal + 0.85);
    }, overlay);

    return () => {
      html.style.overflow = prevOverflow;
      html.style.scrollbarGutter = prevGutter;
      ctx.revert();
      ScrollTrigger.refresh();
    };
  }, []);

  if (done) return null;

  return (
    <div ref={overlayRef} className="fixed inset-0 z-100 grid place-items-center">
      {/* Window: its box-shadow keeps everything around it dark; its own dark
          background hides the page inside until the reveal clears it. */}
      <div
        ref={windowRef}
        className="col-start-1 row-start-1 h-72 w-110 bg-dark shadow-[0_0_0_200vmax_#0E1312]"
      />
      <img
        ref={potholeRef}
        src="/assets/pothole.png"
        alt=""
        aria-hidden="true"
        className="col-start-1 row-start-1 w-140 opacity-0"
      />
      {/* Detection bounding box with its class tag riding the top corner */}
      <div
        ref={frameRef}
        className="relative col-start-1 row-start-1 h-72 w-110 border-4 border-primary opacity-0"
      >
        <span
          ref={labelRef}
          className="absolute -top-1 -right-1 -translate-y-full bg-primary px-3 py-1 font-sans text-t4 font-bold text-on-primary"
        >
          حفرة
        </span>
      </div>
    </div>
  );
}
