import { expect, test } from "@playwright/test";

declare global {
  interface Window {
    __documentMarker?: string;
    __headerNode?: Element | null;
  }
}

if (!("Bun" in globalThis)) {
  test.describe("shared root document", () => {
    test("serves each blog locale's lang in the static HTML", async ({ request }) => {
      const ukResponse = await request.get("/blog/uk");
      const enResponse = await request.get("/blog/en");

      expect(await ukResponse.text()).toContain('<html lang="uk"');
      expect(await enResponse.text()).toContain('<html lang="en"');
    });

    test("moves between the site and both blog locales without a document load", async ({ page }) => {
      const pageErrors: string[] = [];
      page.on("pageerror", error => pageErrors.push(error.message));

      await page.goto("/");
      await page.evaluate(() => {
        window.__documentMarker = "kept";
        window.__headerNode = document.querySelector("header");
      });

      const readDocument = () =>
        page.evaluate(() => ({
          lang: document.documentElement.lang,
          marker: window.__documentMarker,
          sameHeader: document.querySelector("header") === window.__headerNode,
          skipLink: document.querySelector(".skip-to-content")?.textContent,
        }));

      await Promise.all([page.waitForURL("**/blog/en"), page.locator('a[href="/blog/en"]').first().click()]);

      expect(await readDocument()).toEqual({
        lang: "en",
        marker: "kept",
        sameHeader: true,
        skipLink: "Skip to main content",
      });

      await Promise.all([page.waitForURL("**/blog/uk"), page.locator('a.blog-locale-link[href="/blog/uk"]').click()]);

      expect(await readDocument()).toEqual({
        lang: "uk",
        marker: "kept",
        sameHeader: true,
        skipLink: "Перейти до основного вмісту",
      });

      await Promise.all([page.waitForURL(/\/$/), page.locator('header a[href="/"]').first().click()]);

      expect(await readDocument()).toEqual({
        lang: "en",
        marker: "kept",
        sameHeader: true,
        skipLink: "Skip to main content",
      });
      expect(pageErrors).toEqual([]);
    });
  });
}
