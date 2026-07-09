import { BatteryIcon, SignalIcon, WifiIcon } from "../Icons";

type Props = {
  children: React.ReactNode;
  // Screen background; camera/record screens paint their own full-bleed art.
  className?: string;
  // iOS chrome colour. Screens with photographic backgrounds keep it white
  // regardless of theme; the rest follow the theme variable.
  statusClass?: string;
  indicatorClass?: string;
};

// The 402×874 canvas every rebuilt app screen is drawn on (the export's
// native size — PhoneFrame scales it down to fit the bezel), plus the iOS
// chrome shared by all screens: status bar and home indicator.
export default function ScreenShell({
  children,
  className = "bg-(--sv-bg)",
  statusClass = "text-(--sv-status)",
  indicatorClass = "bg-(--sv-ind)",
}: Props) {
  return (
    <div
      dir="rtl"
      className={`relative h-[874px] w-[402px] select-none overflow-hidden text-right font-sans ${className}`}
    >
      {children}

      {/* Status bar — LTR like iOS: time in the left ear, radios in the right */}
      <div
        dir="ltr"
        className={`pointer-events-none absolute inset-x-0 top-0 z-40 flex items-center justify-center gap-[154px] pt-[21px] ${statusClass}`}
      >
        <span className="w-[100px] text-center text-[17px] font-bold leading-[22px]">
          9:41
        </span>
        <div className="flex w-[100px] items-center justify-center gap-[7px]">
          <SignalIcon className="h-3 w-[19px]" />
          <WifiIcon className="h-3 w-[17px]" />
          <BatteryIcon className="h-[13px] w-[27px]" />
        </div>
      </div>

      {/* Home indicator */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40 flex justify-center pb-2">
        <div className={`h-[5px] w-[139px] rounded-full ${indicatorClass}`} />
      </div>
    </div>
  );
}
