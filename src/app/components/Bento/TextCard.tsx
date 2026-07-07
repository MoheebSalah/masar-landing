"use client";

import { useEffect, useRef, type ReactNode } from "react";

type TextCardProps = {
  title: string;
  icon: ReactNode;
  /** Primary-filled variant (تعدد الأجهزة). */
  primary?: boolean;
  className?: string;
};

/**
 * A text tile whose title and icon are always visible. A soft gradient circle
 * glides after the cursor inside the box. It eases toward the pointer on every
 * frame (a lerp) rather than snapping to it, so the motion reads as sliding —
 * and when the cursor leaves, it simply rests wherever it last was, so the tile
 * is never fully flat.
 */
export default function TextCard({
  title,
  icon,
  primary = false,
  className = "",
}: TextCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const card = cardRef.current;
    const glow = glowRef.current;
    if (!card || !glow) return;

    // Rest the glow at the centre of the tile before any interaction.
    const rect = card.getBoundingClientRect();
    target.current = { x: rect.width / 2, y: rect.height / 2 };
    current.current = { ...target.current };

    let frame = 0;
    const tick = () => {
      // Ease current toward target — smaller factor = longer, softer trail.
      current.current.x += (target.current.x - current.current.x) * 0.1;
      current.current.y += (target.current.y - current.current.y) * 0.1;
      glow.style.transform = `translate(${current.current.x}px, ${current.current.y}px) translate(-50%, -50%)`;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
  }, []);

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    target.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMove}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-brand p-8 shadow-[0_8px_30px_-16px_rgba(14,19,18,0.25)] ${
        primary ? "bg-primary" : "bg-white"
      } ${className}`}
    >
      {/* Cursor-trailing glow, clipped to the card and always present */}
      <div
        ref={glowRef}
        aria-hidden="true"
        className={`pointer-events-none absolute left-0 top-0 aspect-square h-56 rounded-full blur-2xl ${
          primary ? "bg-white/80" : "bg-primary/70"
        }`}
      />

      <div
        className={`relative z-10 ${
          primary ? "text-on-primary" : "text-primary"
        }`}
      >
        {icon}
      </div>

      <h3
        className={`relative z-10 font-heading text-h3 leading-tight ${
          primary ? "text-on-primary" : "text-text"
        }`}
      >
        {title}
      </h3>
    </div>
  );
}
