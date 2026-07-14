"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import WorkflowIntro from "./WorkflowIntro";
import WorkflowCard from "./WorkflowCard";

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

// The three workflow steps, each with its own media (numbered in order).
const STEPS = [
  {
    heading: "رصد الأضرار تلقائيًا",
    paragraph:
      "كاميرا واحدة على الطريق تكفي؛ يرصد مسار الحفر والتشققات لحظة مرور المركبة، ويحوّل كل ضرر إلى سجل دقيق مربوط بموقعه على الخريطة دون أي إدخال يدوي.",
    media: "/assets/Workflow/Workflow%201.mp4",
    reverse: false,
  },
  {
    heading: "تصنيف درجة الخطورة",
    paragraph:
      "يقيس النظام حجم الضرر وعمقه وموضعه على المسار، ثم يمنحه درجة خطورة واضحة، فتُرتَّب البلاغات حسب الأولوية بدل أن تتكدّس بلا معيار.",
    media: "/assets/Workflow/Workflow%202.png",
    reverse: true,
  },
  {
    heading: "خطة إصلاح قابلة للمتابعة",
    paragraph:
      "تتحوّل البلاغات إلى خطة إصلاح منظّمة يمكن متابعتها خطوة بخطوة، مع تتبّع مباشر لحالة كل موقع من الرصد وحتى إغلاق الطلب.",
    media: "/assets/Workflow/Workflow%203.mp4",
    reverse: false,
  },
];

// The route the marker travels, authored in the section's fixed 1320×2760
// coordinate space. It is intentionally angular (straight `L` segments, no
// curves) with sharp ups and downs, like a GPS track. It starts at the top
// right, angles into the middle to thread down between the two intro images,
// then hugs each step image's OUTER edge — entering left images from the left
// (x≈80) and right images from the right (x≈1240) — so the marker passes
// behind each image from the side instead of dropping through its top. The
// angles are kept gentle — long, calm diagonals with only the occasional soft
// up-jag, echoing the smooth sweep between the bottom two images.
const ROUTE =
  "M1150,30 L940,150 L720,270 L760,470 L690,660 L720,840 " +
  "L420,990 L80,1140 L80,1320 " +
  "L360,1420 L460,1360 L840,1520 L1240,1660 L1240,1940 " +
  "L980,2020 L900,1960 L540,2140 L80,2280 L80,2560 " +
  "L80,2700";

// Live GPS-style metrics that ride beside the marker. As the scroll progress
// runs 0→1 the coordinates interpolate between these endpoints, so the numbers
// tick over while the marker travels down the track.
const LAT_START = 54.3056;
const LAT_END = 54.1341;
const LNG_START = 7.7206;
const LNG_END = 8.1169;

