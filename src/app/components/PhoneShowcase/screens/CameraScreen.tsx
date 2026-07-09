import ScreenShell from "./ScreenShell";
import {
  CameraIcon,
  ImageIcon,
  LogoMark,
  PinIcon,
  PlusIcon,
  RecordIcon,
  RouteIcon,
  SunIcon,
} from "../Icons";

// وضع الصور — the live detection viewfinder. The road scene is a camera
// feed so it stays as-is in both themes; the UI chrome (chips, sheet, veil)
// flips through the glass variables like the other screens.
export default function CameraScreen() {
  return (
    <ScreenShell
      className="bg-[#12100C]"
      statusClass="text-white"
      indicatorClass="bg-(--sv-ind)"
    >
      {/* Viewfinder: warm night road under a soft radial headlight */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_62%_at_50%_34%,#33291E_0%,#1B1712_46%,#100E0A_100%)]" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/assets/Screens/camera-road.svg"
        alt=""
        draggable={false}
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* Detection reticle locked on a crack */}
      <div className="sc-anim absolute left-[139px] top-[385px] h-[131px] w-[121px]">
        <span className="absolute -left-0.5 -top-0.5 h-5 w-5 rounded-tl-[7px] border-l-[3px] border-t-[3px] border-primary" />
        <span className="absolute -right-0.5 -top-0.5 h-5 w-5 rounded-tr-[7px] border-r-[3px] border-t-[3px] border-primary" />
        <span className="absolute -bottom-0.5 -left-0.5 h-5 w-5 rounded-bl-[7px] border-b-[3px] border-l-[3px] border-primary" />
        <span className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-br-[7px] border-b-[3px] border-r-[3px] border-primary" />
        {/* Scan line */}
        <div className="absolute inset-x-[3px] top-1/2 h-0.5 rounded-[2px] bg-primary opacity-80 shadow-[0_0_10px_#34A8D8]" />
        {/* Classification tag */}
        <div className="absolute -top-[30px] left-[34px] flex items-center gap-1.5 rounded-[8px] bg-primary px-2.5 py-1 text-[12px] font-extrabold text-[#0E1312]">
          <LogoMark className="h-[13px] w-[13px]" />
          شرخ · ٩١٪
        </div>
      </div>

      {/* Top controls */}
      <div className="sc-anim absolute inset-x-3.5 top-[52px] z-10 flex items-center justify-between">
        <button className="flex h-10 w-10 items-center justify-center rounded-full bg-(--sv-glass) backdrop-blur-md">
          <PlusIcon className="h-[18px] w-[18px] rotate-45 text-(--sv-glass-text)" />
        </button>
        <div className="flex items-center gap-[7px] rounded-full bg-(--sv-glass) px-3.5 py-2 backdrop-blur-lg">
          <span className="h-[7px] w-[7px] animate-pulse rounded-full bg-primary" />
          <span className="text-[12.5px] font-bold text-(--sv-glass-text)">
            الكشف الذكي يعمل
          </span>
        </div>
        <button className="flex h-10 w-10 items-center justify-center rounded-full bg-(--sv-glass) backdrop-blur-md">
          <SunIcon className="h-[18px] w-[18px] text-(--sv-glass-text)" />
        </button>
      </div>

      {/* Current street */}
      <div className="sc-anim absolute inset-x-0 top-[104px] z-10 flex justify-center">
        <div className="flex items-center gap-[7px] rounded-full bg-(--sv-glass) px-[13px] py-1.5 backdrop-blur-lg">
          <PinIcon className="h-3.5 w-3.5 text-primary" />
          <span className="text-[12px] font-semibold text-(--sv-glass-text)">
            شارع عين سارة، قرب دوار ابن رشد
          </span>
        </div>
      </div>

      {/* Bottom sheet over a rising veil */}
      <div className="absolute inset-x-0 bottom-0 z-10 bg-[linear-gradient(to_top,rgba(var(--sv-veil),0.96)_30%,rgba(var(--sv-veil),0.6)_62%,transparent)] px-[18px] pb-9 pt-[38px]">
        {/* Mode switch */}
        <div className="sc-anim mb-5 flex justify-center">
          <div className="flex gap-[3px] rounded-full border border-(--sv-glass-line) bg-(--sv-glass) p-1 backdrop-blur-lg">
            <button className="flex items-center gap-[7px] rounded-full bg-primary px-5 py-[9px] text-[13.5px] font-extrabold text-[#0E1312]">
              <CameraIcon className="h-[17px] w-[17px]" strokeWidth={2} />
              صور
            </button>
            <button className="flex items-center gap-[7px] rounded-full px-5 py-[9px] text-[13.5px] font-extrabold text-(--sv-glass-sub)">
              <RouteIcon className="h-[17px] w-[17px]" strokeWidth={2} />
              رحلة
            </button>
          </div>
        </div>

        {/* Shutter row */}
        <div className="sc-anim flex items-center justify-between px-0.5">
          <button className="flex h-[46px] w-[46px] items-center justify-center rounded-full bg-(--sv-glass) backdrop-blur-md">
            <ImageIcon className="h-[21px] w-[21px] text-(--sv-glass-text)" />
          </button>
          <button className="flex h-[78px] w-[78px] items-center justify-center rounded-full border-[5px] border-(--sv-ind)">
            <span className="h-[60px] w-[60px] rounded-full bg-(--sv-cta)" />
          </button>
          <button className="flex h-[46px] w-[46px] items-center justify-center rounded-full bg-(--sv-glass) backdrop-blur-md">
            <RecordIcon className="h-[21px] w-[21px] text-(--sv-glass-text)" />
          </button>
        </div>

        <div className="sc-anim mt-4 text-center text-[12px] font-semibold text-(--sv-glass-sub)">
          صوّر الحفرة — يمكنك التقاط عدة صور قبل الرفع
        </div>
      </div>
    </ScreenShell>
  );
}
