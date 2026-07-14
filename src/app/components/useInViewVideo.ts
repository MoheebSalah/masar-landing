"use client";

import { useEffect, useRef } from "react";

/**
 * Gates a muted background <video> on viewport proximity. The element should
 * carry `preload="none"` so nothing downloads up front; this hook plays it once
 * it nears the viewport (loading it on demand) and pauses it again on the way
 * out — so off-screen clips are never fetched. `rootMargin` starts the load a
 * little before the video actually enters view, avoiding a blank first frame.
 */
export function useInViewVideo<T extends HTMLVideoElement = HTMLVideoElement>(
  rootMargin = "200px 0px",
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {});
        else if (!video.paused) video.pause();
      },
      { rootMargin, threshold: 0 },
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, [rootMargin]);

  return ref;
}
