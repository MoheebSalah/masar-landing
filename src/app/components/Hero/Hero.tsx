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

      {/* Content — pinned to the bottom-right (start side in RTL) */}
      <div className="relative z-10 flex min-h-screen flex-col justify-end items-start p-8 md:p-16 lg:p-24">
        <div className="max-w-2xl text-right">
          <h1 className="font-heading font-semibold text-h2 md:text-heading text-text-dark ">
            من الحفرة إلى الإصلاح، مسار واضح
          </h1>
          <p className="font-sans mt-6 text-t3 md:text-t2 text-subtext-dark">
            منصّة ذكية ترصد أضرار الطرق تلقائيًا وتحوّلها إلى خطة إصلاح مُنظّمة
            وقابلة للمتابعة.
          </p>
        </div>
      </div>
    </section>
  );
}
