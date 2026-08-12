"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  type ReactNode,
} from "react";
import gsap from "gsap";

export type ReelHandle = {
  // Park the reel on a (usually fractional) item index.
  setIndex: (index: number) => void;
  // Fade the whole reel — for reels whose items don't survive being cut in half.
  setAlpha: (alpha: number) => void;
};

type Props = {
  // One node per stop on the reel.
  items: ReactNode[];
  // On the window-filling wrapper (which is also the perspective origin).
  className?: string;
  // On every item.
  itemClassName?: string;
  // Gap between neighbouring items, as a percentage of the window's height.
  step?: number;
  // Degrees of rotateX per 100% travelled — the curvature of the drum. 0 keeps
  // the reel flat.
  curve?: number;
  // Opacity lost per 100% travelled, so items dim as they turn away.
  fade?: number;
};

// A reel of items wrapped around a drum. Every item is stacked on the same box
// as the window, so each one's transform-origin *is* the window's centre; the
// item is then pushed down/up its share of the way and rotated about that
// centre, which swings it away from the viewer on an arc instead of sliding it
// flat. With a `perspective` on the wrapper, that arc is the cylinder.
//
// Position is driven imperatively, never through React state: `setIndex(1.4)`
// puts item 1 in the window and turns the drum 40% of the way on towards item
// 2. Fractional indices are the point — the scroll position maps straight onto
// the drum, so it is always exactly where the reader's scroll left it rather
// than playing a triggered animation.
const Reel = forwardRef<ReelHandle, Props>(function Reel(
  { items, className, itemClassName, step = 100, curve = 0, fade = 0 },
  ref
) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<(HTMLDivElement | null)[]>([]);
  // Tweened rather than set, so a tap on a phone glides instead of jumping;
  // on desktop the scroll already feeds it a continuous value.
  const posRef = useRef({ index: 0 });
  const glide = useRef<gsap.QuickToFunc | null>(null);
  const setOpacity = useRef<gsap.QuickToFunc | null>(null);

  useEffect(() => {
    const draw = () => {
      const index = posRef.current.index;
      itemsRef.current.forEach((el, i) => {
        if (!el) return;
        // How far this item sits from the window's centre, in % of its height.
        const shift = (i - index) * step;
        el.style.transform = `rotateX(${(-curve * shift) / 100}deg) translateY(${shift}%) translateZ(0px)`;
        el.style.opacity = String(Math.max(0, 1 - (fade * Math.abs(shift)) / 100));
      });
    };
    draw();

    glide.current = gsap.quickTo(posRef.current, "index", {
      duration: 0.3,
      ease: "power3.out",
      onUpdate: draw,
    });
    setOpacity.current = gsap.quickTo(wrapRef.current, "opacity", {
      duration: 0.2,
      ease: "power2.out",
    });

    return () => {
      glide.current = null;
      setOpacity.current = null;
    };
  }, [step, curve, fade]);

  useImperativeHandle(
    ref,
    () => ({
      setIndex: (index: number) => glide.current?.(index),
      setAlpha: (alpha: number) => setOpacity.current?.(alpha),
    }),
    []
  );

  return (
    <div ref={wrapRef} className={className}>
      {items.map((item, i) => (
        <div
          key={i}
          ref={(el) => {
            itemsRef.current[i] = el;
          }}
          className={`absolute inset-0 flex items-center justify-center ${itemClassName ?? ""}`}
        >
          {item}
        </div>
      ))}
    </div>
  );
});

export default Reel;
