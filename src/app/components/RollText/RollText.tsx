import type { ReactNode } from "react";

/**
 * Shared motion for both copies. Long enough to read as a roll rather than a
 * flick, on the house ease so it settles rather than stops.
 */
const ROLL =
  "transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none";

/** Both copies travel on hover AND on keyboard focus of the element driving them. */
const MOVE =
  "group-hover/roll:-translate-y-full group-focus-visible/roll:-translate-y-full";

type RollTextProps = {
  children: ReactNode;
  className?: string;
};

/**
 * The label lifts away while an identical copy rises into its place from
 * below — and reverses on the way out.
 *
 * Two copies sit a box apart inside something that clips to one of them: the
 * visible copy leaves through the top edge exactly as the waiting one arrives
 * through the bottom. The step is `top-full` and `-translate-y-full`, i.e. the
 * box's own height rather than any fixed distance, so the pair stay exactly one
 * line apart at whatever size the surrounding text happens to be.
 *
 * The reversal costs nothing: these are CSS transitions, so releasing the hover
 * plays the same motion backwards from wherever it had reached — no half-rolled
 * label left stranded if the pointer only grazes it.
 *
 * The clip is the one thing to be careful with in Arabic: the box has to be
 * tall enough to hold the descenders on ج ح خ ع م ي, or the hidden edges shave
 * them off. It takes its height from these copies, so `leading` is what tunes
 * that — and because both copies and the step all derive from the same height,
 * changing it keeps them in sync automatically.
 *
 * Drive it from the interactive element rather than from here, so the effect
 * answers the keyboard as well as the pointer: whatever carries `group/roll` is
 * what the two copies watch. `RollLink` does that for anchors; for a button,
 * put `group/roll` on the button.
 */
export default function RollText({ children, className }: RollTextProps) {
  return (
    <span className={`relative block overflow-hidden ${className ?? ""}`}>
      <span className={`block leading-[1.45] ${ROLL} ${MOVE}`}>{children}</span>

      {/* The copy waiting just past the bottom edge. Hidden from assistive tech
          so the label isn't announced twice. */}
      <span
        aria-hidden="true"
        className={`absolute inset-x-0 top-full block leading-[1.45] ${ROLL} ${MOVE}`}
      >
        {children}
      </span>
    </span>
  );
}
