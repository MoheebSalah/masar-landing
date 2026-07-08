import TextCard from "./TextCard";
import MediaCard from "./MediaCard";
import {
  MapIcon,
  LocationIcon,
  BellIcon,
  DevicesIcon,
  ScanIcon,
} from "./Icons";

export default function Bento() {
  return (
    <section
      id="capabilities"
      className="w-full bg-background px-8 py-16 md:px-16 lg:px-32"
    >
      {/* Section heading */}
      <div className="mb-10 text-center">
        <h2 className="font-heading text-heading text-text">القدرات الأساسية</h2>
        <p className="mx-auto mt-4 max-w-xl font-sans text-t2 text-subtext">
          منظومة متكاملة ترصد أضرار الطرق وتُحوّلها إلى إجراء واضح.
        </p>
      </div>

      {/* Bento grid — mirrored for RTL: the live map sits on the start (right) side */}
      <div className="grid h-screen grid-cols-12 grid-rows-3 gap-4">
        {/* 1 — Live reports map (main) */}
        <MediaCard
          title="خريطة حية للتقارير"
          icon={<MapIcon className="h-7 w-7" />}
          className="col-span-8 col-start-5 row-span-2 row-start-1"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/Bento/map.png"
            alt="خريطة حية لتقارير أضرار الطرق"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </MediaCard>

        {/* 2 — Location & severity */}
        <TextCard
          title="تحديد الموقع والخطورة"
          description="يحدّد مسار موقع كل حفرة بدقة على الخريطة ويقدّر درجة خطورتها فور رصدها."
          icon={<LocationIcon className="h-8 w-8" />}
          className="col-span-4 col-start-1 row-start-1"
        />

        {/* 3 — Citizen notification */}
        <TextCard
          title="المواطن يتلقى إشعاراً"
          description="يصل المواطن إشعارٌ فوري بحالة بلاغه وبكل تحديث حتى اكتمال الإصلاح."
          icon={<BellIcon className="h-8 w-8" />}
          className="col-span-4 col-start-1 row-start-2"
        />

        {/* 4 — Multi-device (primary) */}
        <TextCard
          title="تعدد الأجهزة"
          description="يعمل مسار على مختلف الأجهزة من الجوّال إلى لوحة التحكم بتجربةٍ موحّدة."
          icon={<DevicesIcon className="h-8 w-8" />}
          primary
          className="col-span-6 col-start-7 row-start-3"
        />

        {/* 5 — Automatic detection & classification (video) */}
        <MediaCard
          title="كشف وتصنيف تلقائي"
          icon={<ScanIcon className="h-7 w-7" />}
          className="col-span-6 col-start-1 row-start-3"
        >
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
        </MediaCard>
      </div>
    </section>
  );
}
