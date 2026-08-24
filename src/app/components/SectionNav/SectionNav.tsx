"use client";

import { useEffect, useRef, useState } from "react";
import { getLenis } from "../SmoothScroll/lenisInstance";

/**
 * The sections the rail can jump to, in document order. Hero and Footer are
 * deliberately absent — when the viewport centre sits in either of them no
 * entry matches, which is what drives the rail to hide there.
 */
const SECTIONS = [
  { id: "statement", label: "التحدي" },
  { id: "solution", label: "الحل" },
  { id: "workflow", label: "آلية العمل" },
  { id: "see-in-action", label: "أثناء العمل" },
  { id: "app-preview", label: "التطبيق" },
  { id: "impact", label: "الأثر" },
  { id: "map-section", label: "الخريطة" },
  { id: "cta-road", label: "ابدأ الآن" },
] as const;

type Theme = "light" | "dark";

/** Perceived luminance test on a computed `rgb(...)` / `rgba(...)` string. */
function isDarkBackground(color: string): boolean {
  const match = color.match(/\d+(\.\d+)?/g);
  if (!match || match.length < 3) return false;
  const [r, g, b] = match.map(Number);
  // Rec. 601 luma — good enough to tell a light section from a dark one.
  const luma = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luma < 0.5;
}

export default function SectionNav() {
  const [active, setActive] = useState(-1);
  const [visible, setVisible] = useState(false);
  const [theme, setTheme] = useState<Theme>("light");

  // The rAF loop compares against the last values it committed. These refs are
  // only written inside the loop, never during render.
  const activeRef = useRef(-1);
  const visibleRef = useRef(false);
  const themeRef = useRef<Theme>("light");

  useEffect(() => {
    // Resolve the section elements once; ids are stable for the page's life.
    const els = SECTIONS.map((s) => document.getElementById(s.id));
    let frame = 0;

    // A per-frame loop rather than a scroll listener: it keeps the active
    // section frame-accurate on fast flings, and — crucially — re-samples the
    // live background every frame. That way the rail re-themes itself even
    // while a section changes its own colour without any scrolling, e.g. the
    // PhoneShowcase dark/light toggle, or Solution's GSAP-driven fade to dark.
    const tick = () => {
      const centre = window.innerHeight / 2;

      // The active section is the one covering the vertical centre of the
      // viewport. Tall pinned sections (Impact, the hero run) stay "current" for
      // their whole pin, which is exactly what we want.
      let next = -1;
      for (let i = 0; i < els.length; i++) {
        const el = els[i];
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top <= centre && rect.bottom > centre) {
          next = i;
          break;
        }
      }

      const nextVisible = next !== -1;
      if (nextVisible !== visibleRef.current) {
        visibleRef.current = nextVisible;
        setVisible(nextVisible);
      }

      if (next !== activeRef.current) {
        activeRef.current = next;
        setActive(next);
      }

      // Sample the active section's *current* background every frame so
      // gradual colour transitions flip the rail's theme at the crossover
      // point instead of only when a new section takes over.
      const el = next !== -1 ? els[next] : null;
      if (el) {
        const nextTheme: Theme = isDarkBackground(
          getComputedStyle(el).backgroundColor,
        )
          ? "dark"
          : "light";
        if (nextTheme !== themeRef.current) {
          themeRef.current = nextTheme;
          setTheme(nextTheme);
        }
      }

      frame = requestAnimationFrame(tick);
    };

    tick();
    return () => cancelAnimationFrame(frame);
  }, []);

  const goTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(el, { offset: 0 });
    else el.scrollIntoView({ behavior: "smooth" });
  };

  const inactiveLine = theme === "dark" ? "bg-muted-dark" : "bg-muted";
  const inactiveText = theme === "dark" ? "text-subtext-dark" : "text-subtext";
  const hoverText =
    theme === "dark"
      ? "group-hover/item:text-text-dark"
      : "group-hover/item:text-text";

  return (
    <div className="pointer-events-none fixed inset-y-0 left-0 z-40 hidden items-center pl-6 lg:flex">
      {/* The nav box itself is the hover target (with padding), so the labels
          reveal when the cursor comes *near* the rail — not only when it's
          precisely over a 3px line. */}
      <nav
        aria-label="التنقل بين الأقسام"
        aria-hidden={!visible}
        className={`group pointer-events-auto flex flex-col gap-6 py-4 pr-10 pl-2 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          visible ? "translate-x-0" : "translate-x-[-150%]"
        }`}
      >
        {SECTIONS.map((section, i) => {
          const isActive = i === active;
          return (
            // The whole row is the click target. dir=ltr so the line anchors on
            // the physical LEFT (the document is RTL, which would otherwise flip
            // start/end): every line shares a left edge and the active one grows
            // further to the right, with the name sitting to its right.
            <button
              key={section.id}
              type="button"
              dir="ltr"
              onClick={() => goTo(section.id)}
              tabIndex={visible ? 0 : -1}
              aria-current={isActive ? "true" : undefined}
              className="group/item flex cursor-pointer items-center gap-4 py-1"
            >
              {/* Line — left-aligned inside a fixed-width box so the active
                  line extends rightward from the shared left edge. */}
              <span className="flex w-9 items-center">
                <span
                  className={`h-0.75 rounded-full transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    isActive
                      ? "w-9 bg-primary"
                      : `w-4 ${inactiveLine} group-hover/item:w-6`
                  }`}
                />
              </span>

              {/* Name — sits to the RIGHT of the line, hidden until the rail is
                  hovered nearby, then fades and eases into place. */}
              <span
                dir="rtl"
                className={`whitespace-nowrap font-sans text-t5 opacity-0 transition-all duration-300 ease-out group-hover:translate-x-0 group-hover:opacity-100 translate-x-2 ${
                  isActive ? "font-bold text-primary" : `${inactiveText} ${hoverText}`
                }`}
              >
                {section.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
