"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ScreenFrame from "./ScreenFrame";
import RollingTitle from "./RollingTitle";
import { MoonIcon, SunIcon } from "./Icons";
import { getLenis } from "../SmoothScroll/lenisInstance";
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

// Distance (px) between two neighbouring phone centres. On phones the viewport
// is too narrow for the desktop gap, so the neighbours get tucked closer behind
// the centred phone.
const STEP = 310;
const MOBILE_STEP = 70;
// Pointer travel below this (px) still counts as a click, not a drag.
const CLICK_TOLERANCE = 6;
// Horizontal travel (px) past which a fullscreen drag flicks to the next /
// previous screen instead of springing back.
const FS_SWIPE_THRESHOLD = 60;
// The authored screen size the fullscreen view scales up from.
const SCREEN_W = 402;
const SCREEN_H = 874;

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

// The coverflow transform for slide i at a given (fractional) position. The
// track curves back in depth — off-centre phones drop, tilt, shrink and blur
// (rather than darken), so the active screen reads as the sharp one in front.
const slideProps = (i: number, virtual: number, step: number, mobile: boolean) => {
  let signed = (((i - virtual) % N) + N) % N;
  if (signed > N / 2) signed -= N;
  const d = Math.abs(signed);
  const capped = Math.min(d, 3);
  return {
    x: signed * step,
    y: capped * capped * 30,
    rotation: Math.sign(signed) * capped * 12,
    scale: Math.max(0.82, 1 - 0.08 * capped),
    filter: `blur(${capped * 2}px)`,
    // Desktop keeps five phones on screen (only the far one fades across the
    // loop seam). Mobile shows just three — centre plus the two neighbours — so
    // anything past the neighbour is faded out.
    autoAlpha: mobile
      ? d > 2 ? 0 : d > 1.5 ? (2 - d) / 0.5 : 1
      : d > 2.55 ? 0 : d > 2.2 ? (2.55 - d) / 0.35 : 1,
    zIndex: Math.round(100 - d * 10),
    transformOrigin: "50% 50%",
  };
};

