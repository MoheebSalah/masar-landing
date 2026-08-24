import type { ReactNode } from "react";
import RollLink from "../RollText/RollLink";

type NavLinkProps = {
  href: string;
  children: ReactNode;
};

/**
 * Nav anchor. The hover is the roll — the label lifts out while a copy of it
 * rises into place from below — which replaces the underline that used to draw
 * in from the right. Colour is inherited, so it keeps following the bar as it
 * flips between its light and dark states.
 */
export default function NavLink({ href, children }: NavLinkProps) {
  return <RollLink href={href}>{children}</RollLink>;
}
