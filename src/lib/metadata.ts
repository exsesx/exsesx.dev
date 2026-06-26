import type { Metadata } from "next";

export const siteUrl = "https://exsesx.dev";
export const siteName = "exsesx.dev";

const socialPreviewPath = "/images/social-preview.png";
// Bump to force social platforms (Telegram, X, LinkedIn, Slack) to re-scrape
// cached previews — they cache og:image by URL.
const socialImageVersion = "3";
const previewDeploymentUrl = process.env.VERCEL_BRANCH_URL ?? process.env.VERCEL_URL;
const socialImageOrigin =
  process.env.VERCEL_ENV === "preview" && previewDeploymentUrl ? `https://${previewDeploymentUrl}` : siteUrl;

function createSocialImage(path: string, alt: string) {
  return {
    url: `${socialImageOrigin}${path}?v=${socialImageVersion}`,
    width: 1200,
    height: 630,
    alt,
    type: "image/png",
  } as const;
}

export const defaultSocialImage = createSocialImage(
  socialPreviewPath,
  "Stylized website preview for Oleh Vanin's engineering portfolio",
);

export const projectsSocialImage = createSocialImage(
  "/images/og/projects.png",
  "Stylized projects preview for Oleh Vanin's engineering portfolio",
);

export function createProjectSocialImage(slug: string, name: string) {
  return createSocialImage(
    `/images/og/project-${slug}.png`,
    `Stylized social preview for the ${name} project by Oleh Vanin`,
  );
}

type SocialImage = {
  url: string;
  width: number;
  height: number;
  alt: string;
  type?: string;
};

function getCanonicalUrl(path = "/") {
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
