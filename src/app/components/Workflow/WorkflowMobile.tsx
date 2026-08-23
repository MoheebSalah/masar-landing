"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { blurReveal } from "./blurReveal";
import { useInViewVideo } from "../useInViewVideo";

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

const STEPS = [
  {
    heading: "رصد الأضرار تلقائيًا",
    paragraph:
      "كاميرا واحدة على الطريق تكفي؛ يرصد مسار الحفر والتشققات لحظة مرور المركبة، ويحوّل كل ضرر إلى سجل دقيق مربوط بموقعه على الخريطة دون أي إدخال يدوي.",
    media: "/assets/Workflow/Workflow%201.v2.mobile.mp4",
  },
  {
    heading: "تصنيف درجة الخطورة",
    paragraph:
      "يقيس النظام حجم الضرر وعمقه وموضعه على المسار، ثم يمنحه درجة خطورة واضحة، فتُرتَّب البلاغات حسب الأولوية بدل أن تتكدّس بلا معيار.",
    media: "/assets/Workflow/Workflow%202.v2.webp",
  },
  {
    heading: "خطة إصلاح قابلة للمتابعة",
    paragraph:
      "تتحوّل البلاغات إلى خطة إصلاح منظّمة يمكن متابعتها خطوة بخطوة، مع تتبّع مباشر لحالة كل موقع من الرصد وحتى إغلاق الطلب.",
    media: "/assets/Workflow/Workflow%203.v2.webp",
  },
];

// The route the marker travels, as fractions of the measured content box. A
// GPS-style track (straight `L` segments) that threads down behind the stacked
// layout. Rather than a metronomic left↔right zigzag it's deliberately uneven —
// like the desktop route — with irregular x offsets, varying vertical gaps and
// the odd soft jag, so it reads as a real path rather than a repeating pattern.
// x is kept within [0.2, 0.58] so the marker and the coordinate label beside it
// never run off either screen edge; the final point lands ~0.93 so the track
// ends *behind* the last step's image rather than in the bottom padding.
const ROUTE_POINTS: [number, number][] = [
  [0.58, 0.01],
  [0.34, 0.05],
  [0.5, 0.11],
  [0.24, 0.17],
  [0.3, 0.25],
  [0.56, 0.32],
  [0.4, 0.4],
  [0.22, 0.47],
  [0.36, 0.55],
  [0.56, 0.62],
  [0.46, 0.7],
  [0.24, 0.77],
  [0.44, 0.85],
  [0.5, 0.93],
];
const buildRoute = (w: number, h: number) =>
  "M" +
  ROUTE_POINTS.map(([fx, fy]) => `${(fx * w).toFixed(1)},${(fy * h).toFixed(1)}`).join(" L");

const LAT_START = 54.3056;
const LAT_END = 54.1341;
const LNG_START = 7.7206;
const LNG_END = 8.1169;

/** One workflow step on mobile: the copy first, its media below it. */
function MobileStep({
  heading,
  paragraph,
  media,
}: {
  heading: string;
  paragraph: string;
  media: string;
}) {
  const videoRef = useInViewVideo<HTMLVideoElement>();
  const isVideo = media.endsWith(".mp4");

  return (
    <div className="flex flex-col gap-4">
      <div data-reveal className="flex flex-col gap-3 text-right">
        <h3 className="font-heading text-h3 text-text-dark">{heading}</h3>
        <p className="text-t3 leading-8 text-subtext-dark">{paragraph}</p>
      </div>

      <div data-reveal className="w-full">
        {isVideo ? (
          <video
            ref={videoRef}
            src={media}
            loop
            muted
            playsInline
            preload="none"
            aria-hidden="true"
            className="aspect-video w-full rounded-2xl object-cover shadow-[0_16px_40px_rgba(14,19,18,0.45)]"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={media}
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            className="aspect-video w-full rounded-2xl object-cover shadow-[0_16px_40px_rgba(14,19,18,0.45)]"
          />
        )}
      </div>
    </div>
  );
}

/**
 * Mobile-only Workflow: the desktop lays the steps out on a fixed 1320×2760
 * grid the arrow path is hand-authored against, which can't reflow onto a phone.
 * Here the same arrow + trail + live coordinates ride a route generated from the
 * *measured* content box (so it scales 1:1, no marker distortion) that weaves
 * down a vertical stack — the two intro images with the title above them, then
 * the three steps as copy-over-media cards. The scroll-scrubbed blur reveal is
 * kept; the desktop's parallax is dropped so the content stays glued to the path.
 */
