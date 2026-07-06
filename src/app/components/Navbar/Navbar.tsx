"use client";

import { useEffect, useState } from "react";
import Logo from "../Logo/Logo";
import NavLink from "./NavLink";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    // Shrink once the visitor has scrolled past a third of the hero (≈ a third of the viewport).
    const onScroll = () => setScrolled(window.scrollY > window.innerHeight / 3);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <header dir="ltr" className="fixed inset-x-0 top-0 z-50 flex justify-center">
      <nav
        className={`nav-shell group flex items-center justify-between ${
          scrolled
            ? "mt-4 h-[60px] w-[min(90%,56rem)] rounded-brand bg-background px-6 shadow-[0_10px_30px_-12px_rgba(14,19,18,0.25)] hover:bg-primary"
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
              scrolled ? "h-9" : "h-12 md:h-14"
            }`}
          />
          <span
            aria-hidden="true"
            className={`pointer-events-none absolute left-1/2 top-full -translate-x-1/2 origin-top text-center font-heading text-[24px] leading-tight transition-all duration-500 ease-in ${
              scrolled
                ? "-translate-y-4 scale-50 opacity-0"
                : "translate-y-0 scale-100 opacity-100"
            }`}
          >
            مسار
          </span>
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
