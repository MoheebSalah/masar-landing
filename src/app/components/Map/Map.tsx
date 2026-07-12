export default function Map() {
  return (
    <section id="map" className="w-full bg-background px-8 py-32">
      {/* Section heading */}
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="font-heading text-h2 text-text">خريطة الحُفر</h2>
        <p className="mx-auto mt-4 max-w-xl font-sans text-t2 text-subtext">
          استعرض الحُفر المُبلَّغ عنها على خريطة المدينة كما تظهر داخل التطبيق.
        </p>
      </div>

      {/* Embedded MapLibre map (served statically from /public) */}
      <div className="mx-auto mt-12 max-w-6xl overflow-hidden rounded-brand shadow-[0_14px_34px_rgba(14,19,18,0.14)]">
        <iframe
          src="/masar-map.html"
          title="خريطة مسار للحُفر في الخليل"
          loading="lazy"
          className="block h-[720px] w-full border-0"
        />
      </div>
    </section>
  );
}
