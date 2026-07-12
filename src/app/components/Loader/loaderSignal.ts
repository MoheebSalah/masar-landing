// Tiny cross-component signal for "the loading screen has finished".
//
// The Loader unmounts itself when it's done, so components that want to start
// their entrance animation the moment the loader clears (the navbar, the hero)
// can't just read its props. They subscribe here instead: the Loader calls
// `signalLoaderDone()` at the end of its reveal, and subscribers registered
// before or after that fire exactly once.

const LOADER_DONE_EVENT = "masar:loader-done";

let loaderDone = false;

/** Called by the Loader once its reveal finishes (or is skipped). */
export function signalLoaderDone() {
  if (loaderDone) return;
  loaderDone = true;
  window.dispatchEvent(new Event(LOADER_DONE_EVENT));
}

/**
 * Run `callback` when the loader is done. If it already finished, the callback
 * runs on the next frame. Returns an unsubscribe function.
 */
export function onLoaderDone(callback: () => void) {
  if (loaderDone) {
    const raf = requestAnimationFrame(callback);
    return () => cancelAnimationFrame(raf);
  }
  const handler = () => callback();
  window.addEventListener(LOADER_DONE_EVENT, handler, { once: true });
  return () => window.removeEventListener(LOADER_DONE_EVENT, handler);
}
