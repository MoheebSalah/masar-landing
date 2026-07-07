"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import WorkflowCard from "./WorkflowCard";

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

const CARD_IMAGE = "/assets/Workflow/Screenshot 2026-07-07 103301.png";

// The three workflow steps. Same image for all three for now (per brief).
const STEPS = [
  {
    heading: "رصد الأضرار تلقائيًا",
    paragraph:
      "كاميرا واحدة على الطريق تكفي؛ يرصد مسار الحفر والتشققات لحظة مرور المركبة، ويحوّل كل ضرر إلى سجل دقيق مربوط بموقعه على الخريطة دون أي إدخال يدوي.",
    reverse: false,
  },
  {
    heading: "تصنيف درجة الخطورة",
    paragraph:
      "يقيس النظام حجم الضرر وعمقه وموضعه على المسار، ثم يمنحه درجة خطورة واضحة، فتُرتَّب البلاغات حسب الأولوية بدل أن تتكدّس بلا معيار.",
    reverse: true,
  },
  {
    heading: "خطة إصلاح قابلة للمتابعة",
    paragraph:
      "تتحوّل البلاغات إلى خطة إصلاح منظّمة يمكن متابعتها خطوة بخطوة، مع تتبّع مباشر لحالة كل موقع من الرصد وحتى إغلاق الطلب.",
    reverse: false,
  },
];

// The route the arrow travels. Authored in the section's fixed 1200×1920
// coordinate space so it threads through each image's centre:
// start top-right → image 1 (320,300) → image 2 (880,940) → image 3 (320,1580).
const ROUTE =
  "M1030,24 C820,140 520,150 320,300 C180,520 560,760 880,940 C1180,1140 620,1380 320,1580 C240,1680 320,1780 320,1860";

export default function Workflow() {
  const sectionRef = useRef<HTMLElement>(null);
  const trailRef = useRef<SVGPathElement>(null);
  const markerRef = useRef<SVGGElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const trail = trailRef.current;
    const marker = markerRef.current;
    if (!section || !trail || !marker) return;

    const ctx = gsap.context(() => {
      // Measure the real path length so the reveal is expressed in the same
      // user units GSAP animates — no reliance on `pathLength` being applied
      // before GSAP reads it (that race made the line snap to fully solid).
      // One dash as long as the whole path, offset by that length = hidden;
      // animating the offset to 0 grows the solid line from the start.
      const len = trail.getTotalLength();
      gsap.set(trail, { strokeDasharray: len, strokeDashoffset: len });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top center", // begins once the route's start reaches mid-screen
          end: "bottom center",
          scrub: 1, // arrow + trail tied to scroll position
        },
      });

      // Draw the coloured trail in as we scroll: the portion behind the arrow
      // turns solid primary while the dotted track ahead stays visible.
      tl.to(trail, { strokeDashoffset: 0, ease: "none" }, 0);

      // Move the marker along that same path, rotating to face the direction
      // of travel. align/alignOrigin snap the marker's centre onto the path.
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
      <div className="relative mx-auto h-480 w-300">
        {/* Arrow route overlay, sized 1:1 with the content coordinate space */}
        <svg
          className="pointer-events-none absolute inset-0 z-0 h-480 w-300"
          viewBox="0 0 1200 1920"
          fill="none"
          aria-hidden="true"
        >
          {/* Faint background guide strokes for depth */}
          <g stroke="rgba(242,240,232,0.05)" strokeWidth="2" fill="none">
            <path d="M0,220 C300,180 520,320 1200,240" />
            <path d="M0,1120 C420,1180 760,1000 1200,1120" />
          </g>

          {/* Dotted static track showing the full route */}
          <path
            d={ROUTE}
            stroke="rgba(242,240,232,0.16)"
            strokeWidth="2.5"
            strokeDasharray="1 10"
            strokeLinecap="round"
            fill="none"
          />

          {/* Coloured trail that draws in on scroll. Hidden initially via a
              large dash/offset until the effect measures the exact length. */}
          <path
            ref={trailRef}
            d={ROUTE}
            stroke="var(--color-primary)"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
            strokeDasharray={9999}
            strokeDashoffset={9999}
          />

          {/* Start dot and end target ring */}
          <circle cx="1030" cy="24" r="5" fill="rgba(242,240,232,0.35)" />
          <circle
            cx="320"
            cy="1860"
            r="7"
            fill="var(--color-dark)"
            stroke="#f2f0e8"
            strokeWidth="2.5"
          />

          {/* Travelling marker: pulsing ring + blue disc + arrow (points +x) */}
          <g ref={markerRef}>
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
            <path
              d="M8,0 L-6,-6 L-2,0 L-6,6 Z"
              fill="var(--color-dark)"
            />
          </g>
        </svg>

        {/* The three workflow steps. dir=ltr keeps `flex-row` left-to-right so
            image/text sides match the fixed path geometry above (the page is
            RTL); each text block re-declares dir=rtl for its Arabic copy. */}
        <div
          dir="ltr"
          className="relative z-10 flex flex-col gap-60 pt-25 pb-35"
        >
          {STEPS.map((step) => (
            <WorkflowCard
              key={step.heading}
              heading={step.heading}
              paragraph={step.paragraph}
              image={CARD_IMAGE}
              reverse={step.reverse}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
