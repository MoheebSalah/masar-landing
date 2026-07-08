export default function CTA() {
  return (
    <section id="cta" className="relative w-full bg-background py-16">
      <div className="px-32">
        <div className="relative overflow-hidden rounded-brand shadow-[0_24px_48px_-32px_rgba(14,19,18,0.35)]">
          {/* Background image with a dark overlay for text readability */}
          <img
            src="/assets/CTA.png"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 " />

          {/* Content — text on the start (right) side, button on the end (left) */}
          <div className="relative z-10 flex items-center justify-between gap-16 px-20 py-24">
            <div className="max-w-2xl">
              <h2 className="font-heading text-heading text-text-dark">
                جاهزون لرؤية مسار على شوارع مدينتكم؟
              </h2>
              <p className="mt-6 font-sans text-t1 leading-relaxed text-text-dark">
                عرض حيّ قصير نطبّقه على واقع مدينتكم — من رصد الأضرار حتى إثبات
                الإصلاح.
              </p>
            </div>

            <a
              href="#contact"
              className="shrink-0 rounded-2xl bg-white px-16 py-5 font-sans text-t2 font-bold text-text transition-colors duration-300 hover:bg-text-dark"
            >
              احجز عرضاً
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
