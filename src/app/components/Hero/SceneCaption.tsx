type SceneCaptionProps = {
  /** Video time (in seconds) at which this caption starts arriving. */
  from: number;
  /** Video time (in seconds) by which it has finished leaving. */
  to: number;
  /**
   * Where the card sits over the desktop footage — absolute-position
   * utilities. Phones don't take a position at all: every scene shares the one
   * slot set below.
   */
  position: string;
  /**
   * The same two cues for the phone cut, which is a different edit of the same
   * story — portrait, and half the length — so its scenes fall in completely
   * different places. Hero picks one pair or the other once, at the top of its
   * timeline, and never branches again.
   */
  mobileFrom: number;
  mobileTo: number;
  /** Headline. Split into words so each one can rise on its own. */
  title: string;
  /** The scene's supporting line. */
  children: React.ReactNode;
};

/**
 * One title + paragraph that rides over the scroll-driven hero footage — set
 * straight onto the frame, with nothing behind it and no rule around it.
 *
 * **The type is white and the layer it sits in is `mix-blend-mode: difference`
 * (Hero sets the blend on the wrapper).** The frame underneath is what decides
 * the ink: near-white footage inverts to near-black, and anywhere the picture
 * goes dark the same type comes out light. That is the whole contrast strategy
 * — no plate, no shadow, and nothing sampling pixels at runtime. It is why the
 * colour here is a light one and why nothing tweens it. One scene is held out
 * of the blend on phones, where the frame behind it is dark and the type is
 * wanted white; Hero does that by which layer it puts the caption in, and this
 * component knows nothing about it.
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
  mobileFrom,
  mobileTo,
  title,
  children,
}: SceneCaptionProps) {
  return (
    // On phones all five scenes share one slot — high on the stage, centred,
    // 86vw wide — so the hero reads as a single line of type being replaced
    // rather than captions hopping around the frame chasing whatever the
    // portrait cut has drawn in the corners. The `max-md:` half is written
    // here once and wins under 768px on cascade order; `position` carries the
    // desktop placement, where the captions still follow the scene. The
    // `right-auto` / `translate-y-0` pair exists to cancel desktop placements
    // that anchor right or centre vertically.
    <div
      className={`absolute max-md:top-[11%] max-md:right-auto max-md:bottom-auto max-md:left-1/2 max-md:w-[86vw] max-md:-translate-x-1/2 max-md:translate-y-0 ${position}`}
    >
      <div
        data-scene
        data-from={from}
        data-to={to}
        data-mobile-from={mobileFrom}
        data-mobile-to={mobileTo}
        className="relative"
      >
        {/* A single-line flex row so every word is its own box and the gap
            keeps the spacing even — an inline-block run would swallow the
            whitespace between the spans. `flex-nowrap` + `w-max` are what hold
            every title to one line: the row sizes to its own content and
            ignores the slot width `position` sets, which still governs the
            paragraph below. The desktop size is capped by `3.7vw` rather than
            fixed at the h2 40px because the longest title sits in a slot
            anchored `right-1/2` — at 768px that leaves it half the viewport,
            and a flat 40px would run it off the left edge. From ~1080px up the
            `2.5rem` cap wins and it reads at the h2 size. */}
        <h2 className="relative flex w-max flex-nowrap gap-x-[0.28em] font-heading text-[min(2.5rem,3.7vw)] leading-tight text-text-dark max-md:text-t1">
          {title.split(" ").map((word, i) => (
            <span key={`${word}-${i}`} data-scene-word>
              {word}
            </span>
          ))}
        </h2>

        {/* Same ink as the heading rather than a grey: under a difference
            blend a mid-grey would invert to another mid-grey and sit far too
            close to the frame. The hierarchy comes from size and face. */}
        <p
          data-scene-body
          className="relative mt-4 font-sans text-t2 leading-relaxed text-text-dark max-md:mt-2.5 max-md:text-t4"
        >
          {children}
        </p>
      </div>
    </div>
  );
}
