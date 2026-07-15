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
  const logoRef = useRef<HTMLAnchorElement>(null);
  const linksRef = useRef<HTMLDivElement>(null);
  const mobileBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;

      // Shrink as soon as the visitor leaves the very top of the page.
      setScrolled(y > 10);

      // While the hero (a full viewport tall) is still on screen the navbar
      // stays put. Once it's scrolled past, hide the navbar when moving down
      // and slide it back in from the top when moving up.
      const pastHero = y > window.innerHeight;
      if (!pastHero) {
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

  // Reveal the logo and links once the loading screen clears — they drop in
  // from just above their resting spot, the links trailing the logo slightly.
  useEffect(() => {
    const targets = [
      logoRef.current,
      linksRef.current,
      mobileBarRef.current,
    ].filter(Boolean);
    if (targets.length === 0) return;

    gsap.set(targets, { autoAlpha: 0, y: -16 });
    const unsubscribe = onLoaderDone(() => {
      gsap.to(targets, {
        autoAlpha: 1,
        y: 0,
        duration: 0.7,
        ease: "power3.out",
        stagger: 0.12,
      });
    });
    return unsubscribe;
  }, []);

  // Over the hero video the icons are light; once the visitor scrolls onto the
  // (light) sections below — or the menu drops its light card — they go dark.
  const mobileDark = scrolled || menuOpen;

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
          {/* Logo — left corner, with the wordmark below it */}
          <a
            ref={logoRef}
            href="#"
            aria-label="مسار"
            className={`relative flex items-center transition-colors duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              scrolled ? "text-on-primary" : "text-white"
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
            <NavLink href="#about">من نحن</NavLink>
            <NavLink href="#contact">تواصل معنا</NavLink>
          </div>
        </nav>

        {/* Mobile bar — burger (left) + logo (right), transparent with only a
            faint primary gradient from the top */}
        <div
          ref={mobileBarRef}
          className="relative flex h-20 w-full items-center justify-between px-6 md:hidden"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-linear-to-b from-primary/15 to-transparent" />

          <BurgerButton
            open={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className={`relative z-10 transition-colors duration-300 ${
              mobileDark ? "text-text" : "text-white"
            }`}
          />

          <a
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
