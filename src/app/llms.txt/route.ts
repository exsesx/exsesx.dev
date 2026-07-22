import { getBlogPosts } from "@/content/blog/manifest";
import { getBlogPostPath } from "@/lib/blog";
import { siteUrl } from "@/lib/metadata";
import { getProjectPath, projects, specialties } from "@/lib/projects";
import { SITE_PROFILE } from "@/lib/site-profile";

export const dynamic = "force-static";

export function GET() {
  const projectLinks = projects.map(
    project => `- [${project.name}](${siteUrl}${getProjectPath(project)}): ${project.description}`,
  );
  const blogLinks = getBlogPosts("en", { includeDrafts: false }).map(
    post => `- [${post.title}](${siteUrl}${getBlogPostPath("en", post.slug)}): ${post.description}`,
  );

  const body = [
    "# Oleh Vanin - exsesx.dev",
    "",
    "> Personal portfolio of Oleh Vanin, a senior full-stack engineer and AI engineer based in Poland, building scalable product systems with React, Next.js, Node.js, Go, cloud infrastructure, and LLM workflows.",
    "",
    `Specialties: ${specialties.join(", ")}.`,
    "",
    "## Projects",
    "",
    `- [All projects](${siteUrl}/projects): Index of selected work`,
    ...projectLinks,
    "",
    "## Blog",
    "",
    `- [Blog](${siteUrl}/blog/en): Technical writing about AI systems, product engineering, and developer tools`,
    ...blogLinks,
    "",
    "## CV",
    "",
    `- [Resume (PDF)](${siteUrl}/api/resume/pdf): Current CV as a PDF`,
    "",
    "## Contact",
    "",
    `- [GitHub](${SITE_PROFILE.links.github})`,
    `- [LinkedIn](${SITE_PROFILE.links.linkedin})`,
    `- [Book a call](${SITE_PROFILE.links.booking}): Cal.com scheduling link`,
    "",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
