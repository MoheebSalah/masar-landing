"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// The section heading, split out as a client component so it can carry its own
// scroll-in reveal (the stat numbers animate themselves inside StatRow).
export default function ImpactHeading() {
  const headingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const heading = headingRef.current;
    if (!heading) return;

    const ctx = gsap.context(() => {
      gsap.from(Array.from(heading.children), {
        y: 28,
        autoAlpha: 0,
        duration: 0.7,
        ease: "power3.out",
        stagger: 0.15,
        scrollTrigger: { trigger: heading, start: "top 80%", once: true },
      });
    }, heading);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={headingRef} className="mx-auto max-w-3xl text-center">
      <h2 className="text-heading leading-tight">
        <span className="block text-8xl font-heading text-primary">أرقامٌ تعكس</span>
        <span className="block font-sans font-light text-text">أثراً ملموس</span>
      </h2>
      <p className="mx-auto mt-6 max-w-2xl font-sans text-t2 text-subtext">
        أرقام تعكس التحسينات الفعلية في سرعة الاستجابة، كفاءة العمل، وجودة
        إدارة الطرق من خلال منصة موحدة ومدعومة بالبيانات.
      </p>
    </div>
  );
}
