export default function CTA() {
  return (
    <section id="cta" className="flex w-full justify-center bg-background py-16">
      <div className="relative h-[700px] w-[1280px] overflow-hidden rounded-brand shadow-[0_24px_48px_-32px_rgba(14,19,18,0.35)]">
        {/* Street background — cover keeps the image aspect ratio while filling the frame */}
        <img
          src="/assets/CTA/street.jpg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
        />

        {/* Centered content on top of the image */}
        <div className="relative z-10 flex h-full flex-col items-center pt-12 text-center">
          <h2 className="font-heading text-heading leading-[58px] text-white">
            الطريق إلى شوارع أفضل
            <br />
            يبدأ من هنا
          </h2>

          <a
            href="#contact"
            className="mt-4 rounded-brand bg-white px-12 py-5 font-sans text-t2 font-bold text-primary transition-colors duration-300 hover:bg-background"
          >
            احجز عرضاً
          </a>
        </div>
      </div>
    </section>
  );
}
