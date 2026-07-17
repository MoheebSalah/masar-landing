type ProblemPointProps = {
  word: string;
  sentence: string;
  active: boolean;
  onSelect: () => void;
};

export default function ProblemPoint({
  word,
  sentence,
  active,
  onSelect,
}: ProblemPointProps) {
  return (
    <div className="text-right">
      {/* The whole row is the button — on phones that spans the title, the gap
          and the indicator arrow on the left, so a tap anywhere along it selects
          the point. Desktop stays a content-width button around just the word. */}
      <button
        type="button"
        onClick={onSelect}
        className="group cursor-pointer max-md:flex max-md:w-full max-md:items-center max-md:justify-between max-md:gap-4"
      >
        <span
          className={`font-heading text-[6rem] leading-[1.05] transition-colors duration-300 max-md:text-[3.25rem] ${
            active ? "text-primary" : "text-muted group-hover:text-subtext"
          }`}
        >
          {word}
        </span>

        {/* Indicator chevron (phones only): points up while collapsed, flips
            down when this point is expanded (active). The flip eases smoothly. */}
        <span
          aria-hidden="true"
          className={`hidden shrink-0 transition-colors duration-300 max-md:block ${
            active ? "text-primary" : "text-muted"
          }`}
        >
          <svg
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`h-6 w-6 transition-transform duration-300 ease-out ${
              active ? "rotate-0" : "rotate-180"
            }`}
          >
            <path d="M2.5 4.5 L6 8 L9.5 4.5" />
          </svg>
        </span>
      </button>

      {/* Sentence expands only for the active point (0fr → 1fr row trick) */}
      <div
        className={`grid transition-all duration-300 ease-out ${
          active ? "mt-3 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <p className="overflow-hidden text-t2 leading-relaxed text-subtext max-md:text-t3">
          {sentence}
        </p>
      </div>
    </div>
  );
}
