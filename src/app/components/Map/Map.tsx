"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DesktopIcon, TabletIcon, PhoneIcon } from "./Icons";

gsap.registerPlugin(ScrollTrigger);

type Device = "desktop" | "tablet" | "phone";

// Each device's screen aspect (width / height) plus the frame + screen corner
// radii that read as that device. The bezel is constant so the body morphs
// smoothly between shapes; the stand (desktop) and notch (phone) fade in/out.
const DEVICES: Record<
  Device,
  { aspect: number; label: string; radius: number; screenRadius: number }
> = {
  desktop: { aspect: 16 / 10, label: "حاسوب", radius: 18, screenRadius: 8 },
  tablet: { aspect: 4 / 3, label: "لوحي", radius: 34, screenRadius: 22 },
  phone: { aspect: 9 / 19.5, label: "جوال", radius: 52, screenRadius: 42 },
};
const ORDER: Device[] = ["desktop", "tablet", "phone"];
const ICONS: Record<Device, (p: { className?: string }) => React.ReactElement> =
  { desktop: DesktopIcon, tablet: TabletIcon, phone: PhoneIcon };
const BEZEL = 12; // matches the p-3 padding on the device body
// Tablet / phone screen height as a fraction of the desktop's, so they read as
// smaller devices sitting next to the full-size monitor.
const REL: Record<Device, number> = { desktop: 1, tablet: 0.86, phone: 0.92 };

// The desktop is the reference: it fills the whole stage, just like the
// original full-bleed map. Tablet and phone keep their own aspect but are
// scaled down relative to the desktop's screen height.
const fitBody = (device: Device, boxW: number, boxH: number) => {
  const screenW = boxW - BEZEL * 2;
  const screenH = boxH - BEZEL * 2;
  if (device === "desktop") {
    return { w: boxW, h: boxH };
  }
  let sh = screenH * REL[device];
  let sw = sh * DEVICES[device].aspect;
  if (sw > screenW) {
    sw = screenW;
    sh = sw / DEVICES[device].aspect;
  }
  return { w: sw + BEZEL * 2, h: sh + BEZEL * 2 };
};

