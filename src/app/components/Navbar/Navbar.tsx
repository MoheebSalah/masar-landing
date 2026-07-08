"use client";

import { useEffect, useRef, useState } from "react";
import Logo from "../Logo/Logo";
import NavLink from "./NavLink";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

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

  return (
    <header
      dir="ltr"
      className={`fixed inset-x-0 top-0 z-50 flex justify-center transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        hidden ? "-translate-y-24" : "translate-y-0"
      }`}
    >
      <nav
        className={`nav-shell group flex items-center justify-between ${
          scrolled
            ? "mt-4 h-10 w-100 rounded-2xl bg-white px-5 shadow-[0_10px_30px_-12px_rgba(14,19,18,0.25)] hover:bg-primary"
            : "mt-0 h-24 w-full bg-transparent px-8 md:h-28 md:px-16 lg:px-32"
        }`}
      >
        {/* Logo — left corner, with the wordmark below it */}
        <a
          href="#"
          aria-label="مسار"
          className={`relative flex items-center transition-colors duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            scrolled ? "text-on-primary" : "text-white"
          }`}
        >
          <Logo
            className={`w-auto transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              scrolled ? "h-7" : "h-12 md:h-14"
            }`}
          />
        </a>

        {/* Anchors — right corner */}
        <div
          dir="rtl"
          className={`flex items-center gap-8 text-t3 transition-colors duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            scrolled ? "text-on-primary" : "text-text-dark"
          }`}
        >
          <NavLink href="#about">من نحن</NavLink>
          <NavLink href="#contact">تواصل معنا</NavLink>
        </div>
      </nav>
    </header>
  );
}
