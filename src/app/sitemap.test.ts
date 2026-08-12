import { describe, expect, test } from "bun:test";
import sitemap from "./sitemap";

describe("sitemap", () => {
  test("discovers only published Blog locales and editions", () => {
    const entries = sitemap();
    const englishIndex = entries.find(entry => entry.url === "https://exsesx.dev/blog/en");
    const englishNushellArticle = entries.find(
      entry => entry.url === "https://exsesx.dev/blog/en/switching-from-fish-to-nushell",
    );
    const englishUmbraArticle = entries.find(
      entry => entry.url === "https://exsesx.dev/blog/en/umbra-light-dark-wallpapers",
    );
    const englishArticle = entries.find(entry => entry.url === "https://exsesx.dev/blog/en/codex-agents-v2");
    const englishMemoriesArticle = entries.find(entry => entry.url === "https://exsesx.dev/blog/en/codex-memories");
    const ukrainianIndex = entries.find(entry => entry.url === "https://exsesx.dev/blog/uk");
    const ukrainianNushellArticle = entries.find(
      entry => entry.url === "https://exsesx.dev/blog/uk/switching-from-fish-to-nushell",
    );
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
    const nushellArticleLanguages = {
      en: "https://exsesx.dev/blog/en/switching-from-fish-to-nushell",
      uk: "https://exsesx.dev/blog/uk/switching-from-fish-to-nushell",
      "x-default": "https://exsesx.dev/blog/en/switching-from-fish-to-nushell",
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
    expect(englishNushellArticle).toMatchObject({
      lastModified: new Date("2026-08-11T17:13:21+02:00"),
      alternates: {
        languages: nushellArticleLanguages,
      },
    });
    expect(ukrainianNushellArticle).toMatchObject({
      lastModified: new Date("2026-08-11T17:13:21+02:00"),
      alternates: {
        languages: nushellArticleLanguages,
      },
    });
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
