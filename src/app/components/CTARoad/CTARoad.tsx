"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// One road, drawn right-to-left (reading direction): it starts where damage
// is detected, passes the repair and the proof — the platform's three
// statuses — and stops just short of the demo button, which sits ahead of it
// as the destination of the whole page.
const ROAD_PATH =
  "M 1180 180 C 1010 180 970 96 810 96 C 650 96 640 180 470 180 C 400 180 340 180 280 180";

export default function CTARoad() {
  const sectionRef = useRef<HTMLElement>(null);
  // Fires the arrow "launch" swap and the pill's bounce on click, then clears
  // so the next click can replay it.
  const [launching, setLaunching] = useState(false);

  const handleLaunch = () => {
    setLaunching(true);
    window.setTimeout(() => setLaunching(false), 500);
  };

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

      // 1. The asphalt draws in first, right→left, smoothly.
      tl.from(
        ".road-surface",
        { strokeDashoffset: 1, duration: 1.4, ease: "power1.inOut" },
        0.3,
      );

      // 2. The lane lines are then wiped in along the road from the right
      //    (start) to the end. The reveal rect stays anchored at the right
      //    edge (width tracks its left edge) so the dashes appear in order;
      //    the CSS dash-march keeps running underneath the whole time.
      const revealStart = 1.7;
      const revealDur = 1.5;
      tl.fromTo(
        ".road-reveal-rect",
        { attr: { x: 1200, width: 0 } },
        { attr: { x: 240, width: 960 }, duration: revealDur, ease: "none" },
        revealStart,
      );

      // Each status stop pops exactly as the wipe reaches its spot on the road.
      const markerAt = (x: number) =>
        revealStart + ((1200 - x) / 960) * revealDur;
      const popMarker = (id: string, x: number) =>
        tl.from(
          id,
          {
            scale: 0,
            transformOrigin: "50% 50%",
            duration: 0.45,
            ease: "back.out(2.5)",
          },
          markerAt(x),
        );
      popMarker("#road-marker-detect", 1120);
      popMarker("#road-marker-repair", 810);
      popMarker("#road-marker-proof", 470);

      // 3. Once the road is fully laid, the demo button arrives at the end.
      tl.from(
        ".road-cta",
        { opacity: 0, scale: 0.85, duration: 0.6, ease: "back.out(1.8)" },
        revealStart + revealDur,
      );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="cta-road"
      className="relative z-10 -mb-8 w-full overflow-hidden rounded-b-brand bg-background py-28"
    >
      <div className="px-32">
        <div className="cta-road-copy text-center">
          <h2 className="font-heading text-heading text-text">
            الطريق إلى شوارع أفضل{" "}
            <span className="text-primary">يبدأ من هنا</span>
          </h2>
          <p className="mt-6 font-sans text-t1 leading-relaxed text-subtext">
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
            {/* The lane dashes are revealed through this rect: GSAP wipes it
                open from the right edge leftward. Default full-open so
                reduced-motion (which skips the tween) shows the lines. */}
            <defs>
              <clipPath id="road-reveal" clipPathUnits="userSpaceOnUse">
                <rect className="road-reveal-rect" x={0} y={0} width={1200} height={260} />
              </clipPath>
            </defs>

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
            {/* Lane dashes — march toward the button (see globals.css), wiped
                in along the road via the reveal clip. */}
            <path
              d={ROAD_PATH}
              strokeDasharray="14 22"
              className="road-centerline road-dash stroke-text-dark"
              strokeWidth={3}
              clipPath="url(#road-reveal)"
            />

            {/* رصد — where the damage is detected */}
            <g id="road-marker-detect" className="road-marker">
              <circle cx={1120} cy={180} r={18} className="fill-negative/25" />
              <circle cx={1120} cy={180} r={8} className="fill-negative" />
              <text
                x={1120}
                y={232}
                textAnchor="middle"
                className="fill-subtext font-sans text-t4 font-bold"
              >
                رصد الأضرار
              </text>
            </g>

            {/* الإصلاح — the crest of the road */}
            <g id="road-marker-repair" className="road-marker">
              <circle cx={810} cy={96} r={18} className="fill-notice/25" />
              <circle cx={810} cy={96} r={8} className="fill-notice" />
              <text
                x={810}
                y={56}
                textAnchor="middle"
                className="fill-subtext font-sans text-t4 font-bold"
              >
                الإصلاح
              </text>
            </g>

            {/* إثبات الإصلاح — the last stop before the destination */}
            <g id="road-marker-proof" className="road-marker">
              <circle cx={470} cy={180} r={18} className="fill-success/25" />
              <circle cx={470} cy={180} r={8} className="fill-success" />
              <text
                x={470}
                y={232}
                textAnchor="middle"
                className="fill-subtext font-sans text-t4 font-bold"
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
                onClick={handleLaunch}
                className={`inline-flex items-center gap-2.75 whitespace-nowrap rounded-full bg-dark px-7.5 py-3.75 font-sans text-t3 font-extrabold text-text-dark shadow-[0_16px_32px_-16px_rgba(14,19,18,0.6)] transition-transform duration-300 hover:scale-105 ${
                  launching ? "cta-bounce" : ""
                }`}
              >
                {/* On click the navigation arrow launches: the resting arrow
                    lifts away up-right while a fresh one flies in from below.
                    The transition is only armed while launching, so the reset
                    to rest snaps instantly instead of the arrow drifting back
                    down from the top. */}
                <span className="relative block h-5 w-4.5 overflow-hidden">
                  <svg
                    width="18"
                    height="20"
                    viewBox="0 0 19 21"
                    fill="none"
                    className={`absolute inset-0 ${
                      launching
                        ? "-translate-y-6 translate-x-2 opacity-0 transition-all duration-300 ease-out"
                        : "translate-x-0 translate-y-0 opacity-100"
                    }`}
                    aria-hidden="true"
                  >
                    <path
                      d="M11.0001 0.496532L0.142295 19.122C-0.379772 20.0175 0.637915 21.0181 1.52446 20.4808L9.46083 15.6717C9.81279 15.4584 10.2595 15.4825 10.5864 15.7325L16.9929 20.6301C17.7649 21.2203 18.84 20.4739 18.5569 19.5443L12.8206 0.708826C12.5664 -0.126008 11.4396 -0.257404 11.0001 0.496532Z"
                      className="fill-primary"
                    />
                  </svg>
                  <svg
                    width="18"
                    height="20"
                    viewBox="0 0 19 21"
                    fill="none"
                    className={`absolute inset-0 ${
                      launching
                        ? "translate-x-0 translate-y-0 opacity-100 transition-all duration-300 ease-out"
                        : "-translate-x-2 translate-y-6 opacity-0"
                    }`}
                    aria-hidden="true"
                  >
                    <path
                      d="M11.0001 0.496532L0.142295 19.122C-0.379772 20.0175 0.637915 21.0181 1.52446 20.4808L9.46083 15.6717C9.81279 15.4584 10.2595 15.4825 10.5864 15.7325L16.9929 20.6301C17.7649 21.2203 18.84 20.4739 18.5569 19.5443L12.8206 0.708826C12.5664 -0.126008 11.4396 -0.257404 11.0001 0.496532Z"
                      className="fill-primary"
                    />
                  </svg>
                </span>
                احجز عرضاً
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
