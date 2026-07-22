import { describe, expect, test } from "bun:test";
import { getBlogPost, getBlogPosts } from "@/content/blog/manifest";
import {
  buildBlogIndexStructuredData,
  buildBlogPostingStructuredData,
  buildHomeStructuredData,
  buildProjectsStructuredData,
} from "./structured-data";

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

describe("Blog structured data", () => {
  test("describes the visible article as a BlogPosting by Oleh Vanin", () => {
    const article = getBlogPost("en", "codex-agents-v2", { includeDrafts: false });

    if (!article) {
      throw new Error("Expected the published English article fixture");
    }

    expect(buildBlogPostingStructuredData(article)).toMatchObject({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "@id": "https://exsesx.dev/blog/en/codex-agents-v2#article",
      url: "https://exsesx.dev/blog/en/codex-agents-v2",
      headline: "Codex Agents V2 in 0.145.0: what changed and how to enable it",
      inLanguage: "en",
      datePublished: "2026-07-22T12:00:00+02:00",
      author: {
        "@type": "Person",
        "@id": "https://exsesx.dev/#person",
        name: "Oleh Vanin",
      },
    });
  });

  test("lists only visible posts on a localized Blog index", () => {
    const posts = getBlogPosts("en", { includeDrafts: false });
    const data = buildBlogIndexStructuredData("en", posts);

    expect(data["@graph"][0]).toMatchObject({
      "@type": "ItemList",
      "@id": "https://exsesx.dev/blog/en#itemlist",
      numberOfItems: 1,
    });
  });
});
