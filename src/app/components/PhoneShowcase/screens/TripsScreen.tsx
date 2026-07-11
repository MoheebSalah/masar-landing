import ScreenShell from "./ScreenShell";
import BottomNav from "./BottomNav";
import {
  ArrowOutIcon,
  CalendarIcon,
  CheckIcon,
  ChevronStartIcon,
  ClockIcon,
  LogoMark,
  RouteIcon,
} from "../Icons";

type Props = { dark: boolean };

type TripCardProps = {
  dark: boolean;
  title: string;
  area: string;
  time: string;
  distance: string;
  status: "documented" | "repairing" | "reviewing" | "clean";
  statusLabel: string;
  potholes?: string;
};

// One entry in the trips log. The status chip and the footer change with the
// trip's lifecycle; a pothole-free trip gets the clean-road thumbnail.
function TripCard({
  dark,
  title,
  area,
  time,
  distance,
  status,
  statusLabel,
  potholes,
}: TripCardProps) {
  const thumb =
    status === "clean"
      ? `/assets/Screens/trip-clean-${dark ? "dark" : "light"}.svg`
      : `/assets/Screens/trip-thumb-${dark ? "dark" : "light"}.svg`;

  return (
    <div className="sc-anim flex gap-3 overflow-hidden rounded-[20px] border border-(--sv-line) bg-(--sv-card) p-3">
      {/* Map thumbnail */}
      <div className="relative h-[133px] w-[92px] shrink-0 overflow-hidden rounded-[15px] bg-(--sv-mapbg)">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={thumb} alt="" draggable={false} className="h-full w-full object-cover" />
        <div className="absolute left-[7px] top-[7px] flex h-[26px] w-[26px] items-center justify-center rounded-[9px] bg-[#0E1312]/72 backdrop-blur-sm">
          <RouteIcon className="h-[15px] w-[15px] text-white" strokeWidth={2} />
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <div className="truncate text-[15px] font-extrabold text-(--sv-text)">
              {title}
            </div>
            <div className="mt-0.5 truncate text-[12px] text-(--sv-sub)">
              {area}
            </div>
          </div>
          {status === "documented" || status === "clean" ? (
            <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-(--sv-oksoft) px-[11px] py-[5px] text-[12px] font-bold text-success">
              <CheckIcon className="h-[13px] w-[13px]" />
              {statusLabel}
            </span>
          ) : status === "repairing" ? (
            <span className="flex shrink-0 items-center rounded-full bg-(--sv-primsoft) px-[11px] py-[5px] text-[12px] font-bold text-(--sv-link)">
              {statusLabel}
            </span>
          ) : (
            <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-(--sv-track) px-[11px] py-[5px] text-[12px] font-bold text-(--sv-sub)">
              <span className="h-[7px] w-[7px] rounded-full bg-(--sv-faint)" />
              {statusLabel}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 pt-3 text-[12.5px] font-semibold text-(--sv-sub)">
          <span className="flex items-center gap-[5px]">
            <ClockIcon className="h-[15px] w-[15px] text-(--sv-faint)" />
            {time}
          </span>
          <span className="flex items-center gap-[5px]">
            <RouteIcon className="h-[15px] w-[15px] text-(--sv-faint)" />
            {distance}
          </span>
        </div>

        <div className="my-2.5 h-px bg-(--sv-line)" />

        <div className="flex items-center justify-between">
          {status === "clean" ? (
            <span className="text-[12.5px] font-bold text-success">
              طريق نظيف · لا حُفر
            </span>
          ) : (
            <span className="flex items-center gap-[7px] text-[12.5px] font-bold text-(--sv-text)">
              <span className="flex h-[22px] w-[22px] items-center justify-center rounded-[7px] bg-(--sv-primsoft)">
                <LogoMark className="h-3.5 w-3.5 text-primary" />
              </span>
              {potholes}
            </span>
          )}
          <span className="flex items-center gap-1 text-[12.5px] font-bold text-(--sv-link)">
            التفاصيل
            <ChevronStartIcon className="h-[15px] w-[15px]" />
          </span>
        </div>
      </div>
    </div>
  );
}

// رحلاتي — the trips log, rebuilt from the design export at 402×874.
export default function TripsScreen({ dark }: Props) {
  return (
    <ScreenShell>
      <div className="px-4 pt-[54px]">
        {/* Header */}
        <div className="sc-anim flex items-center gap-3">
          <div className="flex-1">
            <div className="text-[27px] font-extrabold leading-[27px] tracking-[-0.5px] text-(--sv-text)">
              رحلاتي
            </div>
            <div className="mt-1.5 text-[13px] text-(--sv-sub)">
              سجلّ الطرق التي مسحتها
            </div>
          </div>
          <div className="flex h-[42px] w-[42px] items-center justify-center rounded-full border border-(--sv-line) bg-(--sv-card)">
            <CalendarIcon className="h-5 w-5 text-(--sv-text)" />
          </div>
        </div>

        {/* Last trip hero card */}
        <div className="sc-anim relative mt-[18px] h-[176px] overflow-hidden rounded-[24px] border border-(--sv-line) bg-(--sv-mapbg)">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={dark ? "/assets/Screens/map-dark.svg" : "/assets/Screens/map-light.svg"}
            alt=""
            draggable={false}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 h-[136px] bg-linear-to-t from-(--sv-mapveil) to-transparent" />
          <div className="absolute right-[13px] top-[13px] flex items-center gap-1.5 rounded-full bg-[#0E1312]/70 px-[11px] py-1.5 text-[11.5px] font-extrabold text-white backdrop-blur-sm">
            <span className="h-[7px] w-[7px] rounded-full bg-primary" />
            آخر رحلة
          </div>
          <div className="absolute inset-x-4 bottom-[15px] flex items-end justify-between">
            <div>
              <div className="text-[19px] font-extrabold text-white">
                شارع عين سارة
              </div>
              <div className="mt-[3px] text-[12.5px] text-white/78">
                اليوم ٩:٤١ ص · ٣.٢ كم · ٦ حُفر مكتشفة
              </div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
              <ArrowOutIcon className="h-[22px] w-[22px] text-[#0E1312]" />
            </div>
          </div>
        </div>

        {/* Totals strip */}
        <div className="sc-anim relative mt-3 flex items-center justify-between overflow-hidden rounded-[20px] border border-(--sv-line) bg-(--sv-card) px-[18px] py-4">
          <LogoMark className="absolute -left-[25px] top-1.5 h-28 w-28 text-primary/9" />
          <div className="relative text-center">
            <div className="text-[34px] font-extrabold leading-[34px] tracking-[-0.5px] text-(--sv-text)">
              ١٢
            </div>
            <div className="mt-1.5 text-[12.5px] font-semibold leading-[12.5px] text-(--sv-sub)">
              رحلة
            </div>
          </div>
          <div className="h-9 w-px bg-(--sv-line)" />
          <div className="relative text-center">
            <div className="text-[34px] font-extrabold leading-[34px] tracking-[-0.5px] text-(--sv-text)">
              ٢٨.٤
            </div>
            <div className="mt-1.5 text-[12.5px] font-semibold leading-[12.5px] text-(--sv-sub)">
              كم مُغطاة
            </div>
          </div>
          <div className="h-9 w-px bg-(--sv-line)" />
          <div className="relative text-center">
            <div className="text-[34px] font-extrabold leading-[34px] tracking-[-0.5px] text-primary">
              ٣٤
            </div>
            <div className="mt-1.5 text-[12.5px] font-semibold leading-[12.5px] text-(--sv-sub)">
              حُفر
            </div>
          </div>
        </div>

        {/* Period filters */}
        <div className="sc-anim mt-5 flex gap-2">
          <button className="rounded-full bg-(--sv-primsoft) px-4 py-[9px] text-[13px] font-extrabold text-(--sv-link)">
            الكل
          </button>
          <button className="rounded-full bg-(--sv-card) px-4 py-[9px] text-[13px] font-extrabold text-(--sv-sub) shadow-[inset_0_0_0_1px_var(--sv-line)]">
            هذا الأسبوع
          </button>
          <button className="rounded-full bg-(--sv-card) px-4 py-[9px] text-[13px] font-extrabold text-(--sv-sub) shadow-[inset_0_0_0_1px_var(--sv-line)]">
            هذا الشهر
          </button>
        </div>

        {/* Log header */}
        <div className="sc-anim mb-3 mt-5 flex items-center">
          <span className="text-[15px] font-extrabold text-(--sv-text)">
            الرحلات السابقة
          </span>
          <span className="ms-auto text-[12.5px] font-bold text-(--sv-sub)">
            5 رحلة
          </span>
        </div>

        {/* Trips log — the screen crops past the second card like a real feed */}
        <div className="flex flex-col gap-3">
          <TripCard
            dark={dark}
            title="شارع عين سارة"
            area="قرب دوار ابن رشد"
            time="اليوم"
            distance="٣.٢ كم"
            status="documented"
            statusLabel="مُوثّقة"
            potholes="6 حُفر مكتشفة"
          />
          <TripCard
            dark={dark}
            title="شارع وادي التفاح"
            area="وادي التفاح"
            time="أمس"
            distance="٢.٧ كم"
            status="repairing"
            statusLabel="قيد الإصلاح"
            potholes="4 حُفر مكتشفة"
          />
          <TripCard
            dark={dark}
            title="شارع الملك فيصل"
            area="عين سارة"
            time="٣ أيام"
            distance="١.٩ كم"
            status="reviewing"
            statusLabel="قيد المراجعة"
            potholes="3 حُفر مكتشفة"
          />
          <TripCard
            dark={dark}
            title="طريق حلحول"
            area="رأس الجورة"
            time="الأسبوع الماضي"
            distance="٤.١ كم"
            status="clean"
            statusLabel="بلا حُفر"
          />
        </div>
      </div>

      <BottomNav active="trips" />
    </ScreenShell>
  );
}
