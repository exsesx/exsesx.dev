import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    viewTransition: true,
  },
  turbopack: {
    root: import.meta.dirname,
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
