/** @type {import("next").NextConfig} */
module.exports = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    browsersListForSwc: true,
    legacyBrowsers: false,
    optimizeCss: true,
  },
};
