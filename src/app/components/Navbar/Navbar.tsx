"use client";

import { useEffect, useState } from "react";
import Logo from "../Logo/Logo";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      dir="ltr"
      className="fixed inset-x-0 top-0 z-50 flex justify-center"
    >
      <nav
        className={`nav-shell group flex items-center justify-between ${
          scrolled
            ? "mt-4 h-[60px] w-[min(90%,56rem)] rounded-brand bg-background px-6 shadow-[0_10px_30px_-12px_rgba(14,19,18,0.25)] hover:bg-primary"
            : "mt-0 h-24 w-full bg-transparent px-8 md:h-28 md:px-16 lg:px-32"
        }`}
      >
        {/* Logo — left corner */}
        <a
          href="#"
          aria-label="مسار"
          className={`flex items-center transition-colors duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            scrolled ? "text-on-primary" : "text-white"
          }`}
        >
          <Logo
            className={`w-auto transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              scrolled ? "h-9" : "h-12 md:h-14"
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
          <a href="#about" className="transition-opacity duration-300 hover:opacity-70">
            من نحن
          </a>
          <a href="#contact" className="transition-opacity duration-300 hover:opacity-70">
            تواصل معنا
          </a>
        </div>
      </nav>
    </header>
  );
}
