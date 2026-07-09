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
  const labelRef = useRef<HTMLDivElement>(null);
  const percentRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const overlay = overlayRef.current;
    const shadowWindow = windowRef.current;
    const pothole = potholeRef.current;
    const frame = frameRef.current;
    const label = labelRef.current;
    const percent = percentRef.current;
    if (!overlay || !shadowWindow || !pothole || !frame || !label || !percent)
      return;

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
      const finish = () => {
        html.style.overflow = prevOverflow;
        html.style.scrollbarGutter = prevGutter;
        // Pinned sections measured themselves while the scrollbar was
        // hidden; re-measure now that it's back, or they end up a
        // scrollbar-width too wide (horizontal overflow).
        ScrollTrigger.refresh();
        setDone(true);
      };

      // Intro: the pothole emerges on the dark stage and the detection frame
      // (with its "حفرة" readout) locks onto it.
      const intro = gsap.timeline();
      intro.fromTo(
        pothole,
        { autoAlpha: 0, scale: 0.9 },
        { autoAlpha: 1, scale: 1, duration: 0.7, ease: "power2.out" },
        0.05
      );
      intro.fromTo(
        frame,
        { autoAlpha: 0, scale: 1.35 },
        { autoAlpha: 1, scale: 1, duration: 0.4, ease: "power3.out" },
        0.6
      );
      intro.to(label, { autoAlpha: 1, duration: 0.3 }, 0.7);

      // The frame keeps re-fitting the pothole: its size and aspect ratio
      // drift the way a live bounding box jitters while it locks on — the
      // same restless resizing the app shows when it spots a pothole.
      const morph = gsap.timeline({ repeat: -1, yoyo: true });
      const states = [
        { width: 300, height: 210 },
        { width: 470, height: 250 },
        { width: 360, height: 330 },
        { width: 510, height: 200 },
        { width: 330, height: 290 },
      ];
      states.forEach((s) =>
        morph.to(frame, { ...s, duration: 0.3, ease: "sine.inOut" })
      );
      morph.pause();
      gsap.delayedCall(1.0, () => morph.play());

      // The load progresses on a percentage readout counting to 100.00%.
      // Reaching 100% triggers the reveal.
      const counter = { val: 0 };
      gsap.to(counter, {
        val: 100,
        duration: 3.6,
        delay: 1.0,
        ease: "power1.inOut",
        onUpdate: () => {
          percent.textContent = counter.val.toFixed(2).padStart(5, "0") + "%";
        },
        onComplete: () => {
          morph.kill();
          const cover =
            Math.max(window.innerWidth, window.innerHeight) * 1.02;
          // Reveal: the pothole and readout fade while the frame's inside
          // clears and the square grows into a window onto the page beneath.
          const out = gsap.timeline({ onComplete: finish });
          out.to(pothole, { autoAlpha: 0, duration: 0.6, ease: "power1.out" }, 0);
          out.to(label, { autoAlpha: 0, duration: 0.25 }, 0);
          out.to(
            shadowWindow,
            { backgroundColor: "rgba(14,19,18,0)", duration: 0.3 },
            0
          );
          out.to(
            [shadowWindow, frame],
            { width: cover, height: cover, duration: 1.15, ease: "power4.inOut" },
            0
          );
          out.to(frame, { autoAlpha: 0, duration: 0.35 }, 0.85);
        },
      });
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
      {/* Detection bounding box — restlessly resizing over the pothole */}
      <div
        ref={frameRef}
        className="col-start-1 row-start-1 h-72 w-110 border-4 border-primary opacity-0"
      />
      {/* Class readout with the live load percentage, sitting above the box */}
      <div
        ref={labelRef}
        className="col-start-1 row-start-1 flex -translate-y-57.5 items-center gap-4 font-sans opacity-0"
      >
        <span className="text-h3 font-bold text-primary">حفرة</span>
        <span ref={percentRef} className="text-h3 font-bold tabular-nums text-text-dark">
          00.00%
        </span>
      </div>
    </div>
  );
}
