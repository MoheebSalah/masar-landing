"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ScreenFrame from "./ScreenFrame";
import RollingTitle from "./RollingTitle";
import { MoonIcon, SunIcon } from "./Icons";
import HomeScreen from "./screens/HomeScreen";
import RecordScreen from "./screens/RecordScreen";
import CameraScreen from "./screens/CameraScreen";
import MapShotScreen from "./screens/MapShotScreen";
import TripsScreen from "./screens/TripsScreen";

gsap.registerPlugin(ScrollTrigger);

// Screen titles, in carousel order (the screens themselves are rendered in
// the same order inside the track below).
const TITLES = [
  "الواجهة الرئيسية",
  "تسجيل الرحلة",
  "وضع الصور",
  "خريطة الحُفر",
  "تفاصيل الرحلة",
  "رحلاتي",
];
const N = TITLES.length;

// Distance (px) between two neighbouring phone centres.
const STEP = 340;
// Pointer travel below this (px) still counts as a click, not a drag.
const CLICK_TOLERANCE = 6;

// The section flips between two states: "light" shows light screens on a
// dark section, "dark" shows dark screens on a light section. All colours
// hang off CSS variables scoped by data-mode (globals.css).
type Mode = "light" | "dark";

type DocumentWithVT = Document & {
  startViewTransition?: (update: () => void) => {
    ready: Promise<void>;
    finished: Promise<void>;
  };
};