export default function Map() {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const standRef = useRef<HTMLDivElement>(null);
  const notchRef = useRef<HTMLDivElement>(null);
  const playedRef = useRef(false);
  // The live device for measurement (a ref so the resize handler isn't stale).
  const deviceRef = useRef<Device>("desktop");

  const [device, setDevice] = useState<Device>("desktop");
  // Locked while the map's one-shot zoom-in intro is playing.
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    const iframe = iframeRef.current;
    const stage = stageRef.current;
    const frame = frameRef.current;
    if (!iframe || !stage || !frame) return;

    // Paint the initial (desktop) frame shape and fit it to the stage.
    gsap.set(frame, { borderRadius: DEVICES.desktop.radius });
    gsap.set(screenRef.current, { borderRadius: DEVICES.desktop.screenRadius });
    gsap.set(standRef.current, { autoAlpha: 1 });
    gsap.set(notchRef.current, { autoAlpha: 0 });

    const measure = () => {
      const dims = fitBody(deviceRef.current, stage.clientWidth, stage.clientHeight);
      gsap.set(frame, { width: dims.w, height: dims.h });
    };
    measure();
    window.addEventListener("resize", measure);

    const post = (msg: Record<string, unknown>) =>
      iframe.contentWindow?.postMessage(msg, "*");

    // Fire the intro exactly once, the first time the map reaches the centre of
    // the viewport, and lock the toggle until the map says the zoom is done.
    let unlockTimer = 0;
    const play = () => {
      if (playedRef.current) return;
      playedRef.current = true;
      setAnimating(true);
      post({ type: "masar-play" });
      // Fallback in case the "masar-done" message never arrives.
      unlockTimer = window.setTimeout(() => setAnimating(false), 6000);
    };

    const onMessage = (e: MessageEvent) => {
      if (e.source !== iframe.contentWindow) return;
      const type = (e.data as { type?: string })?.type;
      // If the section is centred before the map finishes booting, it replays
      // this handshake so the intro still fires once it's ready.
      if (type === "masar-ready" && playedRef.current) post({ type: "masar-play" });
      if (type === "masar-done") {
        window.clearTimeout(unlockTimer);
        setAnimating(false);
      }
    };
    window.addEventListener("message", onMessage);

    const st = ScrollTrigger.create({
      trigger: stage,
      start: "center center",
      onEnter: play,
      onEnterBack: play,
    });

    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("message", onMessage);
      window.clearTimeout(unlockTimer);
      st.kill();
    };
  }, []);

  // Reveal on scroll: the heading + toggle rise in as the section arrives, then
  // the device (with the map inside it) fades and scales up as the stage lands.
  useEffect(() => {
    const section = sectionRef.current;
    const heading = headingRef.current;
    const toggle = toggleRef.current;
    const frame = frameRef.current;
    const stage = stageRef.current;
    if (!section || !heading || !toggle || !frame || !stage) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      const headingEls = Array.from(heading.children);
      gsap.set(headingEls, { autoAlpha: 0, y: 24 });
      gsap.set(toggle, { autoAlpha: 0, y: 20 });
      gsap.set(frame, { autoAlpha: 0, y: 60, scale: 0.94 });

      const top = gsap.timeline({
        scrollTrigger: { trigger: section, start: "top 72%", once: true },
      });
      top
        .to(headingEls, {
          autoAlpha: 1,
          y: 0,
          duration: 0.7,
          ease: "power3.out",
          stagger: 0.12,
        }, 0)
        .to(toggle, { autoAlpha: 1, y: 0, duration: 0.6, ease: "power3.out" }, 0.25);

      gsap.to(frame, {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        duration: 0.9,
        ease: "power3.out",
        scrollTrigger: { trigger: stage, start: "top 82%", once: true },
      });
    }, section);

    return () => ctx.revert();
  }, []);

  // Morph the frame to the chosen device. The iframe fills the screen, so its
  // own window resizes with it and the map re-fits automatically. Blocked while
  // the intro is playing.
  const changeDevice = (next: Device) => {
    if (next === deviceRef.current || animating) return;
    const stage = stageRef.current;
    const frame = frameRef.current;
    if (!stage || !frame) return;

    deviceRef.current = next;
    setDevice(next);

    const dims = fitBody(next, stage.clientWidth, stage.clientHeight);
    const meta = DEVICES[next];
    const ease = "power3.inOut";
    gsap.to(frame, {
      width: dims.w,
      height: dims.h,
      borderRadius: meta.radius,
      duration: 0.7,
      ease,
    });
    gsap.to(screenRef.current, {
      borderRadius: meta.screenRadius,
      duration: 0.7,
      ease,
    });
    gsap.to(standRef.current, {
      autoAlpha: next === "desktop" ? 1 : 0,
      duration: 0.35,
    });
    gsap.to(notchRef.current, {
      autoAlpha: next === "phone" ? 1 : 0,
      duration: 0.35,
    });
  };

  return (
    <section
      ref={sectionRef}
      id="map-section"
      className="w-full bg-background px-8 py-24 md:px-16 lg:px-32"
    >
      <div ref={headingRef} className="mb-8 text-center">
        <h2 className="font-heading text-heading text-text">خريطة الحُفر</h2>
        <p className="mx-auto mt-4 max-w-xl font-sans text-t2 text-subtext">
          كل حفرة على الخريطة بلاغ حقيقي — تنقّل بين شوارع الخليل كما يراها التطبيق.
        </p>
      </div>

      {/* Device toggle — desktop, tablet, phone. Disabled while the intro plays. */}
      <div ref={toggleRef} className="mb-10 flex justify-center">
        <div className="inline-flex items-center gap-1 rounded-full bg-white p-1.5 shadow-[0_12px_30px_-18px_rgba(14,19,18,0.4)]">
          {ORDER.map((dev) => {
            const Icon = ICONS[dev];
            const isActive = device === dev;
            return (
              <button
                key={dev}
                type="button"
                onClick={() => changeDevice(dev)}
                disabled={animating}
                aria-pressed={isActive}
                className={`flex items-center gap-2 rounded-full px-4 py-2 font-sans text-t4 transition-colors duration-300 ${
                  isActive
                    ? "bg-primary text-on-primary"
                    : "text-subtext hover:text-text"
                } ${animating ? "cursor-not-allowed opacity-40" : "cursor-pointer"}`}
              >
                <Icon className="h-5 w-5" />
                <span>{DEVICES[dev].label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Stage: holds the centred device; the desktop stand overflows below. */}
      <div
        ref={stageRef}
        className="relative flex h-[84vh] w-full items-center justify-center"
      >
        {/* Device body — GSAP drives its width, height and corner radius. */}
        <div
          ref={frameRef}
          className="relative bg-dark p-3 shadow-[0_34px_70px_-34px_rgba(14,19,18,0.45)]"
        >
          {/* Screen */}
          <div
            ref={screenRef}
            className="relative h-full w-full overflow-hidden bg-background"
          >
            <iframe
              ref={iframeRef}
              src="/masar-map.html"
              title="خريطة مسار للحُفر في الخليل"
              className="block h-full w-full border-0"
            />
          </div>

          {/* Phone notch / dynamic island — only shown for the phone */}
          <div
            ref={notchRef}
            className="absolute left-1/2 top-4 z-10 h-4 w-24 -translate-x-1/2 rounded-full bg-dark"
          />

          {/* Desktop stand — neck + base, sitting just below the body */}
          <div
            ref={standRef}
            className="absolute left-1/2 top-full flex -translate-x-1/2 flex-col items-center"
          >
            <div className="h-9 w-8 bg-dark" />
            <div className="h-2.5 w-40 rounded-full bg-dark" />
          </div>
        </div>
      </div>
    </section>
  );
}
