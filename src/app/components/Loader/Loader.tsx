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
    const prevBackground = html.style.background;
    // Keep the scrollbar's space reserved while overflow is hidden. Without
    // this the viewport gets a scrollbar-width wider during the loader, and
    // ScrollTrigger pins measured in that window keep the stale width —
    // leaving a horizontal overflow once the scrollbar returns.
    html.style.scrollbarGutter = "stable";
    html.style.overflow = "hidden";
    // The reserved gutter shows the html background (browser-default white) as
    // a strip beside the loader. Paint it the loader's dark so it blends in
    // until the real scrollbar returns at the reveal.
    html.style.background = "#0E1312";
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
        html.style.background = prevBackground;
        cancelAnimationFrame(lockRaf);
        getLenis()?.start();
        // Pinned sections measured themselves while the scrollbar was
        // hidden; re-measure now that it's back, or they end up a
        // scrollbar-width too wide (horizontal overflow).
        ScrollTrigger.refresh();
        signalLoaderDone();
        setDone(true);
      };

      // Reveal: the pothole and readout fade while the frame's inside clears
      // and the square grows into a window onto the page beneath. Fired the
      // instant the detection box settles, so the loader exits the moment the
      // animation lands instead of idling on a full progress bar.
      const reveal = () => {
        // Grow the box with a transform (scale), NOT width/height. Animating
        // width/height on this full-viewport element relayouts every frame and
        // registers a stream of layout shifts — it was the entire source of the
        // page's CLS. Scale is compositor-only, so it shifts nothing. Read the
        // box's live CSS size (it's smaller on phones) so the grow always covers
        // the viewport; 1.15 over-covers so no dark edge peeks.
        const boxW = shadowWindow.offsetWidth;
        const boxH = shadowWindow.offsetHeight;
        const coverScale =
          Math.max(window.innerWidth / boxW, window.innerHeight / boxH) * 1.15;
        // The frame settled smaller than full scale during the lock; match the
        // dark window to that same scale now so the dark cutout lines up exactly
        // with the detection box before they grow out together.
        gsap.set(shadowWindow, {
          scale: gsap.getProperty(frame, "scale") as number,
        });
        const out = gsap.timeline({ onComplete: finish });
        out.to(pothole, { autoAlpha: 0, duration: 0.5, ease: "power1.out" }, 0);
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
        // Both open out together from that shared start scale to full coverage.
        // Same base size + same target scale, so the dark cutout and detection
        // box stay perfectly aligned as they grow.
        out.to(
          [shadowWindow, frame],
          {
            scale: coverScale,
            duration: 1.0,
            ease: "power4.inOut",
          },
          0
        );
        out.to(frame, { autoAlpha: 0, duration: 0.35 }, 0.7);
      };

      // Intro: the pothole emerges on the dark stage and the detection frame
      // (with its "حفرة" readout) locks onto it.
      const intro = gsap.timeline();
      intro.fromTo(
        pothole,
        { autoAlpha: 0, scale: 0.9 },
        { autoAlpha: 1, scale: 1, duration: 0.4, ease: "power2.out" },
        0
      );
      intro.fromTo(
        frame,
        { autoAlpha: 0, scale: 1.2 },
        { autoAlpha: 1, scale: 1, duration: 0.5, ease: "power2.out" },
        0.1
      );
      intro.to(label, { autoAlpha: 1, duration: 0.25 }, 0.35);

      // The frame breathes as it locks onto the pothole — staying dead centred
      // the whole time. It pulses: shrinking well in (−25% of the initial
      // size), springing back out a touch (+5% over it), then repeating. Each
      // shrink takes longer than the quicker spring back out, giving it a
      // measured "closing in" feel before it settles. The moment it settles,
      // the reveal fires — this is what ends the loader.
      const lock = gsap.timeline({ delay: 0.6, onComplete: reveal });
      // shrink well in
      lock.to(frame, { scale: 0.8, duration: 0.38, ease: "power2.inOut" }, 0);
      // spring back out a touch (quicker)
      lock.to(frame, { scale: 0.85, duration: 0.18, ease: "power2.out" }, 0.38);
      // shrink in again
      lock.to(frame, { scale: 0.65, duration: 0.38, ease: "power2.inOut" }, 0.56);
      // spring back out a touch (quicker)
      lock.to(frame, { scale: 0.7, duration: 0.18, ease: "power2.out" }, 0.94);
      // shrink in one last time and settle, centred over the pothole
      lock.to(frame, { scale: 0.5, duration: 0.4, ease: "power3.out" }, 1.12);

      // The percentage readout counts to 100.00%, landing exactly as the box
      // settles so it reads complete the moment the reveal begins.
      const counter = { val: 0 };
      gsap.to(counter, {
        val: 100,
        duration: 1.52,
        delay: 0.6,
        ease: "power1.inOut",
        onUpdate: () => {
          percent.textContent = counter.val.toFixed(2).padStart(5, "0") + "%";
        },
      });
    }, overlay);

    return () => {
      html.style.overflow = prevOverflow;
      html.style.scrollbarGutter = prevGutter;
      html.style.background = prevBackground;
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
        className="col-start-1 row-start-1 h-52 w-80 bg-dark shadow-[0_0_0_200vmax_#0E1312] md:h-72 md:w-110"
      />
      <img
        ref={potholeRef}
        src="/assets/pothole.webp"
        alt=""
        aria-hidden="true"
        // First thing the visitor sees, so it jumps the queue rather than
        // waiting behind the fonts and the hero video.
        fetchPriority="high"
        decoding="async"
        className="col-start-1 row-start-1 w-96 opacity-0 md:w-140"
      />
      {/* Detection bounding box — glitches, then settles over the pothole.
          The readout tag is a child so it cuts and skews along with the box. */}
      <div
        ref={frameRef}
        className="relative col-start-1 row-start-1 h-52 w-80 border-4 border-primary bg-primary/40 opacity-0 md:h-72 md:w-110"
      >
        {/* Class readout on a primary chip, stuck just above the box's top edge */}
        <div
          ref={labelRef}
          className="absolute bottom-full right-0 mb-2 flex items-center gap-2 bg-primary px-3 py-1 font-sans opacity-0 md:gap-3 md:px-4 md:py-1.5"
        >
          <span className="text-t3 font-bold text-on-primary md:text-t1">حفرة</span>
          <span
            ref={percentRef}
            className="text-t3 font-bold tabular-nums text-on-primary md:text-t1"
          >
            00.00%
          </span>
        </div>
      </div>
    </div>
  );
}
