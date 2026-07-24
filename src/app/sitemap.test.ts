import { describe, expect, test } from "bun:test";
import sitemap from "./sitemap";

describe("sitemap", () => {
  test("discovers only published Blog locales and editions", () => {
    const entries = sitemap();
    const englishIndex = entries.find(entry => entry.url === "https://exsesx.dev/blog/en");
    const englishUmbraArticle = entries.find(
      entry => entry.url === "https://exsesx.dev/blog/en/umbra-light-dark-wallpapers",
    );
    const englishArticle = entries.find(entry => entry.url === "https://exsesx.dev/blog/en/codex-agents-v2");
    const englishMemoriesArticle = entries.find(entry => entry.url === "https://exsesx.dev/blog/en/codex-memories");
    const ukrainianIndex = entries.find(entry => entry.url === "https://exsesx.dev/blog/uk");
    const ukrainianUmbraArticle = entries.find(
      entry => entry.url === "https://exsesx.dev/blog/uk/umbra-light-dark-wallpapers",
    );
    const ukrainianArticle = entries.find(entry => entry.url === "https://exsesx.dev/blog/uk/codex-agents-v2");
    const ukrainianMemoriesArticle = entries.find(entry => entry.url === "https://exsesx.dev/blog/uk/codex-memories");
    const umbraArticleLanguages = {
      en: "https://exsesx.dev/blog/en/umbra-light-dark-wallpapers",
      uk: "https://exsesx.dev/blog/uk/umbra-light-dark-wallpapers",
      "x-default": "https://exsesx.dev/blog/en/umbra-light-dark-wallpapers",
    };
    const articleLanguages = {
      en: "https://exsesx.dev/blog/en/codex-agents-v2",
      uk: "https://exsesx.dev/blog/uk/codex-agents-v2",
      "x-default": "https://exsesx.dev/blog/en/codex-agents-v2",
    };
    const memoriesArticleLanguages = {
      en: "https://exsesx.dev/blog/en/codex-memories",
      uk: "https://exsesx.dev/blog/uk/codex-memories",
      "x-default": "https://exsesx.dev/blog/en/codex-memories",
    };

    expect(englishIndex).toBeDefined();
    expect(ukrainianIndex).toBeDefined();
    expect(englishUmbraArticle).toMatchObject({
      lastModified: new Date("2026-07-24T14:15:00+02:00"),
      alternates: {
        languages: umbraArticleLanguages,
      },
    });
    expect(ukrainianUmbraArticle).toMatchObject({
      lastModified: new Date("2026-07-24T14:15:00+02:00"),
      alternates: {
        languages: umbraArticleLanguages,
      },
    });
    expect(englishArticle).toMatchObject({
      lastModified: new Date("2026-07-22T12:00:00+02:00"),
      alternates: {
        languages: articleLanguages,
      },
    });
    expect(ukrainianArticle).toMatchObject({
      lastModified: new Date("2026-07-22T12:00:00+02:00"),
      alternates: {
        languages: articleLanguages,
      },
    });
    expect(englishMemoriesArticle).toMatchObject({
      lastModified: new Date("2026-07-23T10:30:00+02:00"),
      alternates: {
        languages: memoriesArticleLanguages,
      },
    });
    expect(ukrainianMemoriesArticle).toMatchObject({
      lastModified: new Date("2026-07-23T10:30:00+02:00"),
      alternates: {
        languages: memoriesArticleLanguages,
      },
    });
  });
});
