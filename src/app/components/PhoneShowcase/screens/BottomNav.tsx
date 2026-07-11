import { GridIcon, MapIcon, PersonIcon, RouteIcon } from "../Icons";

type Props = {
  active: "home" | "trips";
};

// The app's floating tab bar. The active tab is a filled pill with a label;
// the rest are bare icons.
export default function BottomNav({ active }: Props) {
  return (
    <div className="sc-anim absolute inset-x-[18px] bottom-0 z-30">
      <div className="flex items-center gap-1 rounded-t-[28px] border-t border-(--sv-line) bg-(--sv-nav) px-2.5 pb-6 pt-[11px] shadow-[0_-10px_30px_rgba(14,19,18,0.12)]">
        {active === "home" ? (
          <div className="flex h-[46px] items-center justify-center gap-2 rounded-full bg-(--sv-primsoft) px-[18px]">
            <GridIcon className="h-[21px] w-[21px] text-primary" />
            <span className="text-[13px] font-extrabold text-primary">
              الرئيسية
            </span>
          </div>
        ) : (
          <div className="flex h-[46px] flex-1 items-center justify-center">
            <GridIcon className="h-[21px] w-[21px] text-(--sv-faint)" />
          </div>
        )}

        <div className="flex h-[46px] flex-1 items-center justify-center">
          <MapIcon className="h-[21px] w-[21px] text-(--sv-faint)" strokeWidth={1.8} />
        </div>

        {active === "trips" ? (
          <div className="flex h-[46px] items-center justify-center gap-2 rounded-full bg-(--sv-primsoft) px-[18px]">
            <RouteIcon className="h-[21px] w-[21px] text-primary" strokeWidth={2.2} />
            <span className="text-[13px] font-extrabold text-primary">
              رحلاتي
            </span>
          </div>
        ) : (
          <div className="flex h-[46px] flex-1 items-center justify-center">
            <RouteIcon className="h-[21px] w-[21px] text-(--sv-faint)" strokeWidth={1.8} />
          </div>
        )}

        <div className="flex h-[46px] flex-1 items-center justify-center">
          <PersonIcon className="h-[21px] w-[21px] text-(--sv-faint)" />
        </div>
      </div>
    </div>
  );
}
