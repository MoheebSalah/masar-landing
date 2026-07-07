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

// خريطة حية للتقارير — folded map
export function MapIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z" />
      <path d="M9 4v14M15 6v14" />
    </svg>
  );
}

// تحديد الموقع والخطورة — location pin
export function LocationIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M12 21c4.5-4.5 7-8 7-11a7 7 0 1 0-14 0c0 3 2.5 6.5 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

// المواطن يتلقى إشعاراً — notification bell
export function BellIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M6 9a6 6 0 1 1 12 0c0 4 1.5 5 2 6H4c.5-1 2-2 2-6Z" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </svg>
  );
}

// تعدد الأجهزة — monitor + phone
export function DevicesIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <rect x="2.5" y="4.5" width="12" height="8.5" rx="1.5" />
      <path d="M6.5 16.5h5M8.5 13v3.5" />
      <rect x="16" y="8" width="5.5" height="11" rx="1.5" />
    </svg>
  );
}

// كشف وتصنيف تلقائي — scan brackets with a sweep line
export function ScanIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M4 8V6a2 2 0 0 1 2-2h2M20 8V6a2 2 0 0 0-2-2h-2M4 16v2a2 2 0 0 0 2 2h2M20 16v2a2 2 0 0 1-2 2h-2" />
      <path d="M4 12h16" />
    </svg>
  );
}
