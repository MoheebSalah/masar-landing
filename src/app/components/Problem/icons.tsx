type IconProps = {
  className?: string;
};

/* Fluent-System-style outline icons (24 grid). Colour is inherited via currentColor. */

// Lost reports — a document with a dismiss (x) mark.
export function LostReportsIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <path d="M9.5 12.5l4 4M13.5 12.5l-4 4" />
    </svg>
  );
}

// No clear priorities — unsorted bars of differing heights.
export function NoPrioritiesIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M5 15v4" />
      <path d="M10 10v9" />
      <path d="M15 13v6" />
      <path d="M20 6v13" />
    </svg>
  );
}

// No proof of completion — a clipboard with a dismiss (x) mark.
export function NoProofIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <path d="M9 4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5v1A1.5 1.5 0 0 1 13.5 7h-3A1.5 1.5 0 0 1 9 5.5z" />
      <path d="M10 13l4 4M14 13l-4 4" />
    </svg>
  );
}
