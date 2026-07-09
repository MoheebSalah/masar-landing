import Logo from "../Logo/Logo";
import PhoneFrame from "../PhoneShowcase/PhoneFrame";

type BrandCardProps = {
  className?: string;
};

/**
 * The centrepiece tile: the Masar mark and brand promise sit at the top, and the
 * mobile app peeks up from the bottom edge — grounding the promise in the product.
 */
export default function BrandCard({ className = "" }: BrandCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-brand bg-white p-8 shadow-[0_8px_30px_-16px_rgba(14,19,18,0.25)] ${className}`}
    >
      {/* Brand mark + promise */}
      <div className="relative z-10">
        <Logo className="h-16 w-auto text-primary" />
        <h3 className="mt-6 font-heading text-h3 leading-tight text-text">
          الشوارع أكثر أماناً مع مسار
        </h3>
      </div>

      {/* App peeking up from the bottom edge */}
      <div className="pointer-events-none absolute bottom-[-9%] left-1/2 w-[90%] -translate-x-1/2 drop-shadow-[0_18px_30px_rgba(14,19,18,0.20)]">
        <PhoneFrame image="/assets/mockup/carousel%201.png" />
      </div>
    </div>
  );
}
