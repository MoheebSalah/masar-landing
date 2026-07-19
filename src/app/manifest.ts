import type { MetadataRoute } from "next";

// Web App Manifest — lets مسار be installed to the home screen and launched
// standalone. Next serves this at /manifest.webmanifest and links it in <head>.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "مسار",
    short_name: "مسار",
    description:
      "منصّة ذكية ترصد أضرار الطرق تلقائيًا وتحوّلها إلى خطة إصلاح مُنظّمة وقابلة للمتابعة.",
    lang: "ar",
    dir: "rtl",
    start_url: "/",
    display: "standalone",
    background_color: "#EEEAE0",
    theme_color: "#34A8D8",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
