type MobileMenuProps = {
  open: boolean;
  onClose: () => void;
};

/**
 * Mobile dropdown. A half card drops in from the top over a blurred, dimmed
 * backdrop. The card carries the light background and a rounded bottom edge;
 * its top row is left clear so the persistent navbar (logo + burger→cross)
 * reads as part of it. Only rendered below `md` — desktop keeps its own nav.
 *
 * The two halves read separately:
 *   • the card holds for a beat (open delay) then drops with a weighted ease;
 *   • the links don't fall with it — each sits behind its own clipped bottom
 *     edge and rises into place once the card has nearly landed (open delays),
 *     staggered.
 * Closing reverses the flow: the links tuck straight back down (no delay) while
 * the card waits a beat before retracting, so it leaves last.
 */
export default function MobileMenu({ open, onClose }: MobileMenuProps) {
  const links = [
    { href: "#about", label: "من نحن" },
    { href: "#contact", label: "تواصل معنا" },
  ];

  return (
    <div className="md:hidden" aria-hidden={!open}>
      {/* Backdrop — blur and darken the page behind the card */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-dark/40 backdrop-blur-sm transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* The card — holds a beat, then drops fast; retracts fast (and last) on close */}
      <div
        className={`fixed inset-x-0 top-0 z-45 rounded-b-brand bg-background px-6 pt-24 pb-10 shadow-[0_24px_48px_-24px_rgba(14,19,18,0.35)] transition-transform ease-[cubic-bezier(0.65,0,0.2,1)] ${
          open
            ? "translate-y-0 delay-100 duration-360"
            : "-translate-y-full delay-100 duration-300"
        }`}
      >
        <nav className="flex flex-col gap-6 text-right">
          {links.map((link, i) => (
            // Clipped box: the link waits below its bottom edge and rises up
            // through it, so it emerges in place rather than dropping with the card.
            <div key={link.href} className="overflow-hidden py-0.5">
              <a
                href={link.href}
                onClick={onClose}
                className={`block font-sans text-h3 font-bold text-text transition-transform ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  open ? "translate-y-0 duration-360" : "translate-y-full duration-300"
                } ${
                  open
                    ? i === 0
                      ? "delay-380"
                      : "delay-460"
                    : i === 0
                      ? "delay-60"
                      : "delay-0"
                }`}
              >
                {link.label}
              </a>
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
}
