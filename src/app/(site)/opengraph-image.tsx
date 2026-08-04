import { buildProfileSocialImageOptions, buildSocialImageMetadata, createSocialImage } from "@/lib/social-image";

export function generateImageMetadata() {
  return [
    buildSocialImageMetadata({
      id: "profile",
      alt: "Stylized website preview for Oleh Vanin's engineering portfolio",
    }),
  ];
}

export default function OpenGraphImage() {
  return createSocialImage(buildProfileSocialImageOptions());
}