export default function Workflow() {
  const sectionRef = useRef<HTMLElement>(null);
  const routeRef = useRef<SVGPathElement>(null);
  const trailRef = useRef<SVGPathElement>(null);
  const markerRef = useRef<SVGGElement>(null);
  const labelRef = useRef<SVGGElement>(null);
  const latRef = useRef<SVGTextElement>(null);
  const lngRef = useRef<SVGTextElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const trail = trailRef.current;
    const marker = markerRef.current;
    const label = labelRef.current;
    if (!section || !trail || !marker || !label) return;

    const ctx = gsap.context(() => {
      // Measure the real path length so the reveal is expressed in the same
      // user units GSAP animates — no reliance on `pathLength`. One dash as
      // long as the whole path, offset by that length = hidden; animating the
      // offset to 0 grows the solid line from the start.
      const len = trail.getTotalLength();
      gsap.set(trail, { strokeDasharray: len, strokeDashoffset: len });

      // A PRIVATE copy of the route for positioning the coordinate label. It is
      // parsed straight from the route string (not from the <path> element) on
      // purpose: the marker's motionPath `align` transforms the element's cached
      // rawPath IN PLACE, so a second align-based follower reading that same
      // element would resolve against corrupted coordinates and drift onto — and
      // past — the marker. Reading a fresh copy keeps the label independent, and
      // driving it off the marker's own progress (below) locks the two together.
      const labelPath = MotionPathPlugin.getRawPath(ROUTE);
      const placeLabel = (p: number) => {
        const pt = MotionPathPlugin.getPositionOnPath(labelPath, p);
        gsap.set(label, { x: pt.x, y: pt.y });
      };
      placeLabel(0); // seat it on the route's start point right away

      // Fade in the route, the travelling marker and its coordinate label as the
      // section arrives — the pathway, arrow and numbers ease up from transparent
      // instead of being there from the first frame. They also start out hidden
      // in the markup (opacity-0 class) so there is no pre-JS flash of the groups
      // stacked at the SVG's origin (0,0) before GSAP positions them on refresh.
      // (Only these; the rest of the section is left untouched.)
      gsap.set([routeRef.current, trail, marker, label], { opacity: 0 });
      ScrollTrigger.create({
        trigger: section,
        start: "top 80%",
        once: true,
        onEnter: () => {
          gsap.to([routeRef.current, trail, marker, label], {
            opacity: 1,
            duration: 1,
            ease: "power2.out",
          });
        },
      });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top center", // begins once the route's start reaches mid-screen
          end: "bottom center",
          scrub: 1, // marker + trail tied to scroll position
        },
      });

      // Draw the coloured trail in as we scroll: the portion behind the marker
      // turns solid primary over the faint primary track ahead of it.
      tl.to(trail, { strokeDashoffset: 0, ease: "none" }, 0);

      // Move the marker along the path, rotating to face the direction of
      // travel. align/alignOrigin snap the marker's centre onto the path.
      // immediateRender puts it on the path's start point right away — without
      // it the marker sits at its authored origin (the SVG's top-left corner)
      // until the scroll scrubs the timeline, then jumps onto the path.
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

      // The coordinate label is NOT given its own motionPath tween — a second
      // `align` follower on the same path fights the marker over the shared,
      // mutated rawPath and drifts. Instead it rides a proxy value tweened inside
      // THIS timeline, so it shares the marker's exact scrubbed clock. Reading the
      // raw scroll progress instead would run the label ahead of the smoothed
      // marker (scrub lag) and let it overtake and overlap the arrow. `readout.p`
      // is the same length-normalised progress the marker's motionPath uses, so
      // the label stays glued beside the arrow and neither overtakes the other.
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
            if (latRef.current)
              latRef.current.textContent = `${lat.toFixed(4)}°N`;
            if (lngRef.current)
              lngRef.current.textContent = `${lng.toFixed(4)}°W`;
          },
        },
        0,
      );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="workflow"
      className="relative w-full overflow-hidden bg-dark py-10"
    >
      <div className="relative mx-auto h-690 w-330">
        {/* Arrow route overlay, sized 1:1 with the content coordinate space */}
        <svg
          className="pointer-events-none absolute inset-0 z-0 h-690 w-330"
          viewBox="0 0 1320 2760"
          fill="none"
          aria-hidden="true"
        >
          {/* Uncompleted track: the full route in primary at low opacity */}
          <path
            ref={routeRef}
            className="opacity-0"
            d={ROUTE}
            stroke="var(--color-primary)"
            strokeOpacity="0.28"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />

          {/* Completed trail that draws in on scroll. Hidden initially via a
              large dash/offset until the effect measures the exact length. */}
          <path
            ref={trailRef}
            d={ROUTE}
            stroke="var(--color-primary)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            strokeDasharray={9999}
            strokeDashoffset={9999}
          />

          {/* Start dot and end target ring */}
          <circle cx="1150" cy="30" r="5" fill="rgba(242,240,232,0.35)" />
          <circle
            cx="80"
            cy="2700"
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

          {/* Live coordinates: ride the same path point, stay upright, and sit
              clearly beside (not on) the marker. Text is updated on scroll.
              `direction:ltr` is essential — the page is RTL, so without it
              `text-anchor:start` would anchor these numbers on their RIGHT edge
              and grow them leftward back over the marker. */}
          <g ref={labelRef} className="opacity-0 [direction:ltr]">
            <text
              ref={latRef}
              x="38"
              y="-5"
              textAnchor="start"
              fontSize={18}
              fontWeight={700}
              letterSpacing={1}
              fill="#b1b4b1"
            >
              54.3056°N
            </text>
            <text
              ref={lngRef}
              x="38"
              y="17"
              textAnchor="start"
              fontSize={18}
              fontWeight={700}
              letterSpacing={1}
              fill="#b1b4b1"
            >
              7.7206°W
            </text>
          </g>
        </svg>

        {/* Intro images + the three workflow steps. dir=ltr keeps `flex-row`
            left-to-right so image/text sides match the fixed path geometry
            above (the page is RTL); each text block re-declares dir=rtl. */}
        <div
          dir="ltr"
          className="relative z-10 flex flex-col gap-60 pt-25 pb-35"
        >
          <WorkflowIntro />

          {STEPS.map((step) => (
            <WorkflowCard
              key={step.heading}
              heading={step.heading}
              paragraph={step.paragraph}
              media={step.media}
              reverse={step.reverse}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
