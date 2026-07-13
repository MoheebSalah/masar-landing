// Fluent-style device icons for the map's device toggle. 24×24 stroke icons;
// colour and size inherit from the parent.

type IconProps = { className?: string };

function DeviceSvg({
  className,
  children,
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

// Monitor screen sitting on a short stand.
export function DesktopIcon(props: IconProps) {
  return (
    <DeviceSvg {...props}>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8.5 20h7M12 16v4" />
    </DeviceSvg>
  );
}

// A tablet — landscape-ish body with a home line.
export function TabletIcon(props: IconProps) {
  return (
    <DeviceSvg {...props}>
      <rect x="4.5" y="3" width="15" height="18" rx="2.5" />
      <path d="M10.5 18.5h3" />
    </DeviceSvg>
  );
}

// A tall phone with a speaker line.
export function PhoneIcon(props: IconProps) {
  return (
    <DeviceSvg {...props}>
      <rect x="7" y="2.5" width="10" height="19" rx="2.5" />
      <path d="M10.5 18.5h3M10.5 5h3" />
    </DeviceSvg>
  );
}
