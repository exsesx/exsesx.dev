import { describe, expect, test } from "bun:test";
import { buildHomeStructuredData, buildProjectsStructuredData } from "./structured-data";

describe("buildHomeStructuredData", () => {
  test("describes the visible profile page, person, and website", () => {
    const structuredData = buildHomeStructuredData();

    expect(structuredData["@context"]).toBe("https://schema.org");
    expect(structuredData["@graph"]).toHaveLength(3);

    const graph = structuredData["@graph"];
    const profilePage = graph.find(item => item["@type"] === "ProfilePage");
    const person = graph.find(item => item["@type"] === "Person");
    const website = graph.find(item => item["@type"] === "WebSite");

    expect(profilePage).toMatchObject({
      "@id": "https://exsesx.dev/#profile",
      url: "https://exsesx.dev",
      name: "Oleh Vanin - Software Engineer",
    });
    expect(profilePage?.mainEntity).toEqual({ "@id": "https://exsesx.dev/#person" });
    expect(person).toMatchObject({
      "@id": "https://exsesx.dev/#person",
      name: "Oleh Vanin",
      jobTitle: "Senior Full Stack Engineer / AI Engineer",
      url: "https://exsesx.dev",
      nationality: {
        "@type": "Country",
        name: "Ukraine",
      },
      homeLocation: {
        "@type": "Country",
        name: "Poland",
      },
    });
    expect(person?.sameAs).toEqual(["https://github.com/exsesx", "https://www.linkedin.com/in/exsesx/"]);

    expect(website).toMatchObject({
      "@id": "https://exsesx.dev/#website",
      name: "exsesx.dev",
      url: "https://exsesx.dev",
    });
    expect(website?.publisher).toEqual({ "@id": "https://exsesx.dev/#person" });
  });
});

describe("buildProjectsStructuredData", () => {
  test("describes the visible projects index as an item list", () => {
    const structuredData = buildProjectsStructuredData();

    expect(structuredData["@context"]).toBe("https://schema.org");
    expect(structuredData["@graph"]).toHaveLength(1);

    const projects = structuredData["@graph"][0];

    expect(projects).toMatchObject({
      "@id": "https://exsesx.dev/projects#itemlist",
      name: "Featured projects",
      numberOfItems: 7,
    });
    expect(projects?.itemListElement).toHaveLength(7);
    expect(projects?.itemListElement[0]).toMatchObject({
      "@type": "ListItem",
      position: 1,
      item: {
        "@type": "CreativeWork",
        name: "ControlUp",
        url: "https://exsesx.dev/project/controlup",
      },
    });
  });
});
