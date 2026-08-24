// Cross-component signal for "the hero's mark has landed in the navbar".
//
// The logo that opens the page starts in the middle of the hero, above the
// headline, and flies up into the navbar's logo slot as the visitor scrolls. So
// for the first third of a screen two components have a claim on the same
// corner of the viewport, and this is how they take turns: the Hero drives the
// flight and reports when its copy has arrived, and the Navbar keeps its own
// logo invisible — but laid out, so the Hero can measure the slot it is aiming
// at — until then.
//
// Unlike loaderSignal and heroFootageSignal this one is not fire-once: scroll
// back up and the mark flies home again, so the value flips both ways and every
// subscriber is handed the current one the moment it subscribes.

const HERO_LOGO_LANDED_EVENT = "masar:hero-logo-landed";

let landed = false;

/** Called by the Hero as its mark arrives in — or leaves again — the slot. */
export function setHeroLogoLanded(value: boolean) {
  if (landed === value) return;
  landed = value;
  window.dispatchEvent(
    new CustomEvent<boolean>(HERO_LOGO_LANDED_EVENT, { detail: value })
  );
}

/**
 * Subscribe to the handover. `callback` runs straight away with the current
 * value and again on every change. Returns an unsubscribe function.
 */
export function onHeroLogoLanded(callback: (value: boolean) => void) {
  callback(landed);
  const handler = (event: Event) =>
    callback((event as CustomEvent<boolean>).detail);
  window.addEventListener(HERO_LOGO_LANDED_EVENT, handler);
  return () => window.removeEventListener(HERO_LOGO_LANDED_EVENT, handler);
}
