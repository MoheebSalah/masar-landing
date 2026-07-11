// Faint construction "blueprint" line art for the Solution background.
// Each stroke has pathLength=1 so the shared .bp-line rule can draw it in
// and out on a loop (see globals.css). Negative delays desync the strokes
// so the drawing feels continuous rather than starting all at once.
export default function Blueprint() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 z-0 h-full w-full opacity-20"
      viewBox="0 0 1440 900"
      fill="none"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <g stroke="#9AC6D6" strokeWidth="1.75">
        {/* Top horizontal dimension line with end ticks */}
        <path
          className="bp-line [animation-delay:-0.2s]"
          pathLength={1}
          d="M120 120 V150 M120 135 H620 M620 120 V150"
        />

        {/* Left vertical dimension line with end ticks */}
        <path
          className="bp-line [animation-delay:-1.1s]"
          pathLength={1}
          d="M170 210 H200 M185 210 V620 M170 620 H200"
        />

        {/* Building outline (upper right) */}
        <path
          className="bp-line [animation-delay:-0.6s]"
          pathLength={1}
          d="M820 170 H1260 V440 H820 Z"
        />

        {/* Interior subdivisions of the building */}
        <path
          className="bp-line [animation-delay:-2.4s]"
          pathLength={1}
          d="M990 170 V440 M820 310 H1260"
        />

        {/* Column circle with cross-hair (lower left) */}
        <circle
          className="bp-line [animation-delay:-1.7s]"
          pathLength={1}
          cx="330"
          cy="470"
          r="80"
        />
        <path
          className="bp-line [animation-delay:-3.1s]"
          pathLength={1}
          d="M330 370 V570 M230 470 H430"
        />

        {/* Door-swing arc */}
        <path
          className="bp-line [animation-delay:-2.9s]"
          pathLength={1}
          d="M1060 640 A160 160 0 0 1 900 800 M1060 640 V800 H900"
        />

        {/* Diagonal measurement line */}
        <path
          className="bp-line [animation-delay:-3.8s]"
          pathLength={1}
          d="M560 690 L840 540"
        />

        {/* Small grid cluster (lower center-right) */}
        <path
          className="bp-line [animation-delay:-4.3s]"
          pathLength={1}
          d="M1120 560 H1300 M1120 620 H1300 M1120 680 H1300 M1120 560 V680 M1180 560 V680 M1240 560 V680 M1300 560 V680"
        />

        {/* Center cross mark */}
        <path
          className="bp-line [animation-delay:-5.0s]"
          pathLength={1}
          d="M700 60 V120 M670 90 H730"
        />

        {/* Lower rectangle outline */}
        <path
          className="bp-line [animation-delay:-4.6s]"
          pathLength={1}
          d="M120 700 H470 V830 H120 Z"
        />

        {/* Right vertical dimension line with end ticks */}
        <path
          className="bp-line [animation-delay:-0.9s]"
          pathLength={1}
          d="M1300 210 H1330 M1315 210 V520 M1300 520 H1330"
        />

        {/* Second column circle with cross-hair (upper center) */}
        <circle
          className="bp-line [animation-delay:-2.2s]"
          pathLength={1}
          cx="720"
          cy="300"
          r="55"
        />
        <path
          className="bp-line [animation-delay:-3.5s]"
          pathLength={1}
          d="M720 230 V370 M650 300 H790"
        />

        {/* Corner brace arc (upper left) */}
        <path
          className="bp-line [animation-delay:-1.4s]"
          pathLength={1}
          d="M300 60 A120 120 0 0 1 180 180"
        />

        {/* Stepped section detail (mid left) */}
        <path
          className="bp-line [animation-delay:-2.7s]"
          pathLength={1}
          d="M60 400 H110 V450 H160 V500 H210 V550"
        />

        {/* Small grid cluster (upper right corner) */}
        <path
          className="bp-line [animation-delay:-3.3s]"
          pathLength={1}
          d="M1320 40 H1420 M1320 90 H1420 M1320 140 H1420 M1320 40 V140 M1370 40 V140 M1420 40 V140"
        />

        {/* Angled dimension line with ticks (lower right) */}
        <path
          className="bp-line [animation-delay:-4.9s]"
          pathLength={1}
          d="M980 860 L1240 720 M980 850 L985 872 M1240 710 L1245 732"
        />

        {/* Diamond / rotated square (center) */}
        <path
          className="bp-line [animation-delay:-5.4s]"
          pathLength={1}
          d="M540 200 L610 270 L540 340 L470 270 Z"
        />

        {/* Long horizontal dimension line (bottom) */}
        <path
          className="bp-line [animation-delay:-3.9s]"
          pathLength={1}
          d="M560 850 V880 M560 865 H900 M900 850 V880"
        />

        {/* Concentric target detail (lower center) */}
        <circle
          className="bp-line [animation-delay:-5.7s]"
          pathLength={1}
          cx="740"
          cy="700"
          r="45"
        />
        <circle
          className="bp-line [animation-delay:-6.1s]"
          pathLength={1}
          cx="740"
          cy="700"
          r="22"
        />
      </g>
    </svg>
  );
}
