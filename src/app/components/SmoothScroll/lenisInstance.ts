import type Lenis from "lenis";

// Tiny shared handle to the single Lenis instance created in SmoothScroll, so
// components that need to drive a smooth programmatic scroll (e.g. the Impact
// indicator jumping to a stat) can reach it without prop-drilling.
let instance: Lenis | null = null;

export function setLenis(l: Lenis | null) {
  instance = l;
}

export function getLenis() {
  return instance;
}
