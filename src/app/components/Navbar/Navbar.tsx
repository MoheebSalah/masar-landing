"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import Logo from "../Logo/Logo";
import NavLink from "./NavLink";
import BurgerButton from "./BurgerButton";
import MobileMenu from "./MobileMenu";
import { onLoaderDone } from "../Loader/loaderSignal";
import { getLenis } from "../SmoothScroll/lenisInstance";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const lastY = useRef(0);
  const linksRef = useRef<HTMLDivElement>(null);
  const desktopLogoRef = useRef<HTMLAnchorElement>(null);
  const mobileLogoRef = useRef<HTMLAnchorElement>(null);
  const burgerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;

      // Everything keys off the same moment: the point where the hero's opening
      // headline has lifted away and the scroll-driven footage takes the stage.
      // Until then the bar sits transparent over the hero's dimmed, blurred
      // opening frame, so its marks are light like the headline they sit above;
      // past it, it gets out of the way — the story below is the point.
      const pastIntro = y > window.innerHeight * 0.4;
      setScrolled(pastIntro);

      // Once past that point, hide on the way down and slide back in from the
      // top on the way up.
      if (!pastIntro) {
        setHidden(false);
      } else if (y > lastY.current + 4) {
        setHidden(true);
      } else if (y < lastY.current - 4) {
        setHidden(false);
      }

      lastY.current = y;
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  // While the menu is open, freeze the page (Lenis drives the smooth scroll)
  // and let Escape dismiss it.
  useEffect(() => {
    const lenis = getLenis();
    if (menuOpen) lenis?.stop();
    else lenis?.start();

    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  // Reveal the bar once the loading screen clears — mark, then links (or the
  // burger on phones), each dropping in from just above its resting spot.
  //
  // Each bar staggers on its own so whichever one is on screen starts at zero:
  // only one of the two is ever laid out at a time, and a single flat stagger
  // over both would leave the phone's pair waiting out the desktop pair's turn.
  useEffect(() => {
    const bars = [
      [desktopLogoRef.current, linksRef.current].filter(Boolean),
      [mobileLogoRef.current, burgerRef.current].filter(Boolean),
    ].filter((bar) => bar.length > 0);
    if (bars.length === 0) return;

    gsap.set(bars.flat(), { autoAlpha: 0, y: -16 });
    return onLoaderDone(() => {
      bars.forEach((bar) => {
        gsap.to(bar, {
          autoAlpha: 1,
          y: 0,
          duration: 0.7,
          ease: "power3.out",
          stagger: 0.12,
        });
      });
    });
  }, []);

  // The mobile bar's marks are white for the whole page — a black gradient
  // behind them (below) guarantees contrast over any section, and the hero's
  // opening is now veiled dark rather than near-white, so it wants white marks
  // too. The one place they flip dark is the light dropdown card.
  const mobileDark = menuOpen;

  return (
    <>
      <header
        dir="ltr"
        className={`fixed inset-x-0 top-0 z-50 flex justify-center transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          hidden && !menuOpen ? "-translate-y-24" : "translate-y-0"
        }`}
      >
        {/* Desktop nav — shape morphs to a pill on scroll */}
        <nav
          className={`nav-shell group hidden items-center justify-between md:flex ${
            scrolled
              ? "mt-4 h-10 w-100 rounded-2xl bg-white px-5 hover:bg-primary"
              : "mt-0 h-24 w-full bg-transparent px-8 md:h-28 md:px-16 lg:px-32"
          }`}
        >
          {/* Logo — left corner. The bar carries its own mark from the first
              paint now; the hero's is the opening title's alone and never
              leaves it, so the two are simply two logos rather than one being
              handed over. It shrinks with the bar as that collapses into its
              pill. */}
          <a
            ref={desktopLogoRef}
            href="#"
            aria-label="مسار"
            className={`relative flex items-center transition-colors duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              scrolled ? "text-on-primary" : "text-text-dark"
            }`}
          >
            <Logo
              className={`w-auto transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                scrolled ? "h-9" : "h-16 md:h-18"
              }`}
            />
          </a>

          {/* Anchors — right corner */}
          <div
            ref={linksRef}
            dir="rtl"
            className={`flex items-center gap-8 text-t3 transition-colors duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              scrolled ? "text-on-primary" : "text-text-dark"
            }`}
          >
            <NavLink href="#contact">تواصل معنا</NavLink>
          </div>
        </nav>

        {/* Mobile bar — burger (left) + logo (right), transparent with a soft
            black gradient from the top so the white marks stay legible over any
            section behind them. The gradient clears when the light card is open. */}
        <div className="relative flex h-20 w-full items-center justify-between px-6 md:hidden">
          <div
            className={`pointer-events-none absolute inset-x-0 top-0 h-24 bg-linear-to-b from-black/35 via-black/10 to-transparent transition-opacity duration-300 ${
              mobileDark ? "opacity-0" : "opacity-100"
            }`}
          />

          {/* Wrapped so the loader entrance has its own box to drop in, clear
              of the gradient behind it — see the reveal effect above. */}
          <div ref={burgerRef} className="relative z-10">
            <BurgerButton
              open={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
              className={`transition-colors duration-300 ${
                mobileDark ? "text-text" : "text-white"
              }`}
            />
          </div>

          {/* The bar's own mark, at the other end from the burger — the phone's
              logo slot is the top-right corner. */}
          <a
            ref={mobileLogoRef}
            href="#"
            aria-label="مسار"
            className={`relative z-10 flex items-center transition-colors duration-300 ${
              mobileDark ? "text-text" : "text-white"
            }`}
          >
            <Logo className="h-11 w-auto" />
          </a>
        </div>
      </header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