export default function PhoneShowcase() {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const fsScreenRef = useRef<HTMLDivElement>(null);
  const fsOverlayRef = useRef<HTMLDivElement>(null);
  // True while a fullscreen open / close / swipe tween is running, so a second
  // gesture can't fire on top of it.
  const fsBusyRef = useRef(false);
  // The in-progress fullscreen swipe gesture.
  const fsDrag = useRef({ down: false, moved: false, startX: 0, startY: 0 });
  // When the fullscreen overlay was opened — used to swallow the ghost tap that
  // a touchend synthesises right after, which would otherwise land on the
  // freshly-mounted overlay and close it immediately.
  const fsOpenedAtRef = useRef(0);
  // On phones the whole coverflow is scaled down so the section fits one screen;
  // this holds that factor so the drag stays 1:1 with the finger.
  const baseScaleRef = useRef(1);

  // Continuous, unbounded carousel position (slide i shows at virtual ≡ i mod N).
  const virtualRef = useRef(0);
  // The position actually painted on screen (tracks drags and mid-flight
  // tweens), so a new gesture can pick up smoothly from wherever the phones are.
  const posRef = useRef(0);
  // Neighbour gap in px — swapped for MOBILE_STEP under the md breakpoint.
  const stepRef = useRef(STEP);
  // On phones only three phones show (centre + immediate neighbours).
  const mobileRef = useRef(false);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const switching = useRef(false);
  const drag = useRef({
    down: false,
    dragging: false,
    startX: 0,
    startPos: 0,
    dx: 0,
    pressedIndex: 0,
  });

  const [mode, setMode] = useState<Mode>("light");
  // Rounded virtual position: drives the rolling title (monotonic) and the
  // active dot (mod N).
  const [step, setStep] = useState(0);
  // Phone-only: tapping the centred phone opens that screen fullscreen.
  const [fsOpen, setFsOpen] = useState(false);

  const active = ((step % N) + N) % N;
  const dark = mode === "dark";

  // Lay the slides out for a (possibly fractional) position. Every slide is
  // wrapped to its nearest representative around the centre, so the loop has
  // no ends: the far slide teleports sides while fully faded out. The track
  // curves back in depth — off-centre phones drop, tilt, shrink and blur
  // (rather than darken), so the active screen reads as the sharp one in front.
  const render = (virtual: number) => {
    posRef.current = virtual;
    slideRefs.current.forEach((slide, i) => {
      if (slide)
        gsap.set(slide, slideProps(i, virtual, stepRef.current, mobileRef.current));
    });
  };

  // The slides remount when the mode flips (see the slide key), which forces
  // the browser to re-rasterize their composited layers — repainting only the
  // theme variables proved unreliable. Their transforms live in inline styles
  // set by GSAP, so they must be re-applied synchronously before paint (and
  // before the view transition snapshots the new state).
  useLayoutEffect(() => {
    render(posRef.current);
  }, [mode]);

  // Pick the neighbour gap for the current viewport and re-lay the track.
  useEffect(() => {
    const applyStep = () => {
      mobileRef.current = window.innerWidth < 768;
      stepRef.current = mobileRef.current ? MOBILE_STEP : STEP;

      // On phones the coverflow is a fixed 688px tall (h-172). Scale it down to
      // whatever height its flex parent can spare, so the heading, toggle,
      // phones, title and dots always sit within one screen — on any phone.
      const carousel = carouselRef.current;
      if (carousel) {
        if (mobileRef.current) {
          const avail = carousel.parentElement?.clientHeight ?? carousel.offsetHeight;
          const s = Math.min(1, avail / carousel.offsetHeight);
          baseScaleRef.current = s;
          gsap.set(carousel, { scale: s, transformOrigin: "center center" });
        } else {
          baseScaleRef.current = 1;
          gsap.set(carousel, { clearProps: "scale,transform,transformOrigin" });
        }
      }
      render(posRef.current);
    };
    applyStep();
    window.addEventListener("resize", applyStep);
    return () => window.removeEventListener("resize", applyStep);
  }, []);

  // Appearance animation: once the section scrolls into view, the components
  // inside the rebuilt screens (everything tagged .sc-anim) rise in one after
  // another. The two screenshot screens have no tagged elements by design.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      // Desktop: every phone's internals rise in together — you can see the
      // whole spread, so animating them all reads as one coordinated reveal.
      mm.add("(min-width: 768px)", () => {
        gsap.from(".sc-anim", {
          y: 30,
          autoAlpha: 0,
          duration: 0.6,
          ease: "power2.out",
          stagger: 0.05,
          scrollTrigger: { trigger: section, start: "top 60%", once: true },
        });
      });

      // Mobile: the centred phone starts EMPTY — its internals are hidden from
      // the very first frame, so there's no flash of a full screen that then
      // re-animates — and the two neighbours start stacked flat behind it. On
      // scroll-in the screen fills element by element, then the two phones tilt
      // out from behind into their coverflow slots. Only the phones move; their
      // contents are already there, so nothing re-renders inside them.
      mm.add("(max-width: 767px)", () => {
        const centreIdx = ((Math.round(posRef.current) % N) + N) % N;
        const centre = slideRefs.current[centreIdx];
        const internals = centre
          ? Array.from(centre.querySelectorAll<HTMLElement>(".sc-anim"))
          : [];
        // The two immediate neighbours and the slots they'll settle into.
        const sides = [1, -1]
          .map((off) => {
            const i = (centreIdx + off + N) % N;
            return {
              el: slideRefs.current[i],
              to: slideProps(i, posRef.current, stepRef.current, mobileRef.current),
            };
          })
          .filter(
            (s): s is { el: HTMLDivElement; to: ReturnType<typeof slideProps> } =>
              !!s.el,
          );

        // Empty the centre screen; tuck the neighbours flat behind it.
        gsap.set(internals, { autoAlpha: 0, y: 30 });
        sides.forEach((s) =>
          gsap.set(s.el, {
            x: 0,
            rotation: 0,
            scale: s.to.scale * 0.88,
            autoAlpha: 0,
          }),
        );

        const tl = gsap.timeline({
          // Fire once the phone is actually on screen, so the reveal doesn't
          // finish before the visitor has scrolled it into view.
          scrollTrigger: { trigger: section, start: "top 35%", once: true },
        });
        // 1. The chosen screen fills in, element by element.
        tl.to(internals, {
          autoAlpha: 1,
          y: 0,
          duration: 0.6,
          ease: "power2.out",
          stagger: 0.05,
        });
        // 2. The two phones tilt out from behind into place, together.
        sides.forEach((s, k) =>
          tl.to(
            s.el,
            {
              x: s.to.x,
              rotation: s.to.rotation,
              scale: s.to.scale,
              autoAlpha: s.to.autoAlpha,
              duration: 0.6,
              ease: "power3.out",
            },
            k === 0 ? "-=0.1" : "<",
          ),
        );
      });

      // The heading, sub-line and the light/dark toggle rise in together as the
      // section arrives — the screen internals (.sc-anim) follow on their own.
      const headerEls = [
        ...(headingRef.current ? Array.from(headingRef.current.children) : []),
        toggleRef.current,
      ].filter(Boolean);
      gsap.from(headerEls, {
        y: 24,
        autoAlpha: 0,
        duration: 0.6,
        ease: "power2.out",
        stagger: 0.12,
        scrollTrigger: {
          trigger: section,
          start: "top 60%",
          once: true,
        },
      });
    }, section);
    return () => ctx.revert();
  }, []);

  // The scale that fits the authored 402×874 screen into the current viewport.
  const fitScale = () =>
    Math.min(window.innerWidth / SCREEN_W, window.innerHeight / SCREEN_H);

  // Close fullscreen with the reverse of the open move: the screen shrinks back
  // down as the backdrop fades out, then the overlay unmounts.
  const closeFs = () => {
    const overlay = fsOverlayRef.current;
    const el = fsScreenRef.current;
    if (!overlay) {
      setFsOpen(false);
      return;
    }
    fsBusyRef.current = true;
    if (el) gsap.to(el, { scale: fitScale() * 0.6, duration: 0.28, ease: "power2.in" });
    gsap.to(overlay, {
      autoAlpha: 0,
      duration: 0.28,
      ease: "power2.in",
      onComplete: () => setFsOpen(false),
    });
  };

  // Fullscreen: the tapped screen (authored at 402×874) zooms up to fill the
  // viewport as the backdrop fades in; page scroll is frozen; Escape / a tap /
  // the close button run the reverse. Swiping flicks between screens.
  useEffect(() => {
    if (!fsOpen) return;
    const el = fsScreenRef.current;
    const overlay = fsOverlayRef.current;
    const s = fitScale();
    // Grow the screen from a smaller size while the whole overlay fades in.
    if (el && overlay) {
      gsap.set(el, { scale: s * 0.6, x: 0, autoAlpha: 1 });
      gsap.set(overlay, { autoAlpha: 0 });
      gsap.to(overlay, { autoAlpha: 1, duration: 0.3, ease: "power2.out" });
      gsap.to(el, {
        scale: s,
        duration: 0.45,
        ease: "power3.out",
        onComplete: () => {
          fsBusyRef.current = false;
        },
      });
    }
    const fit = () => {
      if (el) gsap.set(el, { scale: fitScale() });
    };
    getLenis()?.stop();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeFs();
    };
    window.addEventListener("resize", fit);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("resize", fit);
      window.removeEventListener("keydown", onKey);
      getLenis()?.start();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fsOpen]);

  // Animate from the current position to a target virtual position.
  const goTo = (target: number) => {
    const rounded = Math.round(target);
    virtualRef.current = rounded;
    setStep(rounded);
    // Start the glide from wherever the phones currently sit (a released drag,
    // or an interrupted tween) rather than snapping back to the last settled
    // slot first.
    tweenRef.current?.kill();
    const proxy = { v: posRef.current };
    tweenRef.current = gsap.to(proxy, {
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

  // Fullscreen swipe: slide the current screen out in the drag direction, swap
  // to the neighbour (dir +1 = next, -1 = previous), then slide it in from the
  // opposite edge. The carousel underneath is advanced too, so exiting lands on
  // the same screen. x is divided by the fit scale because the transform is
  // applied before the scale, so a raw x reads as x·scale on screen.
  const fsSwipe = (dir: number) => {
    const el = fsScreenRef.current;
    if (!el || fsBusyRef.current) return;
    fsBusyRef.current = true;
    const off = window.innerWidth / fitScale();
    gsap.to(el, {
      x: -dir * off,
      autoAlpha: 0,
      duration: 0.2,
      ease: "power2.in",
      onComplete: () => {
        goTo(virtualRef.current + dir);
        gsap.set(el, { x: dir * off });
        gsap.to(el, {
          x: 0,
          autoAlpha: 1,
          duration: 0.32,
          ease: "power3.out",
          onComplete: () => {
            fsBusyRef.current = false;
          },
        });
      },
    });
  };

  const onFsPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    fsDrag.current = { down: true, moved: false, startX: e.clientX, startY: e.clientY };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const onFsPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = fsDrag.current;
    if (!d.down || fsBusyRef.current) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (!d.moved && Math.hypot(dx, dy) > CLICK_TOLERANCE) d.moved = true;
    if (!d.moved) return;
    // Let the screen trail the finger for feedback.
    const el = fsScreenRef.current;
    if (el) gsap.set(el, { x: dx / fitScale() });
  };

  const onFsPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = fsDrag.current;
    if (!d.down) return;
    d.down = false;
    if (fsBusyRef.current) return;
    const dx = e.clientX - d.startX;
    if (!d.moved) {
      // A tap (not a drag) closes — but not the ghost tap from opening.
      if (Date.now() - fsOpenedAtRef.current > 300) closeFs();
      return;
    }
    if (Math.abs(dx) > FS_SWIPE_THRESHOLD) {
      fsSwipe(dx < 0 ? 1 : -1);
    } else {
      const el = fsScreenRef.current;
      if (el) gsap.to(el, { x: 0, duration: 0.3, ease: "power3.out" });
    }
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    // Grab wherever the phones are right now, even mid-tween.
    tweenRef.current?.kill();
    const el = (e.target as HTMLElement).closest("[data-index]");
    drag.current = {
      down: true,
      dragging: false,
      startX: e.clientX,
      startPos: posRef.current,
      dx: 0,
      pressedIndex: el
        ? Number(el.getAttribute("data-index"))
        : ((Math.round(posRef.current) % N) + N) % N,
    };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d.down) return;
    d.dx = e.clientX - d.startX;
    if (!d.dragging && Math.abs(d.dx) > CLICK_TOLERANCE) d.dragging = true;
    if (!d.dragging) return;
    // Content follows the finger — no ends to rubber-band against. Divide by the
    // mobile down-scale so the track keeps pace with the finger 1:1.
    render(d.startPos - d.dx / (stepRef.current * baseScaleRef.current));
  };

  const onPointerUp = () => {
    const d = drag.current;
    if (!d.down) return;
    d.down = false;
    if (!d.dragging) {
      // A tap on the phone that's already centred opens it fullscreen (phones
      // only); tapping a neighbour brings it to the centre instead.
      const centred = ((Math.round(posRef.current) % N) + N) % N;
      if (d.pressedIndex === centred) {
        if (mobileRef.current) {
          fsOpenedAtRef.current = Date.now();
          setFsOpen(true);
        }
        return;
      }
      goTo(nearest(d.pressedIndex));
      return;
    }
    goTo(d.startPos - d.dx / (stepRef.current * baseScaleRef.current));
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
    // Express the reveal origin as PERCENTAGES of the viewport, not pixels. The
    // ::view-transition pseudo-element's coordinate space can be sized/scaled
    // differently from CSS pixels on real mobile browsers (dynamic URL bar,
    // fractional devicePixelRatio) — absolute px then land in the wrong place
    // (typically the top-left corner). Percentages are relative to that same
    // box, so they track the phone's centre on every device. A 150% radius
    // always reaches the farthest corner whatever the origin.
    const cx = ((o.left + o.width / 2) / window.innerWidth) * 100;
    const cy = ((o.top + o.height / 2) / window.innerHeight) * 100;

    switching.current = true;
    const transition = doc.startViewTransition(() => {
      flushSync(() => setMode(next));
    });
    transition.ready
      .then(() => {
        document.documentElement.animate(
          {
            clipPath: [
              `circle(0% at ${cx}% ${cy}%)`,
              `circle(150% at ${cx}% ${cy}%)`,
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
      className="w-full overflow-hidden bg-(--sec-bg) px-8 py-32 max-md:flex max-md:h-dvh max-md:flex-col max-md:justify-center max-md:gap-2 max-md:py-6"
    >
      {/* Section heading */}
      <div ref={headingRef} className="mx-auto max-w-3xl text-center">
        <h2 className="font-heading text-h2 text-(--sec-text) max-md:text-[1.6rem]">
          تطبيق مسار بين يديك
        </h2>
        <p className="mx-auto mt-4 max-w-xl font-sans text-t2 text-(--sec-sub) max-md:mt-1.5 max-md:text-t5">
          استعرض شاشات التطبيق وتنقّل بينها لتكتشف كيف تدير الطرق من مكان واحد.
        </p>
      </div>

      {/* Dark / light switch */}
      <div ref={toggleRef} className="mb-4 mt-6 flex justify-center max-md:mb-0 max-md:mt-3">
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

      {/* On phones this wrapper fills the leftover height so the coverflow can be
          scaled to fit it; on desktop it disappears (contents) and the carousel
          keeps its natural size. */}
      <div className="contents max-md:flex max-md:min-h-0 max-md:w-full max-md:flex-1 max-md:items-center max-md:justify-center">
        {/* Infinite draggable coverflow — five phones visible at a time */}
        <div
          ref={carouselRef}
          dir="ltr"
          className="relative isolate h-172 w-full cursor-grab touch-pan-y select-none active:cursor-grabbing"
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
              className="absolute left-1/2 top-0 -ml-40 will-change-transform"
            >
              <ScreenFrame>{screen}</ScreenFrame>
            </div>
          ))}
        </div>
      </div>

      {/* Current screen title with the rolling swap */}
      <div className="mt-12 flex justify-center max-md:mt-2">
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

      {/* Phone-only: the tapped screen blown up to fill the viewport. It lives
          inside #app-preview so it inherits the same --sv-* theme variables. */}
      {fsOpen && (
        <div
          ref={fsOverlayRef}
          className="fixed inset-0 z-100 flex touch-none items-center justify-center overflow-hidden bg-(--sv-bg) opacity-0 md:hidden"
          onPointerDown={onFsPointerDown}
          onPointerMove={onFsPointerMove}
          onPointerUp={onFsPointerUp}
          onPointerCancel={onFsPointerUp}
        >
          <div
            ref={fsScreenRef}
            className="origin-center overflow-hidden will-change-transform"
          >
            {screens[active]}
          </div>
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              closeFs();
            }}
            aria-label="إغلاق"
            className="absolute right-5 top-5 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-(--sv-glass) text-(--sv-glass-text) backdrop-blur-sm"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.4}
              strokeLinecap="round"
              className="h-6 w-6"
              aria-hidden="true"
            >
              <path d="M6 6 18 18M18 6 6 18" />
            </svg>
          </button>
        </div>
      )}
    </section>
  );
}
