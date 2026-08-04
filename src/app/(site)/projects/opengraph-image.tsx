import { buildSocialImageMetadata, createSocialImage } from "@/lib/social-image";

export function generateImageMetadata() {
  return [
    buildSocialImageMetadata({
      id: "projects",
      alt: "Stylized projects preview for Oleh Vanin's engineering portfolio",
    }),
  ];
}

export default function OpenGraphImage() {
  return createSocialImage({
    eyebrow: "Selected projects",
    title: "Built across real constraints",
    description: "AI, enterprise IT, pricing, fintech, education, commerce, utilities, and digital assets.",
    path: "exsesx.dev/projects",
    context: "Projects",
    tags: ["AI systems", "Product engineering", "Developer tools"],
  });
}
