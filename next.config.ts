import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,

  // Files under public/ are served with `max-age=0` by default, so every repeat
  // visit re-validates all of them — including the carousel clips, which are the
  // heaviest thing on the page. These filenames are stable rather than
  // content-hashed, so instead of `immutable` they get a day of freshness plus a
  // week of stale-while-revalidate: repeat visits paint from cache immediately
  // and a replaced asset still propagates within a day.
  async headers() {
    return [
      {
        source: "/assets/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
