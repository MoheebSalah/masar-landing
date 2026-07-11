type Props = {
  children: React.ReactNode;
};

// The showcase's phone mockup: dark bezel + rounded screen + dynamic island.
// Unlike PhoneFrame (which shows a screenshot), this hosts live screen
// components authored at the export's native 402×874, scaled down to the
// 330×717.5 screen opening (330/402 ≈ 0.8209).
export default function ScreenFrame({ children }: Props) {
  return (
    <div className="relative h-[737.5px] w-87.5 rounded-[3.25rem] bg-[#0E1312] p-2.5 shadow-[0_0_0_1px_rgba(247,248,247,0.08),0_30px_60px_-25px_rgba(0,0,0,0.7)]">
      <div className="relative h-full w-full overflow-hidden rounded-[2.65rem] bg-(--sv-bg)">
        <div className="absolute left-0 top-0 h-218.5 w-100.5 origin-top-left scale-[0.8209]">
          {children}
        </div>
      </div>
      {/* Dynamic island */}
      <div className="absolute left-1/2 top-4.75 z-10 h-7.5 w-25.75 -translate-x-1/2 rounded-full bg-black" />
    </div>
  );
}
