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

// The single centre chevron from the Masar logo mark, used for the carousel's
// prev/next controls. It points up in its own box; rotate it with a utility
// (e.g. `-rotate-90` for left, `rotate-90` for right). The viewBox is cropped
// tight to the chevron so it reads large inside a small button.
export function LogoArrow({ className }: IconProps) {
  return (
    <svg
      viewBox="17 17 22 22"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M26.8471 38.005L21.2015 20.2616C20.9429 19.4492 21.7545 18.7066 22.5409 19.0361L27.4135 21.078C27.6608 21.1816 27.9393 21.1816 28.1865 21.078L33.0592 19.0361C33.8455 18.7066 34.6571 19.4492 34.3986 20.2616L28.7529 38.005C28.4573 38.9341 27.1427 38.9341 26.8471 38.005Z" />
    </svg>
  );
}
