"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type WorkflowCardProps = {
  heading: string;
  paragraph: string;
  /** Media source; a `.mp4` renders as a looping video, otherwise an image. */
  media: string;
  /** When true the media sits on the right and the text on the left. */
  reverse?: boolean;
};

/**
 * A single workflow step: a fixed-size media beside a heading + paragraph.
 * Sizes are fixed on purpose so the overlaid arrow path (see Workflow.tsx)
 * lines up with each media. Desktop-only per the design rules.
 *
 * Both the media and the text drift vertically on scroll (parallax): scrolling
 * down pulls them up, scrolling up pushes them down — the media moves further
 * than the text so it reads as the deeper, faster layer.
 */
export default function WorkflowCard({
  heading,
  paragraph,
  media,
  reverse,
}: WorkflowCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const isVideo = media.endsWith(".mp4");

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const ctx = gsap.context(() => {
      const trigger = {
        trigger: card,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      };

      // Media is the stronger (deeper) parallax layer.
      gsap.fromTo(
        mediaRef.current,
        { y: 90 },
        { y: -90, ease: "none", scrollTrigger: trigger }
      );

      // Text drifts less so the media clearly leads it.
      gsap.fromTo(
        textRef.current,
        { y: 36 },
        { y: -36, ease: "none", scrollTrigger: trigger }
      );
    }, card);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={cardRef}
      className={`flex h-100 items-center justify-between ${
        reverse ? "flex-row-reverse" : "flex-row"
      }`}
    >
      <div ref={mediaRef} className="shrink-0">
        {isVideo ? (
          <video
            src={media}
            autoPlay
            loop
            muted
            playsInline
            aria-hidden="true"
            className="h-100 w-160 rounded-2xl object-cover shadow-[0_16px_40px_rgba(14,19,18,0.45)]"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={media}
            alt=""
            aria-hidden="true"
            className="h-100 w-160 rounded-2xl object-cover shadow-[0_16px_40px_rgba(14,19,18,0.45)]"
          />
        )}
      </div>

      <div
        ref={textRef}
        className="flex w-120 flex-col gap-6 text-right"
        dir="rtl"
      >
        <h3 className="font-heading text-h1 text-text-dark">{heading}</h3>
        <p className="text-t1 leading-10 text-subtext-dark">{paragraph}</p>
      </div>
    </div>
  );
}
