import ScreenShell from "./ScreenShell";
import { CheckIcon, LogoMark, PinIcon } from "../Icons";

type Props = { dark: boolean };

// تسجيل الرحلة — live trip recording over a full-bleed map. Only a dark
// export exists; the light variant applies the same token mapping as the
// home/trips screens (light map art + light glass chrome).
export default function RecordScreen({ dark }: Props) {
  return (
    <ScreenShell className="bg-(--sv-mapbg)">
      {/* Map background with a readability veil */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={dark ? "/assets/Screens/map-dark.svg" : "/assets/Screens/map-light.svg"}
        alt=""
        draggable={false}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(var(--sv-veil),0.4),rgba(var(--sv-veil),0.05)_30%,rgba(var(--sv-veil),0.75))]" />

      {/* Recording status pill */}
      <div className="sc-anim absolute inset-x-4 top-[54px] flex items-center gap-2.5 rounded-[16px] border border-primary/26 bg-(--sv-glass-strong) px-4 py-3 backdrop-blur-lg">
        <span className="h-[11px] w-[11px] animate-pulse rounded-full bg-primary shadow-[0_0_10px_#34A8D8]" />
        <span className="text-[14.5px] font-extrabold text-(--sv-glass-text)">
          جارٍ تسجيل الرحلة
        </span>
        <span className="ms-auto text-[17px] font-extrabold text-(--sv-glass-text)">
          ٤٠:٥١
        </span>
      </div>

      {/* Active tracking chip */}
      <div className="sc-anim absolute right-4 top-[108px] flex items-center gap-[7px] rounded-full bg-(--sv-glass) px-3 py-[7px] backdrop-blur-lg">
        <PinIcon className="h-[15px] w-[15px] text-primary" />
        <span className="text-[12px] font-bold text-(--sv-glass-text)">
          شارع عين سارة · تتبّع نشط
        </span>
      </div>

      {/* Auto-detection toast */}
      <div className="sc-anim absolute inset-x-5 top-[168px] flex items-center gap-3 rounded-[16px] bg-white px-[15px] py-[13px] shadow-[0_16px_36px_rgba(0,0,0,0.32)]">
        <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[12px] bg-[#D9EEF8]">
          <LogoMark className="h-[22px] w-[22px] text-[#1C6F92]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-extrabold text-[#0E1312]">
            حفرة مكتشفة تلقائيًا
          </div>
          <div className="text-[12px] text-[#6E6A61]">
            خطورة عالية · ثقة ٩٣٪ · سُجّلت في المسار
          </div>
        </div>
        <CheckIcon className="h-[22px] w-[22px] shrink-0 text-success" />
      </div>

      {/* Bottom panel: live stats + end trip */}
      <div className="absolute inset-x-0 bottom-0 px-[18px] pb-10 pt-[22px]">
        <div className="mb-[18px] flex gap-2">
          <div className="sc-anim flex-1 rounded-[15px] border border-(--sv-glass-line) bg-(--sv-tile) px-1.5 py-3 text-center backdrop-blur-lg">
            <div className="text-[19px] font-extrabold text-(--sv-glass-text)">
              ٣
            </div>
            <div className="mt-0.5 text-[10.5px] text-(--sv-glass-sub)">
              حُفر
            </div>
          </div>
          <div className="sc-anim flex-1 rounded-[15px] border border-(--sv-glass-line) bg-(--sv-tile) px-1.5 py-3 text-center backdrop-blur-lg">
            <div className="text-[19px] font-extrabold text-(--sv-glass-text)">
              ٢.١ كم
            </div>
            <div className="mt-0.5 text-[10.5px] text-(--sv-glass-sub)">
              المسافة
            </div>
          </div>
          <div className="sc-anim flex-1 rounded-[15px] border border-(--sv-glass-line) bg-(--sv-tile) px-1.5 py-3 text-center backdrop-blur-lg">
            <div className="text-[19px] font-extrabold text-(--sv-glass-text)">
              ٤٢
            </div>
            <div className="mt-0.5 text-[10.5px] text-(--sv-glass-sub)">
              كم/س
            </div>
          </div>
        </div>

        <button className="sc-anim flex w-full items-center justify-center gap-2.5 rounded-[18px] bg-(--sv-cta) p-[17px] text-[16px] font-extrabold text-(--sv-cta-text)">
          <span className="h-[15px] w-[15px] rounded-[4px] bg-primary" />
          إنهاء الرحلة وحفظها
        </button>
      </div>
    </ScreenShell>
  );
}
