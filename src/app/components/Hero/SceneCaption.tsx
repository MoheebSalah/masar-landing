type SceneCaptionProps = {
  /** Video time (in seconds) at which this caption starts arriving. */
  from: number;
  /** Video time (in seconds) by which it has finished leaving. */
  to: number;
  /** Where the card sits over the footage — absolute-position utilities. */
  position: string;
  /** Headline. Split into words so each one can shade in on its own. */
  title: string;
  /** The scene's supporting line. */
  children: React.ReactNode;
};

/**
 * One title + paragraph card that rides over the scroll-scrubbed hero footage.
 *
 * The component is purely presentational: it publishes its cue points as data
 * attributes and marks its animatable parts, and Hero's single scrubbed
 * timeline picks them up from the DOM. Two nested wrappers on purpose — the
 * outer one carries the Tailwind positioning (including any `translate`
 * utilities), the inner card is what GSAP transforms, so the two never fight
 * over the same property.
 */
export default function SceneCaption({
  from,
  to,
  position,
  title,
  children,
}: SceneCaptionProps) {
  return (
    <div className={`absolute ${position}`}>
      <div
        data-scene
        data-from={from}
        data-to={to}
        // Translucent plate so the text survives the video's near-white frames.
        // The blur is desktop-only (it's the single most expensive paint on
        // phones); mobile leans on a denser tint instead.
        className="rounded-brand bg-dark/80 px-7 py-6 shadow-[0_24px_60px_-32px_rgba(14,19,18,0.85)] md:bg-dark/72 md:px-9 md:py-8 md:backdrop-blur-md"
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
        <h2 className="flex flex-wrap gap-x-[0.28em] font-heading text-h3 leading-tight text-text-dark max-md:text-[1.75rem]">
          {title.split(" ").map((word, i) => (
            <span key={`${word}-${i}`} data-scene-word>
              {word}
            </span>
          ))}
        </h2>

        <p
          data-scene-body
          className="mt-4 font-sans text-t4 leading-relaxed text-subtext-dark max-md:text-t5"
        >
          {children}
        </p>
      </div>
    </div>
  );
}
