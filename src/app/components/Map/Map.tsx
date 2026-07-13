"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function Map() {
  const mapWrapRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playedRef = useRef(false);

  useEffect(() => {
    const iframe = iframeRef.current;
    const mapWrap = mapWrapRef.current;
    if (!iframe || !mapWrap) return;

    const post = (msg: Record<string, unknown>) =>
      iframe.contentWindow?.postMessage(msg, "*");

    // Fire the intro exactly once, the first time the pinned map reaches the
    // centre of the viewport. The map itself owns the zoom + dot animation, so
    // nothing here is tied to continued scrolling.
    const play = () => {
      if (playedRef.current) return;
      playedRef.current = true;
      post({ type: "masar-play" });
    };

    // If the section is centred before the map iframe finishes booting, the map
    // replays this handshake so the intro still fires once it's ready.
    const onMessage = (e: MessageEvent) => {
      if (e.source !== iframe.contentWindow) return;
      if ((e.data as { type?: string })?.type === "masar-ready" && playedRef.current) {
        post({ type: "masar-play" });
      }
    };
    window.addEventListener("message", onMessage);

    // Fire the intro when the map reaches the centre of the viewport. The map
    // owns its own zoom + dot animation, so there's nothing to scrub — pinning
    // here would just add a stretch of dead scroll, so we don't.
    const st = ScrollTrigger.create({
      trigger: mapWrap,
      start: "center center",
      onEnter: play,
      onEnterBack: play,
    });

    return () => {
      window.removeEventListener("message", onMessage);
      st.kill();
    };
  }, []);

  return (
    <section
      id="map-section"
      className="w-full bg-background px-8 py-24 md:px-16 lg:px-32"
    >
      <div className="mb-10 text-center">
        <h2 className="font-heading text-heading text-text">خريطة الحُفر</h2>
        <p className="mx-auto mt-4 max-w-xl font-sans text-t2 text-subtext">
          كل حفرة على الخريطة بلاغ حقيقي — تنقّل بين شوارع الخليل كما يراها التطبيق.
        </p>
      </div>

      <div
        ref={mapWrapRef}
        className="h-[90vh] w-full overflow-hidden rounded-brand shadow-[0_14px_34px_rgba(14,19,18,0.14)]"
      >
        <iframe
          ref={iframeRef}
          src="/masar-map.html"
          title="خريطة مسار للحُفر في الخليل"
          className="block h-full w-full border-0"
        />
      </div>
    </section>
  );
}
