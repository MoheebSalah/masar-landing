type Props = {
  className?: string;
};

// A single arrow lifted from the Masar logo (its centre chevron), rotated 90°
// so it points left — used as the bullet next to the stat title. Colour is
// inherited via `currentColor`. The viewBox is cropped to the rotated arrow so
// it fills its box.
export default function ArrowBullet({ className }: Props) {
  return (
    <svg
      viewBox="18 20 19 15"
      fill="currentColor"
      role="img"
      aria-hidden="true"
      className={className}
    >
      <path
        transform="rotate(90 28 28)"
        d="M26.8471 38.005L21.2015 20.2616C20.9429 19.4492 21.7545 18.7066 22.5409 19.0361L27.4135 21.078C27.6608 21.1816 27.9393 21.1816 28.1865 21.078L33.0592 19.0361C33.8455 18.7066 34.6571 19.4492 34.3986 20.2616L28.7529 38.005C28.4573 38.9341 27.1427 38.9341 26.8471 38.005Z"
      />
    </svg>
  );
}
