export default function Hero() {
  return (
    <section className="relative min-h-screen w-full overflow-hidden">
      {/* Background video */}
      <video
        className="absolute inset-0 h-full w-full object-cover"
        src="/assets/HeroVideo.mp4"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
      />

      {/* Readability overlay: darker toward the bottom-right where the text sits */}
      <div className="absolute inset-0 bg-linear-to-tl from-dark/80 via-dark/40 to-transparent" />

      {/* Small primary gradient rising from the bottom */}
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-primary/45 to-transparent" />

      {/* Content — pinned to the bottom-right (start side in RTL) */}
      <div className="relative z-10 flex min-h-screen flex-col justify-end items-start px-8 pb-12 md:px-16 md:pb-16 lg:px-32 lg:pb-24">
        <div className="max-w-4xl text-right">
          <h1 className="font-heading font-semibold text-[3.25rem] leading-[1.12] text-text-dark md:text-[5.5rem] lg:text-[7rem]">
            <span className="block">من الحفرة إلى الإصلاح</span>
            <span className="block">
              <span className="text-primary">مسار</span> واضح
            </span>
          </h1>
          <p className="mt-8 max-w-2xl font-sans text-t3 font-light leading-relaxed text-subtext-dark md:mt-10 md:text-t2 lg:text-t1">
            <span className="block">منصّة ذكية ترصد أضرار الطرق تلقائيًا</span>
            <span className="block text-primary">وتحوّلها إلى خطة إصلاح مُنظّمة وقابلة للمتابعة.</span>
          </p>
        </div>
      </div>
    </section>
  );
}
