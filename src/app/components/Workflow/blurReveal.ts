import gsap from "gsap";

/**
 * Scroll-scrubbed "blur in" reveal (à la rideradian.com/our-story): the target
 * starts invisible and heavily blurred, then sharpens to fully clear over a
 * short stretch of scrolling. Because it is scrubbed, scrolling back up plays
 * it in reverse — the element re-blurs and fades out.
 *
 * `trigger` should be a NON-parallaxed ancestor so its start/end stay stable
 * (measuring off a transformed element makes the trigger points drift). The
 * tween only touches `opacity`/`filter`, so it composes cleanly with a separate
 * parallax tween animating `y` on the same target.
 */
export function blurReveal(target: gsap.TweenTarget, trigger: Element) {
  return gsap.fromTo(
    target,
    { opacity: 0, filter: "blur(16px)" },
    {
      opacity: 1,
      filter: "blur(0px)",
      ease: "none",
      scrollTrigger: {
        trigger,
        start: "top 80%", // begins as the element rises into view
        end: "top 45%", // fully clear after a short scroll
        scrub: true,
      },
    },
  );
}
