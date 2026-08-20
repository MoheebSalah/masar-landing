type SceneCaptionProps = {
  /** Video time (in seconds) at which this caption starts arriving. */
  from: number;
  /** Video time (in seconds) by which it has finished leaving. */
  to: number;
  /** Where the card sits over the footage — absolute-position utilities. */
  position: string;
  /**
   * How this scene is framed on phones, where the footage is reshaped per
   * scene rather than run full-bleed throughout. Desktop ignores it.
   *
   * `band` is the horizontal slice of the (square) mobile frame to show, as
   * [start, width] fractions. `box` is where that slice sits on screen, as
   * [x, y, width, height] fractions of the viewport — every scene runs the
   * full width and sits flush to the top or bottom edge, so the footage reads
   * as part of the screen rather than a card floating on it. `radius` is the
   * box's corner in CSS pixels, and stays 0 for the same reason.
   *
   * Every number is tweened between scenes, so the framing morphs rather than
   * cutting: the box glides and resizes while the crop pans across the frame.
   */
  mobileFrame: {
    band: [number, number];
    box: [number, number, number, number];
    radius: number;
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
  mobileFrame,
  title,
  children,
}: SceneCaptionProps) {
  return (
    <div className={`absolute ${position}`}>
      <div
        data-scene
        data-from={from}
        data-to={to}
        data-mobile-frame={JSON.stringify(mobileFrame)}
      >
        {/* Small primary marks that pop in ahead of the words */}
        <div className="mb-5 flex items-center gap-2" aria-hidden="true">
          <span data-scene-accent className="block h-2 w-2 rounded-full bg-primary" />
          <span data-scene-accent className="block h-2 w-2 rounded-full bg-primary/60" />
          <span data-scene-accent className="block h-2 w-2 rotate-45 bg-primary/35" />
        </div>

        {/* A wrapping flex row so every word is its own box and the gap keeps
            the spacing even — an inline-block run would swallow the whitespace
            between the spans. */}
        <h2 className="flex flex-wrap gap-x-[0.28em] font-heading text-h3 leading-tight text-text max-md:text-[1.75rem]">
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
          className="mt-4 font-sans text-t4 leading-relaxed text-text max-md:text-t5"
        >
          {children}
        </p>
      </div>
    </div>
  );
}
