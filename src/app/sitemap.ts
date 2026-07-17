import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/metadata";
import { getProjectPath, projects } from "@/lib/projects";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteUrl,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${siteUrl}/projects`,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    ...projects.map(project => ({
      url: `${siteUrl}${getProjectPath(project)}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    {
      url: `${siteUrl}/llms.txt`,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];
}
