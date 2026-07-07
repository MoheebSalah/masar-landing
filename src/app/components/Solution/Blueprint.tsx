// Faint construction "blueprint" line art for the Solution background.
// Each stroke has pathLength=1 so the shared .bp-line rule can draw it in
// and out on a loop (see globals.css). Negative delays desync the strokes
// so the drawing feels continuous rather than starting all at once.
export default function Blueprint() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 z-0 h-full w-full opacity-90"
      viewBox="0 0 1440 900"
      fill="none"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <g stroke="#D7E6E6" strokeWidth="1.5">
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
      </g>
    </svg>
  );
}
