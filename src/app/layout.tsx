import type { Metadata, Viewport } from "next";
import { Almarai, Poppins } from "next/font/google";
import localFont from "next/font/local";
import "lenis/dist/lenis.css";
import "./globals.css";
import SmoothScroll from "./components/SmoothScroll/SmoothScroll";

// Only the weights the page actually asks for. Every requested weight is a
// separate Arabic subset file (~18 KB) that Next preloads in <head>, so a
// weight nothing renders is pure first-paint cost — 300 was one of those.
// (`font-semibold` appears in a few places; Almarai has no 600, so the browser
// already resolves those to 700, which is loaded.)
const almarai = Almarai({
  variable: "--font-almarai",
  subsets: ["arabic"],
  weight: ["400", "700", "800"],
  display: "swap",
});

// Latin display face used only for the big impact numbers, which render at a
// single weight — loading just that one keeps four unused font files off the
// first paint.
//
// It is also the one face with nothing above the fold: Impact sits most of the
// page below the hero. Preloading it would put it in the same <head> queue as
// the Arabic text faces and the hero's first frames, all of which are needed
// immediately. Left unpreloaded it still loads (display: swap covers the gap),
// just without taking bandwidth from the opening screen.
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
  preload: false,
});

const zain = localFont({
  variable: "--font-zain",
  display: "swap",
  src: "../../public/fonts/zain-mob-long300-Regular.ttf",
});

export const metadata: Metadata = {
  title: "مسار",
  description: "منصّة ذكية ترصد أضرار الطرق تلقائيًا وتحوّلها إلى خطة إصلاح مُنظّمة وقابلة للمتابعة.",
  // Lets iOS launch the installed page full-screen (standalone) like the manifest does for Android.
  appleWebApp: {
    capable: true,
    title: "مسار",
    statusBarStyle: "default",
  },
};

// theme-color tints the mobile status bar / task-switcher and the PWA splash.
export const viewport: Viewport = {
  themeColor: "#34A8D8",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${almarai.variable} ${zain.variable} ${poppins.variable} h-full antialiased`}
    >
      <head>
        {/* Runs before the browser restores a saved scroll position on
            refresh, so every load starts at the top (the hero) instead of
            wherever the visitor last was. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "if('scrollRestoration' in history){history.scrollRestoration='manual';}",
          }}
        />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
