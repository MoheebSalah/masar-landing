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
      <button
        type="button"
        onClick={onSelect}
        className={`font-heading text-[6rem] leading-[1.05] transition-colors duration-300 ${
          active ? "text-primary" : "text-muted hover:text-subtext"
        }`}
      >
        {word}
      </button>

      {/* Sentence expands only for the active point (0fr → 1fr row trick) */}
      <div
        className={`grid transition-all duration-300 ease-out ${
          active ? "mt-3 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <p className="overflow-hidden text-t2 leading-relaxed text-subtext">
          {sentence}
        </p>
      </div>
    </div>
  );
}
