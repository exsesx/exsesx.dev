import createMDX from "@next/mdx";
import type { NextConfig } from "next";
import { buildContentSecurityPolicy } from "./src/lib/content-security-policy.mts";

const withMDX = createMDX({
  options: {
    remarkPlugins: ["remark-gfm"],
    rehypePlugins: [
      "rehype-slug",
      ["rehype-autolink-headings", { behavior: "wrap", properties: { className: ["heading-anchor"] } }],
      ["rehype-mermaid", { strategy: "pre-mermaid" }],
      [
        "rehype-pretty-code",
        {
          keepBackground: false,
          theme: {
            dark: "github-dark-default",
            light: "github-light-default",
          },
        },
      ],
    ],
  },
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  reactCompiler: true,
  typedRoutes: true,
  poweredByHeader: false,
  pageExtensions: ["js", "jsx", "mdx", "ts", "tsx"],
  experimental: {
    // Turbopack's persistent build cache is intentionally off: on Vercel it
    // reused a stale compiled globals.css, deploying new markup with the old
    // stylesheet (nav pill broke in production, 2026-07-02).
    useTypeScriptCli: true,
    viewTransition: true,
    globalNotFound: true,
  },
  turbopack: {
    root: import.meta.dirname,
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
  allowedDevOrigins: ["[::1]", "127.0.0.1"],
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

export default withMDX(nextConfig);
