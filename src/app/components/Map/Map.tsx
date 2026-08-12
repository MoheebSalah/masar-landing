"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DesktopIcon, TabletIcon, PhoneIcon } from "./Icons";
import MapMobile from "./MapMobile";

gsap.registerPlugin(ScrollTrigger);

// Read the breakpoint before paint so the mobile branch renders on the first
// visible frame (no desktop-stage flash), falling back to useEffect on the
// server where layout effects don't run.
const useIsoLayoutEffect =
  typeof document !== "undefined" ? useLayoutEffect : useEffect;

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
// The map re-frames to a device-appropriate zoom on each switch, so it reads as
// a real reframe rather than a crop: the desktop keeps the wide regional view,
// the phone eases in to a street-level one. Stays inside the map's 11.5–18 range.
const ZOOM: Record<Device, number> = { desktop: 12.6, tablet: 13.4, phone: 14.2 };

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
  // On phones the whole device-morph experience is dropped for a simpler
  // tap-to-fullscreen map, so all the desktop choreography below is gated off.
  const [isMobile, setIsMobile] = useState(false);

  useIsoLayoutEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (isMobile) return;
    const iframe = iframeRef.current;
    const stage = stageRef.current;
    const frame = frameRef.current;
    if (!iframe || !stage || !frame) return;

    // Paint the initial (desktop) frame shape and fit it to the stage.
    gsap.set(frame, { borderRadius: DEVICES.desktop.radius });
    gsap.set(screenRef.current, { borderRadius: DEVICES.desktop.screenRadius });
    gsap.set(standRef.current, { autoAlpha: 1 });
    gsap.set(notchRef.current, { autoAlpha: 0 });

    const post = (msg: Record<string, unknown>) =>
      iframe.contentWindow?.postMessage(msg, "*");

    // Tell the map how far the visible window is inset from the map edges, so it
    // can slide its on-map controls (zoom + attribution) into the visible
    // corner. The frame is centred in the stage, so the inset is just half the
    // gap between them — which the map's fixed bezel cancels out.
    const postInset = (frameW: number, frameH: number) =>
      post({ type: "masar-inset", x: (stage.clientWidth - frameW) / 2, y: (stage.clientHeight - frameH) / 2 });

    const measure = () => {
      const boxW = stage.clientWidth;
      const boxH = stage.clientHeight;
      const dims = fitBody(deviceRef.current, boxW, boxH);
      gsap.set(frame, { width: dims.w, height: dims.h });
      // The map renders once at the full desktop-screen size and stays centred
      // in the stage; the frame just crops it. Keeping it a fixed size means the
      // map never resizes or re-renders while the frame morphs, so the switch is
      // a pure GPU crop with zero map churn.
      gsap.set(iframe, { width: boxW - BEZEL * 2, height: boxH - BEZEL * 2 });
      postInset(dims.w, dims.h);
    };
    measure();
    window.addEventListener("resize", measure);

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
      // this handshake so the intro still fires once it's ready. Also re-sync the
      // control inset in case a device was chosen before the map came up.
      if (type === "masar-ready") {
        if (playedRef.current) post({ type: "masar-play" });
        const dims = fitBody(deviceRef.current, stage.clientWidth, stage.clientHeight);
        postInset(dims.w, dims.h);
      }
      if (type === "masar-done") {
        window.clearTimeout(unlockTimer);
        setAnimating(false);
      }
    };
    window.addEventListener("message", onMessage);

    // Hold the intro until the whole map window is on screen — fire the moment
    // the frame's bottom border reaches the bottom of the viewport.
    const st = ScrollTrigger.create({
      trigger: frame,
      start: "bottom bottom",
      onEnter: play,
      onEnterBack: play,
    });

    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("message", onMessage);
      window.clearTimeout(unlockTimer);
      st.kill();
    };
  }, [isMobile]);

  // Reveal on scroll: the heading + toggle rise in as the section arrives, then
  // the device (with the map inside it) fades and scales up as the stage lands.
  useEffect(() => {
    const section = sectionRef.current;
    const heading = headingRef.current;
    const toggle = toggleRef.current;
    const frame = frameRef.current;
    const stage = stageRef.current;
    if (isMobile) return;
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
  }, [isMobile]);

  // Morph the frame to the chosen device. The map stays a fixed-size, centred
  // element and the frame simply crops more or less of it — no map resize, so
  // the switch is smooth. Blocked while the intro is playing.
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
    const post = (msg: Record<string, unknown>) =>
      iframeRef.current?.contentWindow?.postMessage(msg, "*");
    // Reframe the map camera to this device's zoom (the map eases it itself).
    post({ type: "masar-zoom", zoom: ZOOM[next] });
    gsap.to(frame, {
      width: dims.w,
      height: dims.h,
      borderRadius: meta.radius,
      duration: 0.7,
      ease,
      // Slide the on-map controls to the new corner in lockstep with the frame
      // edge, reading the live size each frame so they track it exactly.
      onUpdate: () =>
        post({
          type: "masar-inset",
          x: (stage.clientWidth - frame.offsetWidth) / 2,
          y: (stage.clientHeight - frame.offsetHeight) / 2,
        }),
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

      {/* Phones get a plain tap-to-fullscreen map; desktop keeps the device
          toggle + morphing stage below. */}
      {isMobile && <MapMobile />}

      {!isMobile && (
        <>
      {/* Device toggle — desktop, tablet, phone. Disabled while the intro plays. */}
      <div ref={toggleRef} className="mb-10 flex justify-center">
        <div className="inline-flex items-center gap-1 rounded-full bg-white p-1.5 ">
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
          className="relative bg-dark p-3 "
        >
          {/* Screen — a fixed-size, centred map that this window crops as it
              morphs. The iframe never resizes, so the map stays perfectly still. */}
          <div
            ref={screenRef}
            className="relative h-full w-full overflow-hidden bg-background"
          >
            {/* The map document carries its own inlined MapLibre build (~1.3 MB),
                so it stays lazy — it only fetches once this section nears the
                viewport instead of competing with the sections above it. */}
            <iframe
              ref={iframeRef}
              src="/masar-map.html"
              title="خريطة مسار للحُفر في الخليل"
              loading="lazy"
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 border-0"
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
        </>
      )}
    </section>
  );
}