export default function PhoneShowcase() {
  const sectionRef = useRef<HTMLElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Continuous, unbounded carousel position (slide i shows at virtual ≡ i mod N).
  const virtualRef = useRef(0);
  const switching = useRef(false);
  const drag = useRef({
    down: false,
    dragging: false,
    startX: 0,
    dx: 0,
    pressedIndex: 0,
  });

  const [mode, setMode] = useState<Mode>("light");
  // Rounded virtual position: drives the rolling title (monotonic) and the
  // active dot (mod N).
  const [step, setStep] = useState(0);

  const active = ((step % N) + N) % N;
  const dark = mode === "dark";

  // Lay the slides out for a (possibly fractional) position. Every slide is
  // wrapped to its nearest representative around the centre, so the loop has
  // no ends: the far slide teleports sides while fully faded out.
  const render = (virtual: number) => {
    slideRefs.current.forEach((slide, i) => {
      if (!slide) return;
      let signed = (((i - virtual) % N) + N) % N;
      if (signed > N / 2) signed -= N;
      const d = Math.abs(signed);
      const capped = Math.min(d, 3);
      gsap.set(slide, {
        x: signed * STEP,
        y: capped * capped * 30,
        rotation: Math.sign(signed) * capped * 12,
        scale: Math.max(0.76, 1 - 0.09 * capped),
        autoAlpha: d > 2.55 ? 0 : Math.max(0.25, 1 - 0.38 * d),
        zIndex: Math.round(100 - d * 10),
        transformOrigin: "50% 50%",
      });
    });
  };

  // The slides remount when the mode flips (see the slide key), which forces
  // the browser to re-rasterize their composited layers — repainting only the
  // theme variables proved unreliable. Their transforms live in inline styles
  // set by GSAP, so they must be re-applied synchronously before paint (and
  // before the view transition snapshots the new state).
  useLayoutEffect(() => {
    render(virtualRef.current);
  }, [mode]);

  // Appearance animation: once the section scrolls into view, the components
  // inside the rebuilt screens (everything tagged .sc-anim) rise in one after
  // another. The two screenshot screens have no tagged elements by design.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const ctx = gsap.context(() => {
      gsap.from(".sc-anim", {
        y: 30,
        autoAlpha: 0,
        duration: 0.6,
        ease: "power2.out",
        stagger: 0.05,
        scrollTrigger: {
          trigger: section,
          start: "top 60%",
          once: true,
        },
      });
    }, section);
    return () => ctx.revert();
  }, []);

  // Animate from the current position to a target virtual position.
  const goTo = (target: number) => {
    const rounded = Math.round(target);
    const proxy = { v: virtualRef.current };
    virtualRef.current = rounded;
    setStep(rounded);
    gsap.to(proxy, {
      v: rounded,
      duration: 0.7,
      ease: "power3.out",
      onUpdate: () => render(proxy.v),
    });
  };

  // Nearest representative of slide i relative to the current position.
  const nearest = (i: number) => {
    const v = virtualRef.current;
    let signed = (((i - v) % N) + N) % N;
    if (signed > N / 2) signed -= N;
    return v + signed;
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const el = (e.target as HTMLElement).closest("[data-index]");
    drag.current = {
      down: true,
      dragging: false,
      startX: e.clientX,
      dx: 0,
      pressedIndex: el
        ? Number(el.getAttribute("data-index"))
        : ((Math.round(virtualRef.current) % N) + N) % N,
    };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d.down) return;
    d.dx = e.clientX - d.startX;
    if (!d.dragging && Math.abs(d.dx) > CLICK_TOLERANCE) d.dragging = true;
    if (!d.dragging) return;
    // Content follows the finger — no ends to rubber-band against.
    render(virtualRef.current - d.dx / STEP);
  };

  const onPointerUp = () => {
    const d = drag.current;
    if (!d.down) return;
    d.down = false;
    if (!d.dragging) {
      goTo(nearest(d.pressedIndex));
      return;
    }
    goTo(virtualRef.current - d.dx / STEP);
  };

  const onPointerCancel = () => {
    if (!drag.current.down) return;
    drag.current.down = false;
    goTo(virtualRef.current);
  };

  // Theme toggle: a circle grows from the centre of the active phone and
  // reveals the flipped state as it expands over the whole section. Built on
  // the View Transitions API (browsers without it just switch instantly).
  const switchMode = (next: Mode) => {
    if (next === mode || switching.current) return;
    const doc = document as DocumentWithVT;
    const section = sectionRef.current;
    if (!doc.startViewTransition || !section) {
      setMode(next);
      return;
    }

    const origin = slideRefs.current[active] ?? section;
    const o = origin.getBoundingClientRect();
    const cx = o.left + o.width / 2;
    const cy = o.top + o.height / 2;
    // Big enough to cover the farthest corner of the section.
    const s = section.getBoundingClientRect();
    const radius = Math.max(
      Math.hypot(cx - s.left, cy - s.top),
      Math.hypot(s.right - cx, cy - s.top),
      Math.hypot(cx - s.left, s.bottom - cy),
      Math.hypot(s.right - cx, s.bottom - cy),
    );

    switching.current = true;
    const transition = doc.startViewTransition(() => {
      flushSync(() => setMode(next));
    });
    transition.ready
      .then(() => {
        document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${cx}px ${cy}px)`,
              `circle(${radius}px at ${cx}px ${cy}px)`,
            ],
          },
          {
            duration: 900,
            easing: "cubic-bezier(0.3, 0, 0.2, 1)",
            pseudoElement: "::view-transition-new(root)",
          },
        );
      })
      .catch(() => {});
    transition.finished.finally(() => {
      switching.current = false;
    });
  };

  const screens = [
    <HomeScreen key="home" dark={dark} />,
    <RecordScreen key="record" dark={dark} />,
    <CameraScreen key="camera" />,
    <MapShotScreen key="map1" dark={dark} src="/assets/Screens/map-screen-1" />,
    <MapShotScreen key="map2" dark={dark} src="/assets/Screens/map-screen-2" />,
    <TripsScreen key="trips" dark={dark} />,
  ];

  return (
    <section
      ref={sectionRef}
      id="app-preview"
      data-mode={mode}
      className="w-full overflow-hidden bg-(--sec-bg) px-8 py-32"
    >
      {/* Section heading */}
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="font-heading text-h2 text-(--sec-text)">
          تطبيق مسار بين يديك
        </h2>
        <p className="mx-auto mt-4 max-w-xl font-sans text-t2 text-(--sec-sub)">
          استعرض شاشات التطبيق وتنقّل بينها لتكتشف كيف تدير الطرق من مكان واحد.
        </p>
      </div>

      {/* Dark / light switch */}
      <div className="mb-4 mt-6 flex justify-center">
        <div className="flex gap-1 rounded-full bg-(--sec-chip) p-1.5">
          <button
            type="button"
            onClick={() => switchMode("dark")}
            className={`flex cursor-pointer items-center gap-2 rounded-full px-5 py-2.5 font-sans text-t5 font-bold transition-colors duration-300 ${
              dark ? "bg-primary text-[#0E1312]" : "text-(--sec-sub)"
            }`}
          >
            <MoonIcon className="h-4 w-4" strokeWidth={2} />
            داكن
          </button>
          <button
            type="button"
            onClick={() => switchMode("light")}
            className={`flex cursor-pointer items-center gap-2 rounded-full px-5 py-2.5 font-sans text-t5 font-bold transition-colors duration-300 ${
              dark ? "text-(--sec-sub)" : "bg-primary text-[#0E1312]"
            }`}
          >
            <SunIcon className="h-4 w-4" strokeWidth={2} />
            فاتح
          </button>
        </div>
      </div>

      {/* Infinite draggable coverflow — five phones visible at a time */}
      <div
        ref={carouselRef}
        dir="ltr"
        className="relative isolate h-183 w-full cursor-grab touch-pan-y select-none active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
      >
        {screens.map((screen, i) => (
          <div
            key={`${mode}-${TITLES[i]}`}
            ref={(el) => {
              slideRefs.current[i] = el;
            }}
            data-index={i}
            className="absolute left-1/2 top-0 -ml-43.75 will-change-transform"
          >
            <ScreenFrame>{screen}</ScreenFrame>
          </div>
        ))}
      </div>

      {/* Current screen title with the rolling swap */}
      <div className="mt-4 flex justify-center">
        <RollingTitle title={TITLES[active]} step={step} />
      </div>

      {/* Indicator — click a dot to jump to that screen. dir=ltr so the dots
          run in the same order as the phones. */}
      <div dir="ltr" className="mt-3 flex justify-center gap-3">
        {TITLES.map((title, i) => (
          <button
            key={title}
            type="button"
            aria-label={`الشاشة ${i + 1}`}
            onClick={() => goTo(nearest(i))}
            className={`h-2.5 cursor-pointer rounded-full transition-all duration-300 ${
              i === active
                ? "w-9 bg-primary"
                : "w-2.5 bg-(--sec-faint) hover:bg-(--sec-sub)"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
