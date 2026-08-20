// Tiny cross-component signal for "the hero footage has buffered enough".
//
// The hero clip is scroll-scrubbed, not played: every scroll frame seeks it. If
// the visitor reaches it with nothing decoded, the first flick of the wheel
// lands on a frozen frame while the browser catches up. The loading screen is
// already sitting there doing nothing useful, so it waits on this signal (with
// a hard cap of its own) before revealing the page.
//
// Same shape as loaderSignal: subscribers registered before or after the event
// both fire exactly once.

const HERO_FOOTAGE_READY_EVENT = "masar:hero-footage-ready";

let heroFootageReady = false;

/** Called by the Hero once its video reports it can play through. */
export function signalHeroFootageReady() {
  if (heroFootageReady) return;
  heroFootageReady = true;
  window.dispatchEvent(new Event(HERO_FOOTAGE_READY_EVENT));
}

/** Whether the footage is already buffered — lets callers skip waiting. */
export function isHeroFootageReady() {
  return heroFootageReady;
}

/**
 * Run `callback` once the footage is ready. If it already is, the callback
 * runs on the next frame. Returns an unsubscribe function.
 */
export function onHeroFootageReady(callback: () => void) {
  if (heroFootageReady) {
    const raf = requestAnimationFrame(callback);
    return () => cancelAnimationFrame(raf);
  }
  const handler = () => callback();
  window.addEventListener(HERO_FOOTAGE_READY_EVENT, handler, { once: true });
  return () => window.removeEventListener(HERO_FOOTAGE_READY_EVENT, handler);
}
