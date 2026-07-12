import StatRow from "./StatRow";
import ImpactHeading from "./ImpactHeading";

// The four headline numbers, in scroll order. `reversed` alternates which side
// the number sits on so the rows zig-zag down the page.
const STATS = [
  {
    lines: ["حفرة", "تم رصدها"] as [string, string],
    prefix: "+",
    value: 5400,
    reversed: false,
  },
  {
    lines: ["انخفض", "وقت الاستجابة"] as [string, string],
    prefix: "-",
    value: 60,
    suffix: "%",
    reversed: true,
  },
  {
    lines: ["حالة", "تم إصلاحها"] as [string, string],
    prefix: "+",
    value: 3200,
    reversed: false,
  },
  {
    lines: ["من المواطنين", "تم إشعارهم"] as [string, string],
    prefix: "+",
    value: 90,
    suffix: "%",
    reversed: true,
  },
];

export default function Impact() {
  return (
    <section id="impact" className="w-full bg-background px-32 py-32">
      {/* Section heading — colored heavy line over a thin dark line */}
      <ImpactHeading />

      {/* Alternating rows with a hairline divider between each */}
      <div className="mx-auto mt-24 max-w-6xl">
        {STATS.map((stat, index) => (
          <div key={stat.lines.join(" ")}>
            {index > 0 && <div className="h-px w-full bg-muted/50" />}
            <StatRow
              lines={stat.lines}
              value={stat.value}
              prefix={stat.prefix}
              suffix={stat.suffix}
              reversed={stat.reversed}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
