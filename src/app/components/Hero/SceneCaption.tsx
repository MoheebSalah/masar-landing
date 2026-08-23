type SceneCaptionProps = {
  /** Video time (in seconds) at which this caption starts arriving. */
  from: number;
  /** Video time (in seconds) by which it has finished leaving. */
  to: number;
  /** Where the card sits over the footage — absolute-position utilities. */
  position: string;
  /**
   * How the footage is framed on phones, where the frame runs full-bleed at
   * its own full height — far wider than a portrait screen can hold, so only
   * a slice of it fits and the rest is reached by sliding that window
   * sideways as the page scrolls. Desktop ignores this and fills the canvas.
   *
   * `cut` is the footage second this scene's shot begins at, taken from the
   * cuts in the clip itself: the window jumps to `from` there, which nothing
   * can be seen to do because the picture changes completely on the same
   * frame. It then travels to `to` over `span` of the shot, holding still for
   * whatever is left. A scene that shouldn't move at all gives the same
   * number twice.
   *
   * `from` and `to` are points on the frame — the fraction of its width the
   * window centres on, clamped so it never runs off an end, which makes 0
   * "hard left" and 1 "hard right". Write them as the thing being looked at,
   * not as how far along the pan has got: how wide a slice fits depends on the
   * viewport's shape, so a taller phone (or a browser whose URL bar has just
   * slid away) takes a narrower one, and only a window anchored to the subject
   * keeps it in shot on all of them.
   */
  mobilePan: {
    cut: number;
    from: number;
    to: number;
    span?: number;
  };
  /** Headline. Split into words so each one can shade in on its own. */
  title: string;
  /** The scene's supporting line. */
  children: React.ReactNode;
};

/**
 * One title + paragraph that rides over the scroll-driven hero footage — set
 * straight onto the frame, with nothing behind it. The footage is near-white
 * throughout, so the type carries itself in the page's own ink.
 *
 * The component is purely presentational: it publishes its cue points as data
 * attributes and marks its animatable parts, and Hero's single scrubbed
 * timeline picks them up from the DOM. Two nested wrappers on purpose — the
 * outer one carries the Tailwind positioning (including any `translate`
 * utilities), the inner block is what GSAP transforms, so the two never fight
 * over the same property.
 */
export default function SceneCaption({
  from,
  to,
  position,
  mobilePan,
  title,
  children,
}: SceneCaptionProps) {
  return (
    <div className={`absolute ${position}`}>
      <div
        data-scene
        data-from={from}
        data-to={to}
        data-mobile-pan={JSON.stringify(mobilePan)}
        className="relative"
      >
        {/* A thin primary rule around the words — the same shape the footage
            throws around a pothole the moment it spots one, so the caption
            reads as the system locking onto the scene.

            Four scaled edges rather than one stroked <rect>: the box has to
            stretch to whatever the text needs, and a dashed stroke through a
            non-uniform scale doesn't survive it — the dash pattern is measured
            in one space and the geometry drawn in another, so the lap comes
            out short. Edges are listed in lap order, each anchored where the
            previous one finished, so scaling them in turn traces the rectangle
            once round from the top-right. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-x-6 -inset-y-5 max-md:-inset-4"
        >
          <span
            data-scene-edge="x"
            className="absolute inset-x-0 top-0 h-[1.5px] origin-right bg-primary"
          />
          <span
            data-scene-edge="y"
            className="absolute inset-y-0 left-0 w-[1.5px] origin-top bg-primary"
          />
          <span
            data-scene-edge="x"
            className="absolute inset-x-0 bottom-0 h-[1.5px] origin-left bg-primary"
          />
          <span
            data-scene-edge="y"
            className="absolute inset-y-0 right-0 w-[1.5px] origin-bottom bg-primary"
          />
        </div>

        {/* A wrapping flex row so every word is its own box and the gap keeps
            the spacing even — an inline-block run would swallow the whitespace
            between the spans. */}
        <h2 className="relative flex flex-wrap gap-x-[0.28em] font-heading text-h2 leading-tight text-text max-md:text-h3">
          {title.split(" ").map((word, i) => (
            <span key={`${word}-${i}`} data-scene-word>
              {word}
            </span>
          ))}
        </h2>

        {/* Black like the heading rather than the usual subtext grey: with no
            plate under it, this line crosses whatever the frame happens to be —
            and mid-grey type over the mid-grey buildings in the closing scene
            all but disappears. The hierarchy comes from size and face instead. */}
        <p
          data-scene-body
          className="relative mt-4 font-sans text-t2 leading-relaxed text-text max-md:text-t3"
        >
          {children}
        </p>
      </div>
    </div>
  );
}
