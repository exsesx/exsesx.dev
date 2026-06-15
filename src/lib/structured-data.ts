import { defaultSocialImage, siteName, siteUrl } from "./metadata";
import { getProjectPath, projects, specialties } from "./projects";

type JsonObject = Record<string, unknown>;

function absoluteUrl(path: string) {
  return path.startsWith("http") ? path : `${siteUrl}${path}`;
}

export function serializeStructuredData(data: JsonObject) {
  return JSON.stringify(data).replaceAll("</", "<\\/");
}

export function buildHomeStructuredData() {
  const personId = `${siteUrl}/#person`;
  const websiteId = `${siteUrl}/#website`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfilePage",
        "@id": `${siteUrl}/#profile`,
        url: siteUrl,
        name: "Oleh Vanin - Software Engineer",
        description:
          "Oleh Vanin is a Ukrainian Senior Full Stack Engineer / AI Engineer based in Poland, building practical AI systems, full-stack products, MCP servers, LLM workflows, and developer tools.",
        isPartOf: { "@id": websiteId },
        mainEntity: { "@id": personId },
      },
      {
        "@type": "Person",
        "@id": personId,
        name: "Oleh Vanin",
        url: siteUrl,
        image: absoluteUrl("/images/me/oleh_portrait.jpg"),
        jobTitle: "Senior Full Stack Engineer / AI Engineer",
        nationality: {
          "@type": "Country",
          name: "Ukraine",
        },
        homeLocation: {
          "@type": "Country",
          name: "Poland",
        },
        knowsAbout: specialties,
        sameAs: ["https://github.com/exsesx", "https://www.linkedin.com/in/exsesx/"],
      },
      {
        "@type": "WebSite",
        "@id": websiteId,
        name: siteName,
        url: siteUrl,
        description: "Personal portfolio of Oleh Vanin, a senior full-stack engineer and AI engineer based in Poland.",
        publisher: { "@id": personId },
        image: defaultSocialImage.url,
      },
    ],
  } as const;
}

export function buildProjectsStructuredData() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ItemList",
        "@id": `${siteUrl}/projects#itemlist`,
        name: "Featured projects",
        url: `${siteUrl}/projects`,
        numberOfItems: projects.length,
        itemListElement: projects.map((project, index) => ({
          "@type": "ListItem",
          position: index + 1,
          item: {
            "@type": "CreativeWork",
            "@id": `${siteUrl}${getProjectPath(project)}#project`,
            name: project.name,
            url: `${siteUrl}${getProjectPath(project)}`,
            description: project.description,
            about: project.tags,
          },
        })),
      },
    ],
  } as const;
}
