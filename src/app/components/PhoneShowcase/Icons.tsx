// Icons used inside the rebuilt app screens (24×24 stroke icons transcribed
// from the app's design exports). Colour and size inherit from the parent so
// the dark/light screen themes repaint them via CSS variables.

type IconProps = { className?: string };

/* ---------------------------------------------------------------- brand */

// The Masar mark (the three arrows) without the badge background.
export function LogoMark({ className }: IconProps) {
  return (
    <svg viewBox="0 0 56 56" fill="currentColor" className={className} aria-hidden="true">
      <path d="M16.8376 17.9785L5.74463 37.0073C5.23955 37.8737 6.18205 38.8614 7.07116 38.3975L15.3605 34.072C15.6823 33.9041 16.0698 33.9237 16.373 34.1233L22.9866 38.4771C23.7686 38.9919 24.7659 38.2461 24.4931 37.3505L18.6581 18.1908C18.4039 17.3559 17.2771 17.2245 16.8376 17.9785Z" />
      <path d="M38.7624 17.9785L49.6202 36.6039C50.1423 37.4995 49.1246 38.5 48.2381 37.9628L40.3017 33.1536C39.9497 32.9403 39.5031 32.9644 39.1761 33.2144L32.7696 38.112C31.9976 38.7022 30.9225 37.9558 31.2056 37.0263L36.9419 18.1908C37.1961 17.3559 38.3229 17.2245 38.7624 17.9785Z" />
      <path d="M26.8471 38.0051L21.2014 20.2617C20.9429 19.4492 21.7545 18.7066 22.5408 19.0362L27.4135 21.078C27.6608 21.1816 27.9392 21.1816 28.1865 21.078L33.0591 19.0362C33.8455 18.7066 34.6571 19.4492 34.3986 20.2617L28.7529 38.0051C28.4573 38.9341 27.1427 38.9342 26.8471 38.0051Z" />
    </svg>
  );
}

/* ------------------------------------------------------------ status bar */

export function SignalIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 19 12" fill="currentColor" className={className} aria-hidden="true">
      <rect x="0" y="7.5" width="3.2" height="4.5" rx="0.7" />
      <rect x="4.8" y="5" width="3.2" height="7" rx="0.7" />
      <rect x="9.6" y="2.5" width="3.2" height="9.5" rx="0.7" />
      <rect x="14.4" y="0" width="3.2" height="12" rx="0.7" />
    </svg>
  );
}

export function WifiIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 17 12" fill="currentColor" className={className} aria-hidden="true">
      <path d="M8.5 3.2C10.8 3.2 12.9 4.1 14.4 5.6L15.5 4.5C13.7 2.7 11.2 1.5 8.5 1.5C5.8 1.5 3.3 2.7 1.5 4.5L2.6 5.6C4.1 4.1 6.2 3.2 8.5 3.2Z" />
      <path d="M8.5 6.8C9.9 6.8 11.1 7.3 12 8.2L13.1 7.1C11.8 5.9 10.2 5.1 8.5 5.1C6.8 5.1 5.2 5.9 3.9 7.1L5 8.2C5.9 7.3 7.1 6.8 8.5 6.8Z" />
      <circle cx="8.5" cy="10.5" r="1.5" />
    </svg>
  );
}

export function BatteryIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 27 13" fill="none" className={className} aria-hidden="true">
      <rect x="0.5" y="0.5" width="23" height="12" rx="3.5" stroke="currentColor" strokeOpacity="0.35" />
      <rect x="2" y="2" width="20" height="9" rx="2" fill="currentColor" />
      <path
        d="M25 4.5V8.5C25.8 8.2 26.5 7.2 26.5 6.5C26.5 5.8 25.8 4.8 25 4.5Z"
        fill="currentColor"
        fillOpacity="0.4"
      />
    </svg>
  );
}

/* --------------------------------------------------------- stroke icons */

type StrokeProps = IconProps & { strokeWidth?: number };

