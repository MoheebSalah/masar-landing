type Props = {
  image: string;
};

// A pure-CSS phone mockup: dark bezel + rounded screen + a small notch.
// The screenshot fills the screen; a faint light ring reads as the device edge
// against the dark section (no real border, just a soft shadow).
export default function PhoneFrame({ image }: Props) {
  return (
    <div className="relative aspect-[9/19] w-[280px] rounded-[2.75rem] bg-dark p-2.5 shadow-[0_0_0_1px_rgba(247,248,247,0.08),0_30px_60px_-25px_rgba(0,0,0,0.7)]">
      <div className="relative h-full w-full overflow-hidden rounded-[2.15rem] bg-background">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt=""
          aria-hidden="true"
          draggable={false}
          className="pointer-events-none h-full w-full select-none object-cover object-top"
        />
      </div>
      {/* Notch / dynamic island */}
      <div className="absolute left-1/2 top-[18px] z-10 h-[18px] w-24 -translate-x-1/2 rounded-full bg-dark" />
    </div>
  );
}
