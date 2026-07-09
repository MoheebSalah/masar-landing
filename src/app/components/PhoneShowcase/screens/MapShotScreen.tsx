type Props = {
  dark: boolean;
  // Base asset path without the theme suffix, e.g. "/assets/Screens/map-screen-1".
  src: string;
};

// The two map screens only exist as full screenshots (they already include
// their own iOS chrome), so they render as plain images — one per theme —
// and are excluded from the per-component appearance animation.
export default function MapShotScreen({ dark, src }: Props) {
  return (
    <div className="relative h-[874px] w-[402px] overflow-hidden bg-(--sv-bg)">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${src}-${dark ? "dark" : "light"}.png`}
        alt=""
        draggable={false}
        className="h-full w-full select-none object-cover object-top"
      />
    </div>
  );
}