function Stroke({
  className,
  strokeWidth = 1.7,
  children,
}: StrokeProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

// Arrow pointing to the top-start corner — the app's "go" affordance.
export function ArrowOutIcon(props: StrokeProps) {
  return (
    <Stroke strokeWidth={2.2} {...props}>
      <path d="M16 16 9 9" />
      <path d="M9 9h5.5" />
      <path d="M9 9v5.5" />
    </Stroke>
  );
}

export function BellIcon(props: StrokeProps) {
  return (
    <Stroke {...props}>
      <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </Stroke>
  );
}

export function CameraIcon(props: StrokeProps) {
  return (
    <Stroke {...props}>
      <path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L19 6h0a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8Z" />
      <circle cx="12" cy="12.5" r="3.5" />
    </Stroke>
  );
}

export function MapIcon(props: StrokeProps) {
  return (
    <Stroke {...props}>
      <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z" />
      <path d="M9 4v14M15 6v14" />
    </Stroke>
  );
}

export function RouteIcon(props: StrokeProps) {
  return (
    <Stroke {...props}>
      <circle cx="6" cy="19" r="2.5" />
      <circle cx="18" cy="5" r="2.5" />
      <path d="M8.5 19H14a3.5 3.5 0 0 0 0-7H10a3.5 3.5 0 0 1 0-7h5.5" />
    </Stroke>
  );
}

export function TrendUpIcon(props: StrokeProps) {
  return (
    <Stroke strokeWidth={2.2} {...props}>
      <path d="m3 17 6-6 4 4 8-8" />
      <path d="M16 7h5v5" />
    </Stroke>
  );
}

export function CheckIcon(props: StrokeProps) {
  return (
    <Stroke strokeWidth={2.4} {...props}>
      <path d="m5 12.5 4.5 4.5L19 6.5" />
    </Stroke>
  );
}

export function GridIcon(props: StrokeProps) {
  return (
    <Stroke strokeWidth={2.2} {...props}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </Stroke>
  );
}

export function PersonIcon(props: StrokeProps) {
  return (
    <Stroke strokeWidth={1.8} {...props}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
      <path d="M16 6a3 3 0 0 1 0 6M17 20a5.5 5.5 0 0 0-3-5" />
    </Stroke>
  );
}

export function CalendarIcon(props: StrokeProps) {
  return (
    <Stroke {...props}>
      <rect x="3.5" y="5" width="17" height="16" rx="2.5" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </Stroke>
  );
}

export function ClockIcon(props: StrokeProps) {
  return (
    <Stroke {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </Stroke>
  );
}

export function ChevronStartIcon(props: StrokeProps) {
  return (
    <Stroke strokeWidth={2.2} {...props}>
      <path d="m14 6-6 6 6 6" />
    </Stroke>
  );
}

export function PinIcon(props: StrokeProps) {
  return (
    <Stroke {...props}>
      <path d="M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12Z" />
      <circle cx="12" cy="9" r="2.6" />
    </Stroke>
  );
}

export function PlusIcon(props: StrokeProps) {
  return (
    <Stroke {...props}>
      <path d="M12 5v14M5 12h14" />
    </Stroke>
  );
}

export function SunIcon(props: StrokeProps) {
  return (
    <Stroke {...props}>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.2 5.2l1.6 1.6M17.2 17.2l1.6 1.6M18.8 5.2l-1.6 1.6M6.8 17.2l-1.6 1.6" />
    </Stroke>
  );
}

export function MoonIcon(props: StrokeProps) {
  return (
    <Stroke {...props}>
      <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" />
    </Stroke>
  );
}

export function ImageIcon(props: StrokeProps) {
  return (
    <Stroke {...props}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
      <circle cx="8.5" cy="9.5" r="1.6" />
      <path d="m4 17 5-4 4 3 3-2.5 5 4" />
    </Stroke>
  );
}

export function RecordIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="12" cy="12" r="4.5" fill="currentColor" />
    </svg>
  );
}
