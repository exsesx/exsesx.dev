import { ImageResponse } from "next/og";
import type { BlogPostEntry } from "@/content/blog/types";
import { formatBlogDate } from "./blog";
import { versionSocialImageId } from "./social-image-version";

export const socialImageSize = { width: 1200, height: 630 } as const;
export const socialImageContentType = "image/png";

export const projectSocialAccents = {
  amber: "#845cf6",
  controlup: "#3887e8",
  mint: "#3a80e0",
  quicklizard: "#40a8c4",
  rose: "#e85068",
  steel: "#6096c4",
  violet: "#9660d6",
} as const;

type SocialImageOptions = {
  eyebrow: string;
  title: string;
  description: string;
  path: string;
  context: string;
  accent?: string;
  tags?: readonly string[];
  footer?: string;
};

type SocialImageMetadataOptions = {
  id: string;
  alt: string;
};

const ink = "#0b1423";
const muted = "#51607a";

function titleSize(title: string) {
  if (title.length > 68) return 42;
  if (title.length > 48) return 48;
  if (title.length > 32) return 54;
  return 64;
}

export function buildSocialImageMetadata({ id, alt }: SocialImageMetadataOptions) {
  return {
    id: versionSocialImageId(id),
    alt,
    size: socialImageSize,
    contentType: socialImageContentType,
  } as const;
}

export function buildProfileSocialImageOptions(): SocialImageOptions {
  return {
    eyebrow: "Practical AI systems + product engineering",
    title: "Software with a pulse",
    description: "Full-stack products, MCP servers, LLM workflows, and developer tools.",
    path: "exsesx.dev",
    context: "Profile",
    tags: ["9+ years", "17+ projects", "AI + MCP"],
  };
}

export function buildBlogArticleSocialImageOptions(article: BlogPostEntry): SocialImageOptions {
  return {
    eyebrow: `${article.locale.toUpperCase()} • Blog`,
    title: article.title,
    description: article.description,
    path: `exsesx.dev/blog/${article.locale}/${article.slug}`,
    context: `${article.locale} • Blog`,
    tags: article.tags,
    footer: formatBlogDate(article.publishedAt, article.locale),
  };
}

export function createSocialImage({
  eyebrow,
  title,
  description,
  path,
  context,
  accent = "#3d5afe",
  tags = [],
  footer,
}: SocialImageOptions) {
  return new ImageResponse(
    <div
      style={{
        alignItems: "center",
        backgroundColor: "#eef2f8",
        backgroundImage:
          "linear-gradient(rgba(11,20,35,.045) 1px, transparent 1px), linear-gradient(90deg, rgba(11,20,35,.045) 1px, transparent 1px)",
        backgroundSize: "44px 44px",
        color: ink,
        boxSizing: "border-box",
        display: "flex",
        fontFamily: "sans-serif",
        height: "100%",
        justifyContent: "center",
        overflow: "hidden",
        position: "relative",
        width: "100%",
      }}
    >
      <div
        style={{
          background: "rgba(61,90,254,.09)",
          borderRadius: 220,
          display: "flex",
          height: 420,
          left: 10,
          position: "absolute",
          top: -90,
          width: 420,
        }}
      />
      <div
        style={{
          background: ink,
          borderRadius: 46,
          boxSizing: "border-box",
          display: "flex",
          height: 530,
          padding: 30,
          position: "relative",
          width: 1092,
        }}
      >
        <div
          style={{
            background: "#f3f7fd",
            borderRadius: 36,
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            height: "100%",
            overflow: "hidden",
            padding: 28,
            position: "relative",
            width: "100%",
          }}
        >
          <div style={{ alignItems: "center", display: "flex", gap: 18 }}>
            <svg aria-hidden="true" height="58" viewBox="0 0 512 512" width="58">
              <path
                d="M84 84 168 96 256 334 344 96 428 84 298 430c-4 10-12 16-23 16h-38c-11 0-19-6-23-16Z"
                fill={ink}
              />
            </svg>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1 }}>Oleh Vanin</div>
              <div style={{ color: muted, fontSize: 15, marginTop: 8 }}>{path}</div>
            </div>
          </div>

          <div style={{ display: "flex", flex: "none", gap: 32, height: 286, marginTop: 30, minHeight: 0 }}>
            <div
              style={{
                display: "flex",
                flex: 1,
                flexDirection: "column",
                height: "100%",
                minWidth: 0,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  color: accent,
                  display: "flex",
                  fontSize: 17,
                  fontWeight: 800,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                }}
              >
                {eyebrow}
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: titleSize(title),
                  fontWeight: 900,
                  letterSpacing: -1.8,
                  lineHeight: 1.04,
                  marginTop: 16,
                  maxHeight: 140,
                  overflow: "hidden",
                }}
              >
                {title}
              </div>
              <div
                style={{
                  color: muted,
                  display: "block",
                  fontSize: description.length > 120 ? 21 : 22,
                  fontWeight: 600,
                  lineClamp: 2,
                  lineHeight: 1.3,
                  marginTop: 20,
                  maxHeight: 56,
                  overflow: "hidden",
                }}
              >
                {description}
              </div>
              <div style={{ alignItems: "center", display: "flex", gap: 10, marginTop: "auto" }}>
                {tags.slice(0, 3).map(tag => (
                  <div
                    key={tag}
                    style={{
                      alignItems: "center",
                      background: "#fbfdff",
                      border: `1px solid ${accent}55`,
                      borderRadius: 999,
                      display: "flex",
                      fontSize: 15,
                      height: 36,
                      justifyContent: "center",
                      padding: "0 18px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {tag}
                  </div>
                ))}
                {footer ? (
                  <div style={{ color: muted, display: "flex", fontSize: 15, marginLeft: "auto" }}>{footer}</div>
                ) : null}
              </div>
            </div>

            <div
              style={{
                alignItems: "center",
                background: ink,
                borderRadius: 30,
                color: "#f3f7fd",
                display: "flex",
                flexDirection: "column",
                height: 286,
                justifyContent: "center",
                overflow: "hidden",
                padding: 24,
                position: "relative",
                flexShrink: 0,
                width: 250,
              }}
            >
              <div style={{ color: accent, display: "flex", fontSize: 17, fontWeight: 800, letterSpacing: 2 }}>
                {context.toUpperCase()}
              </div>
              <svg aria-hidden="true" height="112" viewBox="0 0 360 144" width="220">
                <path
                  d="M8 84h70q14-28 34 0h24l16 14 22-82 20 88 22-52 20 32h42q26-32 50 0h44"
                  fill="none"
                  opacity=".22"
                  stroke={accent}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="18"
                />
                <path
                  d="M8 84h70q14-28 34 0h24l16 14 22-82 20 88 22-52 20 32h42q26-32 50 0h44"
                  fill="none"
                  stroke={accent}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="8"
                />
              </svg>
              <div style={{ color: "#f3f7fd", display: "flex", fontSize: 16, opacity: 0.72 }}>exsesx.dev</div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    socialImageSize,
  );
}
