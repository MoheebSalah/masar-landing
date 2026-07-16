"use client";

import { useEffect, useRef, useState } from "react";
import { PlayIcon, CloseIcon } from "./Icons";
import { getLenis } from "../SmoothScroll/lenisInstance";

type FullscreenPlayerProps = {
  src: string;
  onClose: () => void;
};

/**
 * Mobile fullscreen video overlay. The foreground clip is sized with
 * `max-h/w-full` so it keeps its aspect while filling the SCREEN WIDTH in
 * portrait (a band with blurred/darkened video above and below) and the SCREEN
 * HEIGHT in landscape — both states fall out of the same constraints, so a
 * device rotation just re-fits it. A blurred, dimmed copy of the same clip fills
 * whatever the video doesn't. Native fullscreen is requested best-effort (it
 * hides the browser chrome where supported; the fixed overlay covers the
 * viewport regardless). Tap toggles play/pause.
 */
export default function FullscreenPlayer({ src, onClose }: FullscreenPlayerProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    const root = rootRef.current;
    getLenis()?.stop();

    root?.requestFullscreen?.().catch(() => {});
    videoRef.current?.play().catch(() => {});

    // If the user leaves native fullscreen via a system gesture, close the
    // overlay too so the two stay in sync.
    const onFsChange = () => {
      if (!document.fullscreenElement) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !document.fullscreenElement) onClose();
    };
    document.addEventListener("fullscreenchange", onFsChange);
    window.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      window.removeEventListener("keydown", onKey);
      getLenis()?.start();
    };
  }, [onClose]);

  const close = () => {
    // In native fullscreen, exiting fires `fullscreenchange`, which closes us;
    // otherwise close directly.
    if (document.fullscreenElement) document.exitFullscreen().catch(() => onClose());
    else onClose();
  };

  const toggle = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  };

  return (
    <div
      ref={rootRef}
      onClick={toggle}
      className="fixed inset-0 z-100 flex items-center justify-center bg-dark"
    >
      {/* Blurred, darkened backdrop — fills the band above/below (portrait) or
          the sides (landscape) that the contained video leaves. */}
      <video
        src={src}
        className="pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover blur-2xl brightness-[0.35]"
        autoPlay
        loop
        muted
        playsInline
        aria-hidden="true"
      />

      {/* Foreground clip — width-filled in portrait, height-filled in landscape */}
      <video
        ref={videoRef}
        src={src}
        className="relative z-10 max-h-full max-w-full"
        loop
        muted
        playsInline
        aria-hidden="true"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />

      {/* Centre play glyph while paused */}
      <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
        <span
          className={`flex h-20 w-20 items-center justify-center rounded-full bg-dark/50 transition-all duration-300 ${
            playing ? "scale-75 opacity-0" : "scale-100 opacity-100"
          }`}
        >
          <PlayIcon className="h-8 w-8 translate-x-0.5 text-white" />
        </span>
      </div>

      {/* Exit */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          close();
        }}
        aria-label="إغلاق ملء الشاشة"
        className="absolute right-4 top-4 z-30 flex h-11 w-11 items-center justify-center rounded-full bg-dark/50 text-white"
      >
        <CloseIcon className="h-6 w-6" />
      </button>
    </div>
  );
}
