// Fluent-style filled icons used as the video cursor. 24×24 viewBox,
// colour and size inherit from the parent (the cursor paints them primary).

type IconProps = { className?: string };

export function PlayIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M7.4 3.1c-1-.6-2.4.1-2.4 1.3v15.2c0 1.2 1.4 1.9 2.4 1.3l12.5-7.6c1-.6 1-2 0-2.6L7.4 3.1Z" />
    </svg>
  );
}

export function PauseIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M5.75 3A1.75 1.75 0 0 0 4 4.75v14.5c0 .97.78 1.75 1.75 1.75h2.5A1.75 1.75 0 0 0 10 19.25V4.75A1.75 1.75 0 0 0 8.25 3h-2.5Zm10 0A1.75 1.75 0 0 0 14 4.75v14.5c0 .97.78 1.75 1.75 1.75h2.5A1.75 1.75 0 0 0 20 19.25V4.75A1.75 1.75 0 0 0 18.25 3h-2.5Z" />
    </svg>
  );
}

// A simple stroked chevron used for the carousel's edge controls. It points
// left by default; rotate it 180° for the right-hand control. Stroke colour
// inherits from the parent (set it with a text utility, e.g. `text-primary`).
export function ChevronIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M9 4 L2 12 L9 20" />
    </svg>
  );
}
