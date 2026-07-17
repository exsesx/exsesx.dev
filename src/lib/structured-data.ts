import { defaultSocialImage, siteName, siteUrl } from "./metadata";
import { getProjectPath, projects, specialties } from "./projects";
import { SITE_PROFILE } from "./site-profile";

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
        description: SITE_PROFILE.description,
        isPartOf: { "@id": websiteId },
        mainEntity: { "@id": personId },
      },
      {
        "@type": "Person",
        "@id": personId,
        name: SITE_PROFILE.name,
        url: siteUrl,
        image: absoluteUrl("/images/me/oleh_portrait.jpg"),
        jobTitle: SITE_PROFILE.role,
        nationality: {
          "@type": "Country",
          name: SITE_PROFILE.nationality,
        },
        homeLocation: {
          "@type": "Country",
          name: SITE_PROFILE.location,
        },
        knowsAbout: specialties,
        sameAs: [SITE_PROFILE.links.github, SITE_PROFILE.links.linkedin],
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
