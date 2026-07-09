import ScreenShell from "./ScreenShell";
import BottomNav from "./BottomNav";
import {
  ArrowOutIcon,
  BellIcon,
  CameraIcon,
  CheckIcon,
  LogoMark,
  MapIcon,
  RouteIcon,
  TrendUpIcon,
} from "../Icons";

type Props = { dark: boolean };

// الواجهة الرئيسية — rebuilt from the design export at its native 402×874.
export default function HomeScreen({ dark }: Props) {
  return (
    <ScreenShell>
      <div className="px-4 pt-[54px]">
        {/* Header: logo, greeting, notifications */}
        <div className="sc-anim flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[11.6px] bg-primary">
            <LogoMark className="h-10 w-10 text-[#0E1312]" />
          </div>
          <div className="flex-1">
            <div className="text-[12.5px] leading-[14px] text-(--sv-sub)">
              صباح الخير،
            </div>
            <div className="mt-0.5 text-[16.5px] font-extrabold leading-[18px] text-(--sv-text)">
              سارة عوض
            </div>
          </div>
          <div className="relative flex h-[42px] w-[42px] items-center justify-center rounded-full border border-(--sv-line) bg-(--sv-card)">
            <BellIcon className="h-5 w-5 text-(--sv-text)" />
            <span className="absolute right-[10px] top-[9px] h-2 w-2 rounded-full border-2 border-(--sv-card) bg-primary" />
          </div>
        </div>

        <div className="mt-[18px] flex flex-col gap-3">
          {/* Hero card: start a recording trip */}
          <div className="sc-anim relative h-51 overflow-hidden rounded-[26px] bg-primary p-[22px]">
            <LogoMark className="absolute -bottom-[63px] -left-[92px] h-[330px] w-[330px] text-[#0E1312]/13" />
            <div className="relative">
              <div className="inline-flex items-center gap-[7px] rounded-full bg-[#0E1312]/10 px-3 py-1.5 text-[11.5px] font-extrabold tracking-[0.6px] text-[#0E1312]">
                <span className="h-2 w-2 rounded-[2px] bg-[#0E1312]" />
                تسجيل رحلة
              </div>
              <div className="mt-4 text-[27px] font-extrabold leading-[34px] text-[#0E1312]">
                قُد فقط — الكاميرا
                <br />
                تكشف الحُفر تلقائيًا
              </div>
            </div>
            <div className="absolute bottom-5 right-[22px] flex items-center gap-[11px]">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0E1312]">
                <ArrowOutIcon className="h-6 w-6 text-primary" />
              </div>
              <span className="text-[13px] font-bold tracking-[0.2px] text-[#0E1312]">
                ابدأ الآن
              </span>
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex gap-3">
            <div className="sc-anim flex-1 rounded-[18px] border border-(--sv-line) bg-(--sv-card) p-3.5">
              <div className="flex h-[38px] w-[38px] items-center justify-center rounded-[11px]">
                <CameraIcon className="h-5 w-5 text-primary" />
              </div>
              <div className="mt-[11px] text-[14.5px] font-extrabold text-(--sv-text)">
                بلاغ سريع
              </div>
              <div className="mt-px text-[11.5px] text-(--sv-sub)">
                صورة واحدة
              </div>
            </div>
            <div className="sc-anim flex-1 rounded-[18px] border border-(--sv-line) bg-(--sv-card) p-3.5">
              <div className="flex h-[38px] w-[38px] items-center justify-center rounded-[11px]">
                <MapIcon className="h-5 w-5 text-primary" />
              </div>
              <div className="mt-[11px] text-[14.5px] font-extrabold text-(--sv-text)">
                الخريطة
              </div>
              <div className="mt-px text-[11.5px] text-(--sv-sub)">
                قرب موقعي
              </div>
            </div>
          </div>

          {/* Nearby potholes map card */}
          <div className="sc-anim relative h-[150px] overflow-hidden rounded-[22px] border border-(--sv-line) bg-(--sv-mapbg)">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={dark ? "/assets/Screens/map-dark.svg" : "/assets/Screens/map-light.svg"}
              alt=""
              draggable={false}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 h-[104px] bg-linear-to-t from-(--sv-mapveil) to-transparent" />
            <div className="absolute inset-x-[15px] bottom-[13px] flex items-end justify-between">
              <div>
                <div className="text-[11px] font-extrabold tracking-[1px] text-primary">
                  قريب منك
                </div>
                <div className="mt-1 text-[17.5px] font-extrabold text-white">
                  ٣ حُفر على طريقك
                </div>
              </div>
              <div className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-white/18">
                <ArrowOutIcon className="h-[21px] w-[21px] text-white" />
              </div>
            </div>
          </div>

          {/* Monthly impact */}
          <div className="sc-anim mt-[10px] flex items-center">
            <span className="text-[18px] font-extrabold text-(--sv-text)">
              أثرك هذا الشهر
            </span>
            <span className="ms-auto text-[12.5px] font-bold text-(--sv-link)">
              التفاصيل
            </span>
          </div>

          <div className="sc-anim relative overflow-hidden rounded-[22px] border border-(--sv-line) bg-(--sv-card) p-[18px]">
            <LogoMark className="absolute -bottom-[42px] -left-[31px] h-[140px] w-[140px] text-primary/9" />
            <div className="relative">
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-[12.5px] font-semibold text-(--sv-sub)">
                    تم إصلاحها بمساهمتك
                  </div>
                  <div className="mt-[7px] flex items-baseline gap-[7px]">
                    <span className="text-[40px] font-extrabold leading-[40px] tracking-[-1px] text-(--sv-text)">
                      ٢١
                    </span>
                    <span className="text-[14.5px] font-bold text-(--sv-sub)">
                      من ٣٤ بلاغًا
                    </span>
                  </div>
                </div>
                <span className="flex items-center gap-1.5 rounded-full bg-(--sv-oksoft) px-[11px] py-[5px] text-[12px] font-bold text-success">
                  <TrendUpIcon className="h-[13px] w-[13px]" />
                  +٣ هذا الأسبوع
                </span>
              </div>
              <div className="mt-4 h-[9px] overflow-hidden rounded-full border border-(--sv-line) bg-(--sv-track)">
                <div className="h-full w-[62%] rounded-full bg-primary" />
              </div>
              <div className="mt-[13px] flex items-center gap-3 text-[12.5px] font-semibold text-(--sv-sub)">
                <span className="flex items-center gap-1.5">
                  <RouteIcon className="h-[15px] w-[15px] text-(--sv-faint)" />
                  ٤.٨ كم مُغطاة
                </span>
                <span className="h-1 w-1 rounded-full bg-(--sv-faint)" />
                <span className="flex items-center gap-1.5">
                  <CheckIcon className="h-[15px] w-[15px] text-(--sv-faint)" strokeWidth={2.2} />
                  ٢١ مُوثّقة
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BottomNav active="home" />
    </ScreenShell>
  );
}
