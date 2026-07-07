import type { ReactNode } from "react";

type NavLinkProps = {
  href: string;
  children: ReactNode;
};

/**
 * Nav anchor with an underline that draws in from right to left on hover
 * and retracts on leave. The line uses `currentColor`, so it adapts to
 * whatever text colour the navbar is in.
 */
export default function NavLink({ href, children }: NavLinkProps) {
  return (
    <a
      href={href}
      className="relative inline-block pb-1 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:origin-right after:scale-x-0 after:bg-current after:transition-transform after:duration-600 after:ease-in-out hover:after:scale-x-100"
    >
      {children}
    </a>
  );
}
