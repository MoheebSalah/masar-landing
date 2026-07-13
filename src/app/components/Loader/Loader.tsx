"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { signalLoaderDone } from "./loaderSignal";
import { getLenis } from "../SmoothScroll/lenisInstance";

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

    // overflow:hidden doesn't stop Lenis — it drives its own wheel-based
    // scroll — so pause it too and keep the visitor on the hero. Lenis is
    // created in the parent SmoothScroll effect, which runs after this child
    // effect, so retry on the next frame until the instance exists.
    let lockRaf = 0;
    const lockScroll = () => {
      const lenis = getLenis();
      if (lenis) lenis.stop();
      else lockRaf = requestAnimationFrame(lockScroll);
    };
    lockScroll();

    const ctx = gsap.context(() => {
      const finish = () => {
        html.style.overflow = prevOverflow;
        html.style.scrollbarGutter = prevGutter;
        cancelAnimationFrame(lockRaf);
        getLenis()?.start();
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
        { autoAlpha: 0, scale: 1.4 },
        { autoAlpha: 1, scale: 1, duration: 0.45, ease: "power3.out" },
        0.6
      );
      intro.to(label, { autoAlpha: 1, duration: 0.3 }, 0.7);

      // The frame breathes as it locks onto the pothole — staying dead centred
      // the whole time. It pulses: shrinking well in (−25% of the initial
      // size), springing back out a touch (+5% over it), then repeating. Each
      // shrink takes longer than the quicker spring back out, giving it a
      // measured "closing in" feel before it settles.
      const lock = gsap.timeline({ delay: 1.05 });
      // shrink well in
      lock.to(frame, { scale: 0.8, duration: 0.55, ease: "power2.inOut" }, 0);
      // spring back out a touch (quicker)
      lock.to(frame, { scale: 0.85, duration: 0.28, ease: "power2.out" }, 0.55);
      // shrink in again
      lock.to(frame, { scale: 0.65, duration: 0.55, ease: "power2.inOut" }, 0.83);
      // spring back out a touch (quicker)
      lock.to(frame, { scale: 0.7, duration: 0.28, ease: "power2.out" }, 1.38);
      // shrink in one last time and settle, centred over the pothole
      lock.to(frame, { scale: 0.5, duration: 0.55, ease: "power3.out" }, 1.66);

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
          // The frame settled smaller than full scale during the lock; match
          // the dark window to that same scale now so the dark cutout lines up
          // exactly with the detection box before they grow out together.
          gsap.set(shadowWindow, {
            scale: gsap.getProperty(frame, "scale") as number,
          });
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
          // Clear the frame's primary fill too, so the growing box becomes a
          // clean window onto the page rather than tinting it primary.
          out.to(
            frame,
            { backgroundColor: "rgba(52,168,216,0)", duration: 0.3 },
            0
          );
          // The frame settled tight below full scale; expand it back to scale 1
          // as it grows so the box opens all the way out to the viewport edges
          // in step with the dark window (now matched to the same start scale).
          out.to(
            [shadowWindow, frame],
            {
              width: cover,
              height: cover,
              scale: 1,
              duration: 1.15,
              ease: "power4.inOut",
            },
            0
          );
          out.to(frame, { autoAlpha: 0, duration: 0.35 }, 0.85);
        },
      });
    }, overlay);

    return () => {
      html.style.overflow = prevOverflow;
      html.style.scrollbarGutter = prevGutter;
      cancelAnimationFrame(lockRaf);
      getLenis()?.start();
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
        className="relative col-start-1 row-start-1 h-72 w-110 border-4 border-primary bg-primary/40 opacity-0"
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
