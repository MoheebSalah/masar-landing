// Fluent-style line icons, hand-drawn as inline SVG so no icon package is needed.
// All share a 24×24 viewBox and inherit colour + size from the parent.

type IconProps = { className?: string };

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

// تقييم المستخدمين — award rosette (reviews badge)
export function BadgeIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <circle cx="12" cy="9" r="5.5" />
      <path d="m12 6.4 1 2 2.2.3-1.6 1.5.4 2.2-2-1-2 1 .4-2.2L8.8 8.7l2.2-.3 1-2Z" />
      <path d="M8.4 13.4 6.5 20l3.4-1.4L12 21l2.1-2.4L17.5 20l-1.9-6.6" />
    </svg>
  );
}

// ابدأ الآن — diagonal call-to-action arrow (points to the RTL "forward" corner)
export function ArrowIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M16 8 8 16" />
      <path d="M8 9v7h7" />
    </svg>
  );
}
