import type { AnchorHTMLAttributes, ReactNode } from "react";
import RollText from "./RollText";

type RollLinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
} & Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "href" | "children" | "className"
>;

/**
 * An anchor whose label does the roll on hover — see RollText.
 *
 * The anchor is what carries `group/roll`, so the roll answers a keyboard tab
 * as well as the pointer, and the whole link box is the hover target rather
 * than just the glyphs. Everything else (target, rel, dir, onClick…) passes
 * straight through, so a mailto or an external link is written the usual way.
 */
export default function RollLink({
  href,
  children,
  className,
  ...rest
}: RollLinkProps) {
  return (
    <a
      href={href}
      className={`group/roll inline-block ${className ?? ""}`}
      {...rest}
    >
      <RollText>{children}</RollText>
    </a>
  );
}
