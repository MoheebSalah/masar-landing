// The strip runs image → video → image → video; the whole set is rendered
// twice so the CSS marquee (globals.css) can loop seamlessly at -50%.
const MEDIA = [
  { type: "image", src: "/assets/BookADemo/book 2.png" },
  { type: "video", src: "/assets/BookADemo/book 1.mp4" },
  { type: "image", src: "/assets/BookADemo/book 4.png" },
  { type: "video", src: "/assets/BookADemo/book 3.mp4" },
] as const;

export default function CTACard() {
  return (
    <section
      id="cta-card"
      className="relative mx-32 my-16 flex h-[115vh] flex-col overflow-hidden rounded-brand bg-white py-[10vh] shadow-[0_24px_48px_-32px_rgba(14,19,18,0.35)]"
    >
      {/* The section IS the card: a bit taller than the screen (115vh), with
          10vh inner paddings so the content fits one viewport and the strip
          floats clear of the card's bottom edge. */}
      {/* Upper part — the ask, centered in whatever the strip leaves */}
      <div className="flex flex-1 flex-col items-center justify-center px-20 text-center">
          <h2 className="font-heading text-heading text-text">
            الطريق إلى شوارع أفضل{" "}
            <span className="text-primary">يبدأ من هنا</span>
          </h2>
          <p className="mt-6 font-sans text-t1 leading-relaxed text-subtext">
            عرض حيّ قصير نطبّقه على واقع مدينتكم — من رصد الأضرار حتى إثبات
            الإصلاح.
          </p>
          <a
            href="#contact"
            className="mt-10 inline-block whitespace-nowrap rounded-2xl bg-primary px-12 py-5 font-sans text-t2 font-bold text-on-primary transition-all duration-300 hover:scale-105 hover:bg-primary-600"
          >
            احجز عرضاً
          </a>
      </div>

      {/* Lower part — the proof: an endless strip of the platform at
          work, bleeding to the card's side edges. dir=ltr so the physical
          right-to-left drift is unaffected by the page's RTL flow. Every
          tile shares one fixed size; object-cover fills it while keeping
          each medium's aspect. */}
      <div dir="ltr" className="shrink-0 overflow-hidden">
        <div className="cta-marquee flex w-max">
            {[...MEDIA, ...MEDIA].map((item, i) => {
              const isClone = i >= MEDIA.length;
              return item.type === "image" ? (
                <img
                  key={`${item.src}-${i}`}
                  src={item.src}
                  alt=""
                  aria-hidden={isClone || undefined}
                  className="me-4 h-80 w-xl object-cover"
                />
              ) : (
                <video
                  key={`${item.src}-${i}`}
                  src={item.src}
                  aria-hidden={isClone || undefined}
                  className="me-4 h-80 w-xl object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="metadata"
                />
              );
            })}
        </div>
      </div>
    </section>
  );
}
