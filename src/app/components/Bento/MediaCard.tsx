import type { ReactNode } from "react";

type MediaCardProps = {
  /** The image, video, or device mockup positioned inside the tile. */
  children: ReactNode;
  /** Surface colour: a plain white card, or a solid brand-primary box. */
  variant?: "plain" | "primary";
  className?: string;
};

/**
 * A plain media tile: a rounded, softly-shadowed surface that holds an image,
 * video, or floating device mockup. No overlays or gradients — the media speaks
 * for itself. Use `variant="primary"` to float a device on a brand-blue box.
 */
export default function MediaCard({
  children,
  variant = "plain",
  className = "",
}: MediaCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-brand shadow-[0_8px_30px_-16px_rgba(14,19,18,0.25)] ${
        variant === "primary" ? "bg-primary" : "bg-white"
      } ${className}`}
    >
      {children}
    </div>
  );
}
