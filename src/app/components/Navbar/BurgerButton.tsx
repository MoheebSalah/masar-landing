type BurgerButtonProps = {
  open: boolean;
  onClick: () => void;
  /** Colour utilities for the bars (they use `currentColor`). */
  className?: string;
};

/**
 * The mobile menu toggle: two horizontal lines that morph into an X when the
 * menu opens. Both bars slide to the vertical centre and rotate ±45°, so the
 * burger and the close cross are the same element animating between states.
 */
export default function BurgerButton({ open, onClick, className }: BurgerButtonProps) {
  const bar =
    "absolute left-0 h-0.5 w-full rounded-full bg-current transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={open ? "إغلاق القائمة" : "فتح القائمة"}
      aria-expanded={open}
      className={`flex h-11 w-11 items-center justify-center ${className ?? ""}`}
    >
      <span className="relative block h-6 w-7">
        <span className={`${bar} ${open ? "top-1/2 -translate-y-1/2 rotate-45" : "top-2"}`} />
        <span className={`${bar} ${open ? "top-1/2 -translate-y-1/2 -rotate-45" : "top-4"}`} />
      </span>
    </button>
  );
}
