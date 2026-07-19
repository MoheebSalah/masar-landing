"use client";

import { useState } from "react";

// The demo-booking pill, shared by the desktop (horizontal) and mobile
// (vertical) roads. On click the navigation arrow launches: the resting arrow
// lifts away up-right while a fresh one flies in from below, and the pill gives
// a short bounce. The transition is only armed while launching, so the reset to
// rest snaps instantly instead of the arrow drifting back down from the top.
export default function CTAButton() {
  const [launching, setLaunching] = useState(false);

  const handleLaunch = () => {
    setLaunching(true);
    window.setTimeout(() => setLaunching(false), 500);
  };

  return (
    <a
      href="#contact"
      onClick={handleLaunch}
      className={`inline-flex items-center gap-2.75 whitespace-nowrap rounded-full bg-dark px-7.5 py-3.75 font-sans text-t3 font-extrabold text-text-dark  transition-transform duration-300 hover:scale-105 ${
        launching ? "cta-bounce" : ""
      }`}
    >
      <span className="relative block h-5 w-4.5 overflow-hidden">
        <svg
          width="18"
          height="20"
          viewBox="0 0 19 21"
          fill="none"
          className={`absolute inset-0 ${
            launching
              ? "-translate-y-6 translate-x-2 opacity-0 transition-all duration-300 ease-out"
              : "translate-x-0 translate-y-0 opacity-100"
          }`}
          aria-hidden="true"
        >
          <path
            d="M11.0001 0.496532L0.142295 19.122C-0.379772 20.0175 0.637915 21.0181 1.52446 20.4808L9.46083 15.6717C9.81279 15.4584 10.2595 15.4825 10.5864 15.7325L16.9929 20.6301C17.7649 21.2203 18.84 20.4739 18.5569 19.5443L12.8206 0.708826C12.5664 -0.126008 11.4396 -0.257404 11.0001 0.496532Z"
            className="fill-primary"
          />
        </svg>
        <svg
          width="18"
          height="20"
          viewBox="0 0 19 21"
          fill="none"
          className={`absolute inset-0 ${
            launching
              ? "translate-x-0 translate-y-0 opacity-100 transition-all duration-300 ease-out"
              : "-translate-x-2 translate-y-6 opacity-0"
          }`}
          aria-hidden="true"
        >
          <path
            d="M11.0001 0.496532L0.142295 19.122C-0.379772 20.0175 0.637915 21.0181 1.52446 20.4808L9.46083 15.6717C9.81279 15.4584 10.2595 15.4825 10.5864 15.7325L16.9929 20.6301C17.7649 21.2203 18.84 20.4739 18.5569 19.5443L12.8206 0.708826C12.5664 -0.126008 11.4396 -0.257404 11.0001 0.496532Z"
            className="fill-primary"
          />
        </svg>
      </span>
      احجز عرضاً
    </a>
  );
}
