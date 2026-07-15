type MobileMenuProps = {
  open: boolean;
  onClose: () => void;
};

/**
 * Mobile dropdown. A half card drops in from the top over a blurred, dimmed
 * backdrop. The card carries the light background and a rounded bottom edge;
 * its top row is left clear so the persistent navbar (logo + burger→cross)
 * reads as part of it. Only rendered below `md` — desktop keeps its own nav.
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

      {/* The card — slides down from above; top padding clears the navbar row */}
      <div
        className={`fixed inset-x-0 top-0 z-45 rounded-b-brand bg-background px-6 pt-24 pb-10 shadow-[0_24px_48px_-24px_rgba(14,19,18,0.35)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          open ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <nav className="flex flex-col gap-6 text-right">
          {links.map((link, i) => (
            <a
              key={link.href}
              href={link.href}
              onClick={onClose}
              className={`font-heading text-h3 text-text transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                i === 1 ? "delay-75" : ""
              } ${open ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"}`}
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </div>
  );
}
