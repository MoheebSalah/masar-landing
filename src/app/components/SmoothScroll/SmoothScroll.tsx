"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { setLenis } from "./lenisInstance";

gsap.registerPlugin(ScrollTrigger);

export default function SmoothScroll({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  useEffect(() => {
    // Always open at the top on load/refresh. `scrollRestoration` is also set
    // to "manual" by an inline script in the layout <head> (before the browser
    // restores anything), but we reassert it here and force the native scroll
    // to the top before Lenis reads it.
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    window.scrollTo(0, 0);

    const lenis = new Lenis();
    // Publish it so other components can drive programmatic smooth scrolls.
    setLenis(lenis);

    // Lenis keeps its own virtual scroll position; if it initialised from a
    // browser-restored offset it would ease the page back down after our
    // reset. Snap Lenis itself to the top immediately so the visitor lands on
    // the hero, not a little way down it.
    lenis.scrollTo(0, { immediate: true, force: true });

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
      setLenis(null);
    };
  }, []);

  return <>{children}</>;
}
