"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { signalLoaderDone } from "./loaderSignal";

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
      const raf = requestAnimationFrame(() => {
        signalLoaderDone();
        setDone(true);
      });
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
        signalLoaderDone();
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

      // The frame doesn't smoothly resize — it glitches like a CV feed
      // struggling to lock: it shows, cuts to black, snaps back a little
      // smaller and skewed, stutters harder, then settles cleanly onto the
      // pothole and holds there until the load completes.
      const glitch = gsap.timeline({ delay: 1.05 });
      const cut = (at: number, tf: gsap.TweenVars) => {
        glitch.set(frame, { autoAlpha: 0 }, at);
        glitch.set(frame, { autoAlpha: 1, ...tf }, at + 0.04);
      };

      // shows, then cuts and snaps back shifted
      cut(0.0, { x: 9, y: -5, scale: 1.03, skewX: 5 });
      glitch.set(frame, { autoAlpha: 0 }, 0.15);
      glitch.set(frame, { autoAlpha: 1, x: 0, y: 0, scale: 1, skewX: 0 }, 0.25);
      glitch.to(frame, { duration: 0.35 }, 0.25); // brief hold

      // gets a bit smaller, glitching
      cut(0.65, { x: -11, y: 6, scale: 0.9, skewX: -7 });
      glitch.set(frame, { autoAlpha: 0 }, 0.75);
      cut(0.82, { x: 7, y: -8, scale: 0.86, skewX: 9 });
      glitch.to(frame, { duration: 0.28 }, 0.94); // hold smaller

      // rapid stutter — the messiest burst
      cut(1.28, { x: 15, y: 1, scale: 0.93, skewX: -11 });
      cut(1.38, { x: -13, y: 6, scale: 0.88, skewX: 11 });
      glitch.set(frame, { autoAlpha: 0 }, 1.48);
      cut(1.56, { x: 5, y: -6, scale: 1.06, skewX: -4 });

      // settle cleanly onto the pothole and hold
      glitch.to(
        frame,
        { autoAlpha: 1, x: 0, y: 0, scale: 1, skewX: 0, duration: 0.4, ease: "power2.out" },
        1.72
      );

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
      {/* Detection bounding box — glitches, then settles over the pothole.
          The readout tag is a child so it cuts and skews along with the box. */}
      <div
        ref={frameRef}
        className="relative col-start-1 row-start-1 h-72 w-110 border-4 border-primary opacity-0"
      >
        {/* Class readout on a primary chip, stuck just above the box's top edge */}
        <div
          ref={labelRef}
          className="absolute bottom-full right-0 mb-2 flex items-center gap-3 bg-primary px-4 py-1.5 font-sans opacity-0"
        >
          <span className="text-t1 font-bold text-on-primary">حفرة</span>
          <span
            ref={percentRef}
            className="text-t1 font-bold tabular-nums text-on-primary"
          >
            00.00%
          </span>
        </div>
      </div>
    </div>
  );
}
