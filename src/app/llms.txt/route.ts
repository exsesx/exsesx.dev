import { siteUrl } from "@/lib/metadata";
import { getProjectPath, projects, specialties } from "@/lib/projects";

export function GET() {
  const projectLinks = projects.map(
    project => `- [${project.name}](${siteUrl}${getProjectPath(project)}): ${project.description}`,
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
    "## CV",
    "",
    `- [Resume (PDF)](${siteUrl}/api/resume/pdf): Current CV as a PDF`,
    "",
    "## Contact",
    "",
    "- [GitHub](https://github.com/exsesx)",
    "- [LinkedIn](https://www.linkedin.com/in/exsesx/)",
    "- [Book a call](https://cal.com/exsesx/meet): Cal.com scheduling link",
    "",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
