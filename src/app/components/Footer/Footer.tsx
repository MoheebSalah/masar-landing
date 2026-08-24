"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowUpIcon } from "./Icons";
import RollLink from "../RollText/RollLink";
import RollText from "../RollText/RollText";

gsap.registerPlugin(ScrollTrigger);

export default function Footer() {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const rootRef = useRef<HTMLDivElement>(null);
  const aboveRef = useRef<HTMLHeadingElement>(null);
  const belowRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<SVGPathElement>(null);
  const midRef = useRef<SVGPathElement>(null);
  const rightRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const above = aboveRef.current;
    const below = belowRef.current;
    const arrows = [rightRef.current, midRef.current, leftRef.current];
    if (!root || !above || !below || arrows.some((a) => !a)) return;

    // Respect users who opt out of motion — leave everything in place.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      // Text drift, scrubbed to the curtain reveal: scrolling down lifts the
      // headline and the link block into place; scrolling back up sinks them
      // again. The two groups travel different distances for a light parallax.
      const drift = {
        trigger: root,
        start: "top bottom",
        end: "bottom bottom",
        scrub: true,
      };
      gsap.fromTo(above, { y: 48 }, { y: 0, ease: "none", scrollTrigger: drift });
      gsap.fromTo(below, { y: 90 }, { y: 0, ease: "none", scrollTrigger: drift });

      // Staircase reveal, scrubbed: the arrows' rise is bound directly to the
      // curtain progress — scrolling down raises them (rightmost first, then
      // middle, then left, overlapping like climbing stairs), and scrolling
      // back up walks the same motion in reverse. The whole climb is mapped
      // from the footer being half-revealed to fully revealed.
      gsap.fromTo(
        arrows as SVGPathElement[],
        { yPercent: 160 },
        {
          yPercent: 0,
          duration: 1.2,
          ease: "power3.out",
          stagger: 0.35,
          scrollTrigger: {
            trigger: root,
            start: "top 50%",
            end: "top top",
            // Numeric scrub = seconds of catch-up lag: the arrows trail the
            // scrollbar and keep gliding after it stops, slowing the climb
            // way down while staying bound to scroll progress.
            scrub: 3,
          },
        }
      );
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    // Curtain reveal: this wrapper is a normal in-flow block that only clips.
    // The footer itself is fixed to the viewport bottom, so it never moves —
    // the page above scrolls away like a curtain lifting off of it.
    <div
      ref={rootRef}
      /* One viewport tall + the CTA's 32px overlap (its -mb-8), so at the very
         bottom the overlapping CTA scrolls fully off-screen and the footer shows
         clean — while mid-scroll the overlap still lets the CTA's rounded corners
         reveal the primary beneath. */
      className="relative h-[calc(100svh+2rem)] [clip-path:inset(0)]"
    >
      <footer className="fixed inset-x-0 bottom-0 h-svh overflow-hidden bg-primary px-6 pt-14 text-white md:px-32 md:pt-16">
        {/* Giant brand mark rising from behind the bottom edge — nearly as
            wide as the screen. Anchored by its TOP so its base always runs
            past the bottom edge and gets clipped. Each arrow is animated on
            its own for the staircase reveal.

            The anchor is `max()` of a viewport share and a fixed length
            because the column above it does not scale: heading, links,
            socials and the back-to-top row come to a fixed 609px whatever the
            screen height is. 70svh clears that on a tall phone and is what
            sets the spacing there, but on a short one — a 667px screen, or any
            phone once `svh` stopped over-reporting the height — it resolves
            underneath the content and the mark collides with the back-to-top
            link. The 40rem floor is that content height plus a little air,
            so the mark parks just below it instead. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-[max(70svh,40rem)] flex justify-center md:top-[41svh]"
        >
          <svg
            className="footer-mark h-auto w-[160vw] shrink-0 md:w-[94vw]"
            viewBox="4.5 16.5 47 23"
            fill="currentColor"
          >
            <path
              ref={leftRef}
              d="M16.8376 17.9785L5.97976 36.6039C5.45769 37.4995 6.47538 38.5 7.36193 37.9628L15.2983 33.1536C15.6502 32.9403 16.0969 32.9644 16.4239 33.2144L22.8304 38.112C23.6024 38.7022 24.6775 37.9558 24.3944 37.0263L18.6581 18.1908C18.4039 17.3559 17.2771 17.2245 16.8376 17.9785Z"
            />
            <path
              ref={midRef}
              d="M26.8471 38.005L21.2015 20.2616C20.9429 19.4492 21.7545 18.7066 22.5409 19.0361L27.4135 21.078C27.6608 21.1816 27.9393 21.1816 28.1865 21.078L33.0592 19.0361C33.8455 18.7066 34.6571 19.4492 34.3986 20.2616L28.7529 38.005C28.4573 38.9341 27.1427 38.9341 26.8471 38.005Z"
            />
            <path
              ref={rightRef}
              d="M38.7624 17.9785L49.6202 36.6039C50.1423 37.4995 49.1246 38.5 48.238 37.9628L40.3017 33.1536C39.9497 32.9403 39.503 32.9644 39.1761 33.2144L32.7696 38.112C31.9976 38.7022 30.9225 37.9558 31.2056 37.0263L36.9419 18.1908C37.1961 17.3559 38.3229 17.2245 38.7624 17.9785Z"
            />
          </svg>
        </div>

        {/* Text content sits above the mark */}
        <div className="relative">
          {/* Headline — top right (RTL start) */}
          <h2 ref={aboveRef} className="max-w-4xl font-heading text-h3 md:text-h1">
            معًا نرسم مسارًا أكثر أمانًا لطرقكم
          </h2>

          {/* Divider */}
          <div className="mt-8 h-px w-full bg-white/25" />

          <div ref={belowRef}>
            {/* Nav / Contact / Socials — wordmark at the far left (RTL end) */}
            <div className="mt-8 flex flex-col gap-10 md:mt-10 md:flex-row md:items-start md:justify-between">
              <div className="grid grid-cols-2 gap-x-6 gap-y-8 md:flex md:gap-32">
                <nav aria-label="روابط الصفحة">
                  <h3 className="text-t4 font-bold text-white/70">تصفّح</h3>
                  <ul className="mt-5 space-y-3 text-t4">
                    <li>
                      <RollLink href="#statement">التحدي</RollLink>
                    </li>
                    <li>
                      <RollLink href="#solution">الحل</RollLink>
                    </li>
                    <li>
                      <RollLink href="#workflow">آلية العمل</RollLink>
                    </li>
                    <li>
                      <RollLink href="#capabilities">الإمكانات</RollLink>
                    </li>
                    <li>
                      <RollLink href="#see-in-action">شاهد التجربة</RollLink>
                    </li>
                  </ul>
                </nav>

                <div>
                  <h3 className="text-t4 font-bold text-white/70">تواصل معنا</h3>
                  <ul className="mt-5 space-y-3 text-t4">
                    <li>
                      <RollLink href="mailto:info@ai-masar.com">info@ai-masar.com</RollLink>
                    </li>
                    <li>
                      <RollLink href="tel:+970599886917" dir="ltr">
                        +970 599 886 917
                      </RollLink>
                    </li>
                    <li>فلسطين، الخليل</li>
                  </ul>
                </div>
              </div>

              {/* Wordmark + legal — far left (RTL end), a column kept clear
                  of the rising arrows */}
              <div>
                <span className="hidden font-heading text-[120px] leading-none md:block">
                  مسار
                </span>
                <div className="mt-6 space-y-2.5 text-t5 text-white/70">
                  {/* Copyright + legal links: desktop only — phones keep just
                      the "back to top" control below. */}
                  <p className="max-md:hidden">© 2026 مسار. جميع الحقوق محفوظة.</p>
                  <div className="flex items-center gap-5 max-md:hidden">
                    <RollLink href="#">سياسة الخصوصية</RollLink>
                    <RollLink href="#">شروط الاستخدام</RollLink>
                  </div>
                  {/* The arrow sits outside the clipped label so it stays put
                      while the words roll past it. */}
                  <button
                    type="button"
                    onClick={scrollToTop}
                    className="group/roll flex cursor-pointer items-center gap-2 text-white"
                  >
                    <RollText>العودة إلى الأعلى</RollText>
                    <ArrowUpIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
