"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function SmoothScroll({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  useEffect(() => {
    const lenis = new Lenis();

    // Keep ScrollTrigger in sync with Lenis' virtual scroll position so
    // pinned / scrubbed animations stay accurate.
    lenis.on("scroll", ScrollTrigger.update);

    // Drive Lenis from GSAP's ticker instead of its own rAF loop, so both
    // share a single frame clock (gsap.ticker uses seconds, Lenis wants ms).
    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
