import type { Metadata } from "next";

export const siteUrl = "https://exsesx.dev";
export const siteName = "exsesx.dev";

const socialPreviewPath = "/images/social-preview.png";
const previewDeploymentUrl = process.env.VERCEL_BRANCH_URL ?? process.env.VERCEL_URL;
const socialImageOrigin =
  process.env.VERCEL_ENV === "preview" && previewDeploymentUrl ? `https://${previewDeploymentUrl}` : siteUrl;

export const defaultSocialImage = {
  url: `${socialImageOrigin}${socialPreviewPath}`,
  width: 1200,
  height: 630,
  alt: "Abstract website preview for Oleh Vanin's engineering portfolio",
  type: "image/png",
} as const;

type SocialImage = {
  url: string;
  width: number;
  height: number;
  alt: string;
  type?: string;
};

export function getCanonicalUrl(path = "/") {
  return path === "/" ? siteUrl : `${siteUrl}${path}`;
}

export function createPageMetadata({
  title,
  description,
  path = "/",
  image = defaultSocialImage,
}: {
  title: string;
  description: string;
  path?: string;
  image?: SocialImage;
}): Metadata {
  const url = getCanonicalUrl(path);

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      url,
      siteName,
      title,
      description,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [
        {
          url: image.url,
          alt: image.alt,
        },
      ],
    },
  };
}
