import type { ReactNode } from "react";

type ProblemCardProps = {
  icon: ReactNode;
  title: string;
  description: string;
};

export default function ProblemCard({ icon, title, description }: ProblemCardProps) {
  return (
    <div className="rounded-brand bg-white p-7 text-right shadow-[0_12px_32px_-18px_rgba(17,23,23,0.22)]">
      <div className="mb-5 text-primary">{icon}</div>
      <h3 className="mb-2 font-sans text-t1 font-bold text-[#111717]">{title}</h3>
      <p className="text-t4 leading-relaxed text-subtext">{description}</p>
    </div>
  );
}
