import { ArrowIcon } from "./Icons";

type CtaCardProps = {
  className?: string;
};

/**
 * A tile-sized call-to-action button. The whole surface is the control, so the
 * circular arrow badge earns its filled background.
 */
export default function CtaCard({ className = "" }: CtaCardProps) {
  return (
    <a
      href="#contact"
      className={`group flex items-center justify-between rounded-brand bg-primary px-8 shadow-[0_8px_30px_-16px_rgba(14,19,18,0.25)] transition-colors duration-300 hover:bg-primary-600 ${className}`}
    >
      <span className="font-sans text-t1 font-bold text-on-primary">
        ابدأ الآن
      </span>
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-700 transition-transform duration-300 group-hover:-translate-y-1">
        <ArrowIcon className="h-6 w-6 text-text-dark" />
      </span>
    </a>
  );
}
