"use client";

import Logo from "../Logo/Logo";
import {
  ArrowUpIcon,
  FacebookIcon,
  InstagramIcon,
  LinkedInIcon,
  XIcon,
} from "./Icons";

export default function Footer() {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    // Curtain reveal: this wrapper is a normal in-flow block that only clips.
    // The footer itself is fixed to the viewport bottom, so it never moves —
    // the page above scrolls away like a curtain lifting off of it.
    <div className="relative h-screen [clip-path:inset(0)]">
      <footer className="fixed inset-x-0 bottom-0 flex h-screen flex-col justify-between bg-primary px-32 pb-8 pt-24 text-white">
        <div>
          {/* Headline — top right (RTL start) */}
          <h2 className="max-w-4xl font-heading text-h1">
            معًا نرسم مسارًا أكثر أمانًا لطرقكم
          </h2>

          {/* Divider */}
          <div className="mt-10 h-px w-full bg-white/25" />

          {/* Navigate / Contact / Socials */}
          <div className="mt-12 flex gap-32">
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
        </div>

        {/* Giant brand — logo mark + wordmark */}
        <div className="flex items-center gap-10">
          <Logo className="h-[200px] w-auto" />
          <span className="font-heading text-[180px] leading-none">مسار</span>
        </div>

        {/* Bottom bar */}
        <div className="flex items-center justify-between text-t5 text-white/70">
          <p>© 2026 مسار. جميع الحقوق محفوظة.</p>
          <button
            type="button"
            onClick={scrollToTop}
            className="flex cursor-pointer items-center gap-2 text-white transition-opacity duration-300 hover:opacity-70"
          >
            العودة إلى الأعلى
            <ArrowUpIcon className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-6">
            <a href="#" className="transition-opacity duration-300 hover:opacity-70">
              سياسة الخصوصية
            </a>
            <a href="#" className="transition-opacity duration-300 hover:opacity-70">
              شروط الاستخدام
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
