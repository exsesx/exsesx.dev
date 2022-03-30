/** @type {import("next").NextConfig} */
module.exports = {
  swcMinify: true,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    optimizeCss: true,
    runtime: "nodejs",
  },
};
