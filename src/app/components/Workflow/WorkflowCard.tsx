type WorkflowCardProps = {
  heading: string;
  paragraph: string;
  image: string;
  /** When true the image sits on the right and the text on the left. */
  reverse?: boolean;
};

/**
 * A single workflow step: a fixed-size image beside a heading + paragraph.
 * Sizes are fixed on purpose so the overlaid arrow path (see Workflow.tsx)
 * lines up with each image. Desktop-only per the design rules.
 */
export default function WorkflowCard({
  heading,
  paragraph,
  image,
  reverse,
}: WorkflowCardProps) {
  return (
    <div
      className={`flex items-center gap-20 ${
        reverse ? "flex-row-reverse" : "flex-row"
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image}
        alt=""
        aria-hidden="true"
        className="h-100 w-160 shrink-0 rounded-brand object-cover shadow-[0_16px_40px_rgba(14,19,18,0.45)]"
      />

      <div className="flex w-120 flex-col gap-6 text-right" dir="rtl">
        <h3 className="font-heading text-h3 text-text-dark">{heading}</h3>
        <p className="text-t3 leading-8 text-subtext-dark">{paragraph}</p>
      </div>
    </div>
  );
}
