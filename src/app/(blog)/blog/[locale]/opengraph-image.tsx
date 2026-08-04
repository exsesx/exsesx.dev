import { notFound } from "next/navigation";
import { isBlogLocale } from "@/lib/blog";
import { buildSocialImageMetadata, createSocialImage } from "@/lib/social-image";

export function generateImageMetadata() {
  return [
    buildSocialImageMetadata({
      id: "blog",
      alt: "The exsesx.dev technical Blog by Oleh Vanin",
    }),
  ];
}

export default async function OpenGraphImage({ params }: PageProps<"/blog/[locale]">) {
  const { locale } = await params;

  if (!isBlogLocale(locale)) {
    notFound();
  }

  return createSocialImage({
    eyebrow: "Technical writing",
    title: "Notes from the workbench",
    description: "Source-audited field notes on AI systems, product engineering, and developer tools.",
    path: "exsesx.dev/blog",
    context: "Blog",
    tags: ["Build", "Verify", "Write"],
  });
}
