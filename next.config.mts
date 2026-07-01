import type { NextConfig } from "next";

function buildContentSecurityPolicy() {
  const isVercelPreview = process.env.VERCEL_ENV === "preview";
  const isVercelDeployment = Boolean(process.env.VERCEL_ENV);
  const isProductionBuild = process.env.NODE_ENV === "production";
  const imgSrc = ["'self'", "data:", "blob:"];
  const connectSrc = ["'self'"];
  const scriptSrc = ["'self'", "'unsafe-inline'"];
  const styleSrc = ["'self'", "'unsafe-inline'"];
  const frameSrc: string[] = [];

  if (isVercelPreview) {
    imgSrc.push("https://vercel.live", "https://vercel.com");
    connectSrc.push("https://vercel.live", "wss://ws-us3.pusher.com");
    scriptSrc.push("https://vercel.live");
    styleSrc.push("https://vercel.live");
    frameSrc.push("https://vercel.live");
  }

  if (!isProductionBuild) {
    scriptSrc.push("'unsafe-eval'");
  }

  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    frameSrc.length > 0 ? `frame-src ${frameSrc.join(" ")}` : null,
    "object-src 'none'",
    `img-src ${imgSrc.join(" ")}`,
    "media-src 'self'",
    "font-src 'self'",
    `connect-src ${connectSrc.join(" ")}`,
    `script-src ${scriptSrc.join(" ")}`,
    `style-src ${styleSrc.join(" ")}`,
    "manifest-src 'self'",
    "worker-src 'self' blob:",
    isVercelDeployment ? "upgrade-insecure-requests" : null,
  ];

  return directives.filter(Boolean).join("; ");
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  reactCompiler: true,
  typedRoutes: true,
  poweredByHeader: false,
  experimental: {
    turbopackFileSystemCacheForBuild: true,
    webVitalsAttribution: ["CLS", "LCP"],
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
            value: buildContentSecurityPolicy(),
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
