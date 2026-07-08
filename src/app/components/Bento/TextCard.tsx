"use client";

import { useEffect, useRef, type ReactNode } from "react";

type TextCardProps = {
  title: string;
  /** Copy that slides up from the bottom on hover. */
  description: string;
  icon: ReactNode;
  /** Primary-filled variant (تعدد الأجهزة). */
  primary?: boolean;
  className?: string;
};

/**
 * A text tile. The title sits at the top-right (one word per line) and the icon
 * rests in the bottom-right corner. On hover a short description slides up from
 * the bottom, dragging the icon up above it. A soft gradient circle glides after
 * the cursor inside the box, starting from a random spot and doubling in size
 * while hovered. It eases toward the pointer each frame (a lerp) rather than
 * snapping, so the motion reads as sliding.
 */
export default function TextCard({
  title,
  description,
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

    // Rest the glow at a random spot inside the tile before any interaction
    // (kept away from the very edges so it stays visible).
    const rect = card.getBoundingClientRect();
    const rand = (size: number) => size * (0.15 + Math.random() * 0.7);
    target.current = { x: rand(rect.width), y: rand(rect.height) };
    current.current = { ...target.current };

    let frame = 0;
    const tick = () => {
      // Ease current toward target — high factor keeps the circle right under
      // the cursor while still smoothing out the motion a touch.
      current.current.x += (target.current.x - current.current.x) * 0.35;
      current.current.y += (target.current.y - current.current.y) * 0.35;
      glow.style.transform = `translate(${current.current.x}px, ${current.current.y}px)`;
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
      {/* Cursor-trailing glow: outer node is positioned via JS; the inner blob
          is centred on that point and doubles in size while hovering. */}
      <div
        ref={glowRef}
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0"
      >
        <div
          className={`aspect-square h-56 -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl transition-transform duration-500 ease-out group-hover:scale-[2] ${
            primary ? "bg-white/80" : "bg-primary/70"
          }`}
        />
      </div>

      {/* Title — top-right, one word per line, Almarai */}
      <h3
        className={`relative z-10 self-start text-right font-sans text-h2 font-bold leading-tight ${
          primary ? "text-on-primary" : "text-text"
        }`}
      >
        {title.split(" ").map((word) => (
          <span key={word} className="block">
            {word}
          </span>
        ))}
      </h3>

      {/* Bottom group — icon rests in the corner; the description expands below
          it on hover, pushing the icon up above the revealed text. */}
      <div
        className={`relative z-10 flex flex-col items-start gap-4 text-right ${
          primary ? "text-on-primary" : "text-primary"
        }`}
      >
        <div>{icon}</div>

        <div className="grid grid-rows-[0fr] opacity-0 transition-all duration-500 ease-out group-hover:grid-rows-[1fr] group-hover:opacity-100">
          <p
            className={`overflow-hidden font-sans text-t4 leading-6 ${
              primary ? "text-on-primary/90" : "text-subtext"
            }`}
          >
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}
