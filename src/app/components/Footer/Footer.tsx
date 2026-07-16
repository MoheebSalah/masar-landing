"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ArrowUpIcon,
  FacebookIcon,
  InstagramIcon,
  LinkedInIcon,
  XIcon,
} from "./Icons";

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
      className="relative h-[calc(100vh+2rem)] [clip-path:inset(0)]"
    >
      <footer className="fixed inset-x-0 bottom-0 h-screen overflow-hidden bg-primary px-6 pt-14 text-white md:px-32 md:pt-16">
        {/* Giant brand mark rising from behind the bottom edge — nearly as
            wide as the screen. Anchored by its TOP at a viewport-relative
            height so it starts below the content on any screen, while its
            base always runs past the bottom edge and gets clipped. Each
            arrow is animated on its own for the staircase reveal. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-[78vh] flex justify-center md:top-[41vh]"
        >
          <svg
            className="footer-mark h-auto w-[115vw] shrink-0 md:w-[94vw]"
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
                      <a href="#problem" className="transition-opacity duration-300 hover:opacity-70">
                        المشكلة
                      </a>
                    </li>
                    <li>
                      <a href="#solution" className="transition-opacity duration-300 hover:opacity-70">
                        الحل
                      </a>
                    </li>
                    <li>
                      <a href="#workflow" className="transition-opacity duration-300 hover:opacity-70">
                        آلية العمل
                      </a>
                    </li>
                    <li>
                      <a href="#capabilities" className="transition-opacity duration-300 hover:opacity-70">
                        الإمكانات
                      </a>
                    </li>
                    <li>
                      <a href="#see-in-action" className="transition-opacity duration-300 hover:opacity-70">
                        شاهد التجربة
                      </a>
                    </li>
                  </ul>
                </nav>

                <div>
                  <h3 className="text-t4 font-bold text-white/70">تواصل معنا</h3>
                  <ul className="mt-5 space-y-3 text-t4">
                    <li>
                      <a href="mailto:info@masar.ps" className="transition-opacity duration-300 hover:opacity-70">
                        info@masar.ps
                      </a>
                    </li>
                    <li>
                      <a href="tel:+97022954410" dir="ltr" className="transition-opacity duration-300 hover:opacity-70">
                        +970 2 295 4410
                      </a>
                    </li>
                    <li>رام الله، الضفة الغربية، فلسطين</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-t4 font-bold text-white/70">تابعنا</h3>
                  <div className="mt-5 flex items-center gap-6">
                    <a
                      href="https://www.linkedin.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="لينكدإن"
                      className="transition-opacity duration-300 hover:opacity-70"
                    >
                      <LinkedInIcon className="h-6 w-6" />
                    </a>
                    <a
                      href="https://x.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="إكس"
                      className="transition-opacity duration-300 hover:opacity-70"
                    >
                      <XIcon className="h-6 w-6" />
                    </a>
                    <a
                      href="https://www.instagram.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="إنستغرام"
                      className="transition-opacity duration-300 hover:opacity-70"
                    >
                      <InstagramIcon className="h-6 w-6" />
                    </a>
                    <a
                      href="https://www.facebook.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="فيسبوك"
                      className="transition-opacity duration-300 hover:opacity-70"
                    >
                      <FacebookIcon className="h-6 w-6" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Wordmark + legal — far left (RTL end), a column kept clear
                  of the rising arrows */}
              <div>
                <span className="hidden font-heading text-[120px] leading-none md:block">
                  مسار
                </span>
                <div className="mt-6 space-y-2.5 text-t5 text-white/70">
                  <p>© 2026 مسار. جميع الحقوق محفوظة.</p>
                  <div className="flex items-center gap-5">
                    <a href="#" className="transition-opacity duration-300 hover:opacity-70">
                      سياسة الخصوصية
                    </a>
                    <a href="#" className="transition-opacity duration-300 hover:opacity-70">
                      شروط الاستخدام
                    </a>
                  </div>
                  <button
                    type="button"
                    onClick={scrollToTop}
                    className="flex cursor-pointer items-center gap-2 text-white transition-opacity duration-300 hover:opacity-70"
                  >
                    العودة إلى الأعلى
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
