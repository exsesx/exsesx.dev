import type { NextConfig } from "next";
import { buildContentSecurityPolicy } from "./src/lib/content-security-policy.mts";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  reactCompiler: true,
  typedRoutes: true,
  poweredByHeader: false,
  experimental: {
    // Turbopack's persistent build cache is intentionally off: on Vercel it
    // reused a stale compiled globals.css, deploying new markup with the old
    // stylesheet (nav pill broke in production, 2026-07-02).
    useTypeScriptCli: true,
    viewTransition: true,
  },
  turbopack: {
    root: import.meta.dirname,
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
  allowedDevOrigins: ["[::1]"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: buildContentSecurityPolicy(process.env),
          },
        ],
      },
      {
        source: "/fonts/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