export default function WorkflowMobile() {
  const rootRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const routeRef = useRef<SVGPathElement>(null);
  const trailRef = useRef<SVGPathElement>(null);
  const markerRef = useRef<SVGGElement>(null);
  const labelRef = useRef<SVGGElement>(null);
  const latRef = useRef<SVGTextElement>(null);
  const lngRef = useRef<SVGTextElement>(null);
  const startRef = useRef<SVGCircleElement>(null);
  const endRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const svg = svgRef.current;
    const route = routeRef.current;
    const trail = trailRef.current;
    const marker = markerRef.current;
    const label = labelRef.current;
    if (!root || !svg || !route || !trail || !marker || !label) return;

    const mm = gsap.matchMedia();

    mm.add("(max-width: 767px)", () => {
      // Blur-in reveal for every marked element — stable triggers (no parallax
      // on mobile), so each element is its own trigger.
      // Unblur earlier than the default so the copy sharpens shortly after it
      // enters, rather than needing a long drag to become legible.
      root.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
        blurReveal(el, el, { start: "top 92%", end: "top 66%" });
      });

      // The path animation is rebuilt whenever the box is remeasured (fonts
      // settling, orientation change), since the marker's motionPath caches the
      // path at creation time.
      const created: Array<gsap.core.Timeline | ScrollTrigger> = [];

      const build = () => {
        created.forEach((c) => c.kill());
        created.length = 0;

        // The overlay SVG stretches to the root's padding box (absolute
        // inset-0 + h/w-full), so match the viewBox to that exact rendered box
        // for a clean 1:1 scale (getBoundingClientRect, not clientWidth, so a
        // scrollbar gutter never shrinks it and insets the path).
        const rect = root.getBoundingClientRect();
        const w = rect.width;
        const h = rect.height;
        const d = buildRoute(w, h);
        svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
        route.setAttribute("d", d);
        trail.setAttribute("d", d);

        const [fx0, fy0] = ROUTE_POINTS[0];
        const [fx1, fy1] = ROUTE_POINTS[ROUTE_POINTS.length - 1];
        startRef.current?.setAttribute("cx", `${fx0 * w}`);
        startRef.current?.setAttribute("cy", `${fy0 * h}`);
        endRef.current?.setAttribute("cx", `${fx1 * w}`);
        endRef.current?.setAttribute("cy", `${fy1 * h}`);

        // One dash as long as the whole path, offset to hide it; animating the
        // offset to 0 grows the solid trail from the start.
        const len = trail.getTotalLength();
        gsap.set(trail, { strokeDasharray: len, strokeDashoffset: len });

        // A private copy of the route positions the coordinate label, kept
        // independent of the marker's in-place-mutated motionPath rawPath.
        const labelPath = MotionPathPlugin.getRawPath(d);
        const placeLabel = (p: number) => {
          const pt = MotionPathPlugin.getPositionOnPath(labelPath, p);
          gsap.set(label, { x: pt.x, y: pt.y });
        };
        placeLabel(0);

        // Fade the route, marker and label up as the section arrives. The
        // marker and coordinate label settle at a low opacity so, together with
        // the faint strokes, the whole track reads as part of the background
        // instead of competing with the copy stacked over it.
        gsap.set([route, trail, marker, label], { opacity: 0 });
        const reveal = ScrollTrigger.create({
          trigger: root,
          start: "top 80%",
          once: true,
          onEnter: () => {
            gsap.to([route, trail], {
              opacity: 1,
              duration: 1,
              ease: "power2.out",
            });
            gsap.to([marker, label], {
              opacity: 0.5,
              duration: 1,
              ease: "power2.out",
            });
          },
        });
        created.push(reveal);

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: root,
            start: "top center",
            end: "bottom center",
            scrub: 1,
          },
        });
        created.push(tl);

        tl.to(trail, { strokeDashoffset: 0, ease: "none" }, 0);
        tl.to(
          marker,
          {
            motionPath: {
              path: trail,
              align: trail,
              alignOrigin: [0.5, 0.5],
              autoRotate: true,
            },
            ease: "none",
            immediateRender: true,
          },
          0,
        );

        const readout = { p: 0 };
        tl.to(
          readout,
          {
            p: 1,
            ease: "none",
            onUpdate: () => {
              const p = readout.p;
              placeLabel(p);
              const lat = LAT_START + p * (LAT_END - LAT_START);
              const lng = LNG_START + p * (LNG_END - LNG_START);
              if (latRef.current) latRef.current.textContent = `${lat.toFixed(4)}°N`;
              if (lngRef.current) lngRef.current.textContent = `${lng.toFixed(4)}°W`;
            },
          },
          0,
        );
      };

      // Measure after paint; remeasure once fonts settle (text height shifts the
      // box) and on resize.
      const raf = requestAnimationFrame(build);
      let resizeId = 0;
      const onResize = () => {
        window.clearTimeout(resizeId);
        resizeId = window.setTimeout(build, 200);
      };
      window.addEventListener("resize", onResize);
      if (document.fonts?.status !== "loaded") {
        document.fonts?.ready.then(() => build());
      }

      return () => {
        cancelAnimationFrame(raf);
        window.clearTimeout(resizeId);
        window.removeEventListener("resize", onResize);
        created.forEach((c) => c.kill());
      };
    });

    return () => mm.revert();
  }, []);

  return (
    <div ref={rootRef} dir="rtl" className="relative w-full px-5 py-10 md:hidden">
      {/* Arrow route overlay — viewBox + path are set to the measured box */}
      <svg
        ref={svgRef}
        className="pointer-events-none absolute inset-0 z-0 h-full w-full"
        viewBox="0 0 390 1700"
        fill="none"
        aria-hidden="true"
      >
        <path
          ref={routeRef}
          className="opacity-0"
          d=""
          stroke="var(--color-primary)"
          strokeOpacity="0.14"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          ref={trailRef}
          d=""
          stroke="var(--color-primary)"
          strokeOpacity="0.45"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          strokeDasharray={9999}
          strokeDashoffset={9999}
        />

        {/* Start dot and end target ring — positioned in the effect */}
        <circle ref={startRef} cx="0" cy="0" r="5" fill="rgba(242,240,232,0.35)" />
        <circle
          ref={endRef}
          cx="0"
          cy="0"
          r="7"
          fill="var(--color-dark)"
          stroke="#f2f0e8"
          strokeWidth="2.5"
        />

        {/* Travelling marker: pulsing ring + blue disc + arrow (points +x) */}
        <g ref={markerRef} className="opacity-0">
          <circle
            className="wf-ring"
            cx="0"
            cy="0"
            r="18"
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth="2"
          />
          <circle cx="0" cy="0" r="16" fill="var(--color-primary)" />
          <path d="M8,0 L-6,-6 L-2,0 L-6,6 Z" fill="var(--color-dark)" />
        </g>

        {/* Live coordinates beside the marker (direction:ltr keeps the numbers
            anchored on their left edge — see the desktop note). */}
        <g ref={labelRef} className="opacity-0 [direction:ltr]">
          <text
            ref={latRef}
            x="26"
            y="-4"
            textAnchor="start"
            fontSize={13}
            fontWeight={600}
            letterSpacing={0.5}
            fill="#8a8f8a"
          >
            54.3056°N
          </text>
          <text
            ref={lngRef}
            x="26"
            y="13"
            textAnchor="start"
            fontSize={13}
            fontWeight={600}
            letterSpacing={0.5}
            fill="#8a8f8a"
          >
            7.7206°W
          </text>
        </g>
      </svg>

      {/* Stacked content */}
      <div className="relative z-10 flex flex-col gap-28">
        {/* Title above the two intro images */}
        <h2
          data-reveal
          className="text-center font-heading text-h3 text-text-dark"
        >
          كيف تسير عملية اكتشاف الحفر ؟
        </h2>

        {/* A single intro image — full width, matching the media cards below. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          data-reveal
          src="/assets/Workflow/Workflow%200%20-%202.webp"
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          className="aspect-video w-full rounded-2xl object-cover shadow-[0_16px_40px_rgba(14,19,18,0.45)]"
        />

        {STEPS.map((step) => (
          <MobileStep key={step.heading} {...step} />
        ))}
      </div>
    </div>
  );
}
