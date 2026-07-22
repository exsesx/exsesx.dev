import { describe, expect, test } from "bun:test";
import sitemap from "./sitemap";

describe("sitemap", () => {
  test("discovers only published Blog locales and editions", () => {
    const entries = sitemap();
    const englishIndex = entries.find(entry => entry.url === "https://exsesx.dev/blog/en");
    const englishArticle = entries.find(entry => entry.url === "https://exsesx.dev/blog/en/codex-agents-v2");
    const ukrainianIndex = entries.find(entry => entry.url === "https://exsesx.dev/blog/uk");
    const ukrainianArticle = entries.find(entry => entry.url === "https://exsesx.dev/blog/uk/codex-agents-v2");
    const articleLanguages = {
      en: "https://exsesx.dev/blog/en/codex-agents-v2",
      uk: "https://exsesx.dev/blog/uk/codex-agents-v2",
      "x-default": "https://exsesx.dev/blog/en/codex-agents-v2",
    };

    expect(englishIndex).toBeDefined();
    expect(ukrainianIndex).toBeDefined();
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
  });
});
