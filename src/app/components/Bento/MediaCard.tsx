import type { ReactNode } from "react";

type MediaCardProps = {
  title: string;
  icon: ReactNode;
  /** The image or video element, positioned to fill the tile. */
  children: ReactNode;
  className?: string;
};

/**
 * A media tile (image / video). The media is always shown; the title and icon
 * fade in over a bottom gradient only while the cursor hovers the tile.
 */
export default function MediaCard({
  title,
  icon,
  children,
  className = "",
}: MediaCardProps) {
  return (
    <div
      className={`group relative overflow-hidden rounded-brand shadow-[0_8px_30px_-16px_rgba(14,19,18,0.25)] ${className}`}
    >
      {children}

      {/* Hover-only overlay: a soft dark gradient carrying the title + icon */}
      <div className="pointer-events-none absolute inset-0 flex items-end p-8 opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100">
        <div className="absolute inset-0 bg-linear-to-t from-dark/75 via-dark/20 to-transparent" />
        <div className="relative z-10 flex items-center gap-3 text-text-dark">
          {icon}
          <h3 className="font-heading text-h3 leading-tight">{title}</h3>
        </div>
      </div>
    </div>
  );
}
