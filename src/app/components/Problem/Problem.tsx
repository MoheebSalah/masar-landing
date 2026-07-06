import ProblemCard from "./ProblemCard";
import { LostReportsIcon, NoPrioritiesIcon, NoProofIcon } from "./icons";

export default function Problem() {
  return (
    <section id="problem" className="w-full bg-background py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-6">
        {/* Header block */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="mb-4 inline-block font-sans text-t5 font-bold tracking-widest text-primary">
            المشكلة
          </span>
          <h2 className="font-heading text-h3 leading-tight text-[#111717] md:text-h2">
            الحفرة موجودة… لكن لا أحد يعرف عنها.
          </h2>
          <p className="mx-auto mt-5 text-t3 leading-relaxed text-subtext">
            تُرصد الأضرار متأخرة، وتضيع البلاغات بين المكالمات والأوراق. لا أحد
            يعرف أين المشكلة، ولا ما الذي أُصلح فعلًا — بينما تتراكم شكاوى
            المواطنين.
          </p>
        </div>

        {/* Cards */}
        <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-6">
          <ProblemCard
            icon={<LostReportsIcon className="h-10 w-10" />}
            title="بلاغات ضائعة"
            description="مكالمات وأوراق لا تصل إلى الجهة المناسبة."
          />
          <ProblemCard
            icon={<NoPrioritiesIcon className="h-10 w-10" />}
            title="لا أولويّات واضحة"
            description="لا يُعرف أيّ الأضرار الأخطر، ولا أيّها يُصلَح أولًا."
          />
          <ProblemCard
            icon={<NoProofIcon className="h-10 w-10" />}
            title="لا إثبات إنجاز"
            description="لا دليل على ما تمّ إصلاحه فعلًا."
          />
        </div>
      </div>
    </section>
  );
}
