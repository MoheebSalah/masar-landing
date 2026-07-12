import type { Metadata } from "next";
import { Almarai, Poppins } from "next/font/google";
import localFont from "next/font/local";
import "lenis/dist/lenis.css";
import "./globals.css";
import SmoothScroll from "./components/SmoothScroll/SmoothScroll";

const almarai = Almarai({
  variable: "--font-almarai",
  subsets: ["arabic"],
  weight: ["300", "400", "700", "800"],
});

// Latin display face used only for the big impact numbers.
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const rubbama = localFont({
  variable: "--font-rubbama",
  display: "swap",
  src: "../../public/fonts/rubbama-typeface/OTF/KORubbama-Black.otf",
});

export const metadata: Metadata = {
  title: "مسار",
  description: "منصّة ذكية ترصد أضرار الطرق تلقائيًا وتحوّلها إلى خطة إصلاح مُنظّمة وقابلة للمتابعة.",
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
      className={`${almarai.variable} ${rubbama.variable} ${poppins.variable} h-full antialiased`}
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
      <body className="min-h-full flex flex-col">
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
