import { BadgeIcon } from "./Icons";

type ReviewCardProps = {
  className?: string;
};

/**
 * Social-proof tile: a large rating figure sits at the top with an award badge,
 * and a stack of reviewer avatars rests at the bottom. Monogram avatars keep the
 * card on-palette without leaning on stock photography.
 */
export default function ReviewCard({ className = "" }: ReviewCardProps) {
  const avatars = [
    { initial: "أ", bg: "bg-primary-700" },
    { initial: "م", bg: "bg-primary-600" },
    { initial: "س", bg: "bg-primary" },
    { initial: "ن", bg: "bg-success" },
  ];

  return (
    <div
      className={`flex flex-col justify-between rounded-brand bg-white p-8 shadow-[0_8px_30px_-16px_rgba(14,19,18,0.25)] ${className}`}
    >
      {/* Rating figure + badge */}
      <div className="flex items-start justify-between">
        <div>
          <span className="block font-heading text-heading leading-none text-text">
            4.9
          </span>
          <span className="mt-3 block font-sans text-t3 text-subtext">
            تقييم المستخدمين
          </span>
        </div>
        <BadgeIcon className="h-14 w-14 text-text" />
      </div>

      {/* Reviewer avatars — overlapping, aligned to the RTL start (right) */}
      <div className="flex -space-x-3 space-x-reverse">
        {avatars.map(({ initial, bg }) => (
          <span
            key={initial}
            className={`flex h-11 w-11 items-center justify-center rounded-full font-sans text-t4 text-text-dark ring-4 ring-white ${bg}`}
          >
            {initial}
          </span>
        ))}
      </div>
    </div>
  );
}
