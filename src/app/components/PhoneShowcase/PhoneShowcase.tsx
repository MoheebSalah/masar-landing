"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import PhoneFrame from "./PhoneFrame";
import RollingTitle from "./RollingTitle";

// App screens shown in the carousel, in display order. Same title for every
// screen for now.
const SCREENS = [
  { image: "/assets/mockup/carousel%201.png", title: "الواجهة الرئيسية" },
  { image: "/assets/mockup/carousel%202.png", title: "الوضع الداكن" },
  { image: "/assets/mockup/carousel%203.png", title: "وضع الصور" },
  { image: "/assets/mockup/carousel%204.png", title: "خريطة الحفر" },
  { image: "/assets/mockup/carousel%205.png", title: "تسجيل الرحلة" },
  { image: "/assets/mockup/carousel%206.png", title: "رحلاتي" },
];

// Distance (px) between two neighbouring phone centres — also the slide width.
const STEP = 340;
// Pointer travel below this (px) still counts as a click, not a drag.
const CLICK_TOLERANCE = 6;

export default function PhoneShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);

  const activeRef = useRef(0);
  const widthRef = useRef(0);
  const drag = useRef({
    down: false,
    dragging: false,
    startX: 0,
    dx: 0,
    pressedIndex: 0,
  });

  const [active, setActive] = useState(0);

  // Lay the track out for a (possibly fractional) active position: centre that
  // slide upright, and fan the neighbours out along an arc — each step away
  // adds tilt and drops the phone further down, fading and shrinking with
  // distance. Effects are capped a few slides out so far phones don't fly off.
  const render = (virtual: number) => {
    const track = trackRef.current;
    if (!track) return;
    const centre = widthRef.current / 2 - STEP / 2;
    gsap.set(track, { x: centre - virtual * STEP });
    slideRefs.current.forEach((slide, i) => {
      if (!slide) return;
      const signed = i - virtual;
      const d = Math.abs(signed);
      const capped = Math.min(d, 3);
      gsap.set(slide, {
        rotation: Math.sign(signed) * capped * 14,
        y: capped * capped * 35,
        scale: Math.max(0.78, 1 - 0.11 * capped),
        opacity: Math.max(0.2, 1 - 0.5 * d),
        transformOrigin: "50% 50%",
        zIndex: Math.round(100 - d * 10),
      });
    });
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const measure = () => {
      widthRef.current = container.offsetWidth;
      render(activeRef.current);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Animate from the current position to a target slide and settle there.
  const goTo = (next: number) => {
    const clamped = Math.max(0, Math.min(SCREENS.length - 1, next));
    const proxy = { v: activeRef.current };
    activeRef.current = clamped;
    setActive(clamped);
    gsap.to(proxy, {
      v: clamped,
      duration: 0.7,
      ease: "power3.out",
      onUpdate: () => render(proxy.v),
    });
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    // Remember which phone was pressed so a click (no drag) can select it.
    const el = (e.target as HTMLElement).closest("[data-index]");
    const pressedIndex = el
      ? Number(el.getAttribute("data-index"))
      : activeRef.current;
    drag.current = {
      down: true,
      dragging: false,
      startX: e.clientX,
      dx: 0,
      pressedIndex,
    };
    gsap.killTweensOf(trackRef.current);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d.down) return;
    d.dx = e.clientX - d.startX;
    if (!d.dragging && Math.abs(d.dx) > CLICK_TOLERANCE) d.dragging = true;
    if (!d.dragging) return;
    // Content follows the finger; a small rubber band past either end.
    const virtual = activeRef.current - d.dx / STEP;
    const clamped = Math.max(-0.3, Math.min(SCREENS.length - 1 + 0.3, virtual));
    render(clamped);
  };

  const onPointerUp = () => {
    const d = drag.current;
    if (!d.down) return;
    d.down = false;
    // A still click selects the phone that was pressed.
    if (!d.dragging) {
      goTo(d.pressedIndex);
      return;
    }
    // Land on the phone the drag projected to — can span several screens.
    goTo(Math.round(activeRef.current - d.dx / STEP));
  };

  const onPointerCancel = () => {
    if (!drag.current.down) return;
    drag.current.down = false;
    goTo(activeRef.current);
  };

  return (
    <section
      id="app-preview"
      className="w-full overflow-hidden bg-dark px-8 py-32"
    >
      {/* Section heading */}
      <div className="mx-auto mb-16 max-w-3xl text-center">
        <h2 className="font-heading text-h2 text-text-dark">
          تطبيق مسار بين يديك
        </h2>
        <p className="mx-auto mt-4 max-w-xl font-sans text-t2 text-subtext-dark">
          استعرض شاشات التطبيق وتنقّل بينها لتكتشف كيف تدير الطرق من مكان واحد.
        </p>
      </div>

      {/* Draggable coverflow carousel */}
      <div
        ref={containerRef}
        dir="ltr"
        className="relative w-full cursor-grab touch-pan-y select-none active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
      >
        <div ref={trackRef} className="flex will-change-transform">
          {SCREENS.map((screen, i) => (
            <div
              key={screen.image}
              ref={(el) => {
                slideRefs.current[i] = el;
              }}
              data-index={i}
              className="flex w-85 shrink-0 justify-center"
            >
              <PhoneFrame image={screen.image} />
            </div>
          ))}
        </div>
      </div>

      {/* Current screen title with the rolling swap */}
      <div className="mt-14 flex justify-center">
        <RollingTitle title={SCREENS[active].title} step={active} />
      </div>

      {/* Indicator — click a dot to jump to that screen. dir=ltr so the dots
          run in the same order as the phones. */}
      <div dir="ltr" className="mt-6 flex justify-center gap-3">
        {SCREENS.map((screen, i) => (
          <button
            key={screen.image}
            type="button"
            aria-label={`الشاشة ${i + 1}`}
            onClick={() => goTo(i)}
            className={`h-2.5 cursor-pointer rounded-full transition-all duration-300 ${
              i === active
                ? "w-9 bg-primary"
                : "w-2.5 bg-text-dark/30 hover:bg-text-dark/60"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
