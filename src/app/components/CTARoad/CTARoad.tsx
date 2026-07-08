"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// One road, drawn right-to-left (reading direction): it starts where damage
// is detected, passes the repair and the proof — the platform's three
// statuses — and ends at the demo button, the destination of the whole page.
const ROAD_PATH =
  "M 1180 180 C 1010 180 970 96 810 96 C 650 96 640 180 470 180 C 360 180 300 180 170 180";

export default function CTARoad() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    // Reduced motion: markup already sits in its final state; skipping the
    // tweens (and the CSS dash march, see globals.css) is all that's needed.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: section, start: "top 70%", once: true },
        defaults: { ease: "power2.out" },
      });
      tl.from(".cta-road-copy", { y: 40, opacity: 0, duration: 0.8 }, 0);
      // The asphalt draws in first; each status stop pops as the road
      // reaches it, then the lane dashes and the button arrive at the end.
      tl.from(
        ".road-surface",
        { strokeDashoffset: 1, duration: 1.6, ease: "power2.inOut" },
        0.2,
      );
      tl.from(
        ".road-marker",
        {
          scale: 0,
          transformOrigin: "50% 50%",
          duration: 0.5,
          ease: "back.out(2.5)",
          stagger: 0.4,
        },
        0.65,
      );
      tl.from(".road-centerline", { opacity: 0, duration: 0.6 }, 1.7);
      tl.from(
        ".road-cta",
        { opacity: 0, scale: 0.85, duration: 0.6, ease: "back.out(1.8)" },
        1.9,
      );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="cta-road"
      className="relative w-full overflow-hidden bg-dark py-28"
    >
      <div className="px-32">
        <div className="cta-road-copy text-center">
          <h2 className="font-heading text-heading text-text-dark">
            الطريق إلى شوارع أفضل{" "}
            <span className="text-primary">يبدأ من هنا</span>
          </h2>
          <p className="mt-6 font-sans text-t1 leading-relaxed text-subtext-dark">
            عرض حيّ قصير نطبّقه على واقع مدينتكم — من رصد الأضرار حتى إثبات
            الإصلاح.
          </p>
        </div>

        {/* The signature: a road from detection to the booking button */}
        <div className="relative mt-8">
          <svg
            viewBox="0 0 1200 260"
            className="w-full"
            fill="none"
            aria-hidden="true"
          >
            {/* Asphalt — GSAP draws it in via dashoffset (pathLength=1) */}
            <path
              d={ROAD_PATH}
              pathLength={1}
              strokeDasharray="1"
              strokeDashoffset="0"
              className="road-surface stroke-text"
              strokeWidth={34}
              strokeLinecap="round"
            />
            {/* Lane dashes — march toward the button (see globals.css) */}
            <path
              d={ROAD_PATH}
              strokeDasharray="14 22"
              className="road-centerline road-dash stroke-text-dark"
              strokeWidth={3}
            />

            {/* رصد — where the damage is detected */}
            <g className="road-marker">
              <circle cx={1120} cy={180} r={18} className="fill-negative/25" />
              <circle cx={1120} cy={180} r={8} className="fill-negative" />
              <text
                x={1120}
                y={232}
                textAnchor="middle"
                className="fill-subtext-dark font-sans text-t4 font-bold"
              >
                رصد الأضرار
              </text>
            </g>

            {/* الإصلاح — the crest of the road */}
            <g className="road-marker">
              <circle cx={810} cy={96} r={18} className="fill-notice/25" />
              <circle cx={810} cy={96} r={8} className="fill-notice" />
              <text
                x={810}
                y={56}
                textAnchor="middle"
                className="fill-subtext-dark font-sans text-t4 font-bold"
              >
                الإصلاح
              </text>
            </g>

            {/* إثبات الإصلاح — the last stop before the destination */}
            <g className="road-marker">
              <circle cx={470} cy={180} r={18} className="fill-success/25" />
              <circle cx={470} cy={180} r={8} className="fill-success" />
              <text
                x={470}
                y={232}
                textAnchor="middle"
                className="fill-subtext-dark font-sans text-t4 font-bold"
              >
                إثبات الإصلاح
              </text>
            </g>
          </svg>

          {/* The destination — the road runs straight into the button.
              GSAP animates the transition-free wrapper; the anchor keeps the
              CSS hover transitions (mixing both on one element lets the
              hover transition hijack the entrance tween). */}
          <div className="absolute left-[14.17%] top-[69.2%] -translate-x-1/2 -translate-y-1/2">
            <div className="road-cta">
              <a
                href="#contact"
                className="inline-block whitespace-nowrap rounded-brand bg-primary px-12 py-5 font-sans text-t2 font-bold text-on-primary shadow-[0_16px_32px_-16px_rgba(52,168,216,0.6)] transition-all duration-300 hover:scale-105 hover:bg-primary-600"
              >
                احجز عرضاً
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
