import MediaCard from "./MediaCard";
import ReviewCard from "./ReviewCard";
import BrandCard from "./BrandCard";
import CtaCard from "./CtaCard";
import Logo from "../Logo/Logo";
import PhoneFrame from "../PhoneShowcase/PhoneFrame";

export default function Bento() {
  return (
    <section
      id="capabilities"
      className="w-full bg-background px-8 py-16 md:px-16 lg:px-32"
    >
      {/* Section heading */}
      <div className="mb-10 text-center">
        <h2 className="font-heading text-heading text-text">
          منصّة واحدة، طرق أكثر أماناً
        </h2>
        <p className="mx-auto mt-4 max-w-xl font-sans text-t2 text-subtext">
          من الرصد التلقائي إلى لوحة تحكّم متكاملة — تجربة موحّدة يثق بها المستخدمون.
        </p>
      </div>

      {/* Bento grid — mirrored for RTL: reviews start on the right, the brand
          promise anchors the centre, the live dashboard fills the left. */}
      <div className="grid h-150 grid-cols-12 grid-rows-4 gap-4">
        {/* Reviews — social proof, top-right */}
        <ReviewCard className="col-span-3 col-start-1 row-span-2 row-start-1" />

        {/* Brand promise — centre column, full height, app peeking below */}
        <BrandCard className="col-span-3 col-start-4 row-span-4 row-start-1" />

        {/* Live reports dashboard — MacBook mockup floating on a primary box */}
        <MediaCard
          variant="primary"
          className="col-span-6 col-start-7 row-span-2 row-start-1"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/bento/mac%20mockup.png"
            alt="لوحة تحكّم مسار على الحاسوب"
            className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover object-center"
          />
        </MediaCard>

        {/* Live trip tracking — framed phone on a primary box */}
        <MediaCard
          variant="primary"
          className="col-span-3 col-start-1 row-span-2 row-start-3"
        >
          <div className="pointer-events-none absolute left-1/2 top-8 w-[72%] -translate-x-1/2">
            <PhoneFrame image="/assets/mockup/carousel%205.png" />
          </div>
        </MediaCard>

        {/* Automatic detection — framed phone on a primary box */}
        <MediaCard
          variant="primary"
          className="col-span-3 col-start-7 row-span-2 row-start-3"
        >
          <div className="pointer-events-none absolute left-1/2 top-8 w-[72%] -translate-x-1/2">
            <PhoneFrame image="/assets/mockup/carousel%203.png" />
          </div>
        </MediaCard>

        {/* Call to action */}
        <CtaCard className="col-span-3 col-start-10 row-span-1 row-start-3" />

        {/* Pothole illustration — small product cue */}
        <MediaCard className="col-span-2 col-start-10 row-span-1 row-start-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/pothole.png"
            alt="حفرة في الطريق"
            className="pointer-events-none absolute inset-0 h-full w-full select-none object-contain p-3"
          />
        </MediaCard>

        {/* Small brand tile */}
        <div className="col-span-1 col-start-12 row-span-1 row-start-4 flex items-center justify-center rounded-brand bg-primary shadow-[0_8px_30px_-16px_rgba(14,19,18,0.25)]">
          <Logo className="h-12 w-auto text-text-dark" />
        </div>
      </div>
    </section>
  );
}
