import { expect, type Page, test } from "@playwright/test";

type CvShareHarness = {
  openCalls: number;
  shareRejectionName: string | null;
  shareCalls: Array<{
    fileName: string | null;
    fileSize: number;
    fileType: string | null;
    userActivationActive: boolean;
  }>;
};

declare global {
  interface Window {
    __cvShareHarness: CvShareHarness;
  }
}

const TEST_PDF = "%PDF-1.7\n1 0 obj\n<<>>\nendobj\n%%EOF";

async function installIosShareHarness(page: Page) {
  await page.addInitScript(() => {
    const harness: CvShareHarness = { openCalls: 0, shareCalls: [], shareRejectionName: null };

    window.__cvShareHarness = harness;

    Object.defineProperty(navigator, "userAgent", {
      configurable: true,
      value:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1",
    });
    Object.defineProperty(navigator, "maxTouchPoints", { configurable: true, value: 5 });
    Object.defineProperty(navigator, "canShare", {
      configurable: true,
      value: () => true,
    });
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: (data: ShareData) => {
        const file = data.files?.[0] ?? null;

        harness.shareCalls.push({
          fileName: file?.name ?? null,
          fileSize: file?.size ?? 0,
          fileType: file?.type ?? null,
          userActivationActive: navigator.userActivation?.isActive ?? false,
        });

        if (harness.shareRejectionName) {
          return Promise.reject(new DOMException("Share rejected", harness.shareRejectionName));
        }

        return Promise.resolve();
      },
    });

    window.open = () => {
      harness.openCalls += 1;
      return null;
    };
  });
}

function readCvShareHarness(page: Page) {
  return page.evaluate(() => window.__cvShareHarness);
}

if (!("Bun" in globalThis)) {
  test.describe("platform UI contracts", () => {
    test("theme dropdown stays anchored and applies a selected mode", async ({ page }) => {
      await page.addInitScript(() => {
        window.localStorage.setItem("exsesx:color-scheme", JSON.stringify("light"));
      });
      await page.goto("/");

      const trigger = page.getByRole("button", { name: "Theme: Light" });
      await trigger.click();

      const menu = page.getByRole("menu", { name: "Theme: Light" });
      await expect(menu).toBeVisible();

      const bounds = await menu.boundingBox();
      const viewport = page.viewportSize();

      expect(bounds).not.toBeNull();
      expect(viewport).not.toBeNull();
      expect(bounds?.x).toBeGreaterThanOrEqual(0);
      expect(bounds?.y).toBeGreaterThanOrEqual(0);
      expect((bounds?.x ?? 0) + (bounds?.width ?? 0)).toBeLessThanOrEqual(viewport?.width ?? 0);

      await page.getByRole("menuitemradio", { name: "Device" }).focus();
      await page.keyboard.press("Tab");
      await expect(menu).toBeHidden();

      await trigger.click();
      await page.getByRole("menuitemradio", { name: "Dark" }).click();

      await expect(menu).toBeHidden();
      await expect(page.locator("html")).toHaveClass(/dark/);
      await expect(page.getByRole("button", { name: "Theme: Dark" })).toBeVisible();
    });

    test("shortcuts use the shared focus-trapping dialog and restore focus", async ({ page, isMobile }) => {
      test.skip(Boolean(isMobile), "shortcuts are intentionally disabled on coarse-only pointers");
      await page.goto("/");

      const trigger = page.getByRole("button", { name: "Toggle keyboard shortcuts" });
      await trigger.click();

      const dialog = page.getByRole("dialog", { name: "Keyboard shortcuts" });
      await expect(dialog).toBeVisible();
      await expect(page.getByRole("button", { name: "Close keyboard shortcuts" })).toBeFocused();

      await page.keyboard.press("Tab");
      await expect(page.getByRole("button", { name: "Close keyboard shortcuts" })).toBeFocused();
      await page.keyboard.press("Shift+Tab");
      await expect(page.getByRole("button", { name: "Close keyboard shortcuts" })).toBeFocused();

      await page.keyboard.press("Escape");

      await expect(dialog).toBeHidden();
      await expect(trigger).toBeFocused();
    });

    test("project motion video starts from a poster and exposes playback control", async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("/project/this-is-language");

      const video = page.locator("video");
      const playbackControl = page.getByRole("button", { name: "Play This is Language motion preview" });

      await expect(video).toBeVisible();
      await expect(video).not.toHaveAttribute("autoplay", "");
      await expect(playbackControl).toBeVisible();
      expect(await playbackControl.evaluate(element => getComputedStyle(element).transitionProperty)).not.toContain(
        "transform",
      );
    });

    test("seasonal logo motion is CSS-owned and respects reduced motion", async ({ page, isMobile }) => {
      test.skip(Boolean(isMobile), "one rendering contract is sufficient");
      await page.goto("/");
      await page.evaluate(() => {
        document.documentElement.dataset.season = "pride";
      });

      const stripes = page.locator(".logo-mark-pride-stripes");
      await expect(stripes).toHaveCSS("animation-name", "logo-pride-stripes");

      await page.emulateMedia({ reducedMotion: "reduce" });
      await expect(stripes).toHaveCSS("animation-name", "none");
    });

    test("native metadata routes reflect current project data", async ({ request, isMobile }) => {
      test.skip(Boolean(isMobile), "route content is viewport-independent");

      const [sitemapResponse, robotsResponse] = await Promise.all([
        request.get("/sitemap.xml"),
        request.get("/robots.txt"),
      ]);
      const sitemap = await sitemapResponse.text();
      const robots = await robotsResponse.text();

      expect(sitemapResponse.ok()).toBe(true);
      expect(sitemap).toContain("https://exsesx.dev/project/controlup");
      expect(sitemap).toContain("https://exsesx.dev/llms.txt");
      expect(robotsResponse.ok()).toBe(true);
      expect(robots).toContain("User-Agent: GPTBot");
      expect(robots).toContain("Sitemap: https://exsesx.dev/sitemap.xml");
    });

    test("iOS prepares a cold CV before invoking share in a fresh click", async ({ page, isMobile }) => {
      test.skip(Boolean(isMobile), "one deterministic Web Share harness is sufficient");

      let releasePdf = () => {};
      const pdfGate = new Promise<void>(resolve => {
        releasePdf = resolve;
      });
      let mainFrameNavigations = 0;
      let pdfRequests = 0;
      let popups = 0;

      page.on("framenavigated", frame => {
        if (frame === page.mainFrame()) {
          mainFrameNavigations += 1;
        }
      });
      page.on("popup", () => {
        popups += 1;
      });
      await installIosShareHarness(page);
      await page.route("**/api/resume/pdf", async route => {
        pdfRequests += 1;
        await pdfGate;
        await route.fulfill({ body: TEST_PDF, contentType: "application/pdf", status: 200 });
      });
      await page.goto("/");
      await page.evaluate(
        () => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
      );

      const initialUrl = page.url();
      const initialMainFrameNavigations = mainFrameNavigations;
      const actionsTrigger = page.getByRole("button", { name: "Show CV actions" });

      await actionsTrigger.click();
      await expect(page.getByRole("menuitem", { name: "Preparing CV" })).toBeDisabled();
      await expect.poll(() => pdfRequests).toBe(1);
      expect(page.url()).toBe(initialUrl);

      releasePdf();

      const shareAction = page.getByRole("menuitem", { name: "Share CV" });
      await expect(shareAction).toBeEnabled();
      await shareAction.click();
      await expect.poll(async () => (await readCvShareHarness(page)).shareCalls.length).toBe(1);

      let harness = await readCvShareHarness(page);
      expect(harness.shareCalls[0]).toMatchObject({
        fileName: "Oleh Vanin CV.pdf",
        fileType: "application/pdf",
        userActivationActive: true,
      });
      expect(harness.shareCalls[0]?.fileSize).toBeGreaterThan(0);
      expect(harness.openCalls).toBe(0);
      expect(popups).toBe(0);
      expect(mainFrameNavigations).toBe(initialMainFrameNavigations);
      expect(page.url()).toBe(initialUrl);

      await page.evaluate(() => {
        window.__cvShareHarness.shareRejectionName = "NotAllowedError";
      });
      await actionsTrigger.click();
      await page.getByRole("menuitem", { name: "Share CV" }).click();
      await expect.poll(async () => (await readCvShareHarness(page)).shareCalls.length).toBe(2);
      await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => resolve())));

      harness = await readCvShareHarness(page);
      expect(harness.shareCalls[1]?.userActivationActive).toBe(true);
      await expect.poll(() => pdfRequests).toBe(1);
      expect(harness.openCalls).toBe(0);
      expect(mainFrameNavigations).toBe(initialMainFrameNavigations);
      expect(page.url()).toBe(initialUrl);

      await page.evaluate(() => {
        window.__cvShareHarness.shareRejectionName = null;
      });
      await actionsTrigger.click();
      await page.getByRole("menuitem", { name: "Share CV" }).click();
      await expect.poll(async () => (await readCvShareHarness(page)).shareCalls.length).toBe(3);
      harness = await readCvShareHarness(page);
      expect(pdfRequests).toBe(1);
      expect(harness.openCalls).toBe(0);
      expect(mainFrameNavigations).toBe(initialMainFrameNavigations);
      expect(page.url()).toBe(initialUrl);
    });

    test("iOS CV preparation failure retries in place without opening the PDF", async ({ page, isMobile }) => {
      test.skip(Boolean(isMobile), "one deterministic Web Share harness is sufficient");

      let releaseRetry = () => {};
      const retryGate = new Promise<void>(resolve => {
        releaseRetry = resolve;
      });
      let mainFrameNavigations = 0;
      let pdfRequests = 0;
      let popups = 0;

      page.on("framenavigated", frame => {
        if (frame === page.mainFrame()) {
          mainFrameNavigations += 1;
        }
      });
      page.on("popup", () => {
        popups += 1;
      });
      await installIosShareHarness(page);
      await page.route("**/api/resume/pdf", async route => {
        pdfRequests += 1;

        if (pdfRequests === 1) {
          await route.fulfill({ body: "unavailable", contentType: "text/plain", status: 503 });
          return;
        }

        await retryGate;
        await route.fulfill({ body: TEST_PDF, contentType: "application/pdf", status: 200 });
      });
      await page.goto("/");
      await page.evaluate(
        () => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
      );

      const initialUrl = page.url();
      const initialMainFrameNavigations = mainFrameNavigations;
      await page.getByRole("button", { name: "Show CV actions" }).click();

      const retryAction = page.getByRole("menuitem", { name: "Retry share" });
      await expect(retryAction).toBeEnabled();
      expect((await readCvShareHarness(page)).openCalls).toBe(0);
      expect(mainFrameNavigations).toBe(initialMainFrameNavigations);
      expect(page.url()).toBe(initialUrl);

      await retryAction.click();
      await expect(page.getByRole("menuitem", { name: "Preparing CV" })).toBeDisabled();
      await expect.poll(() => pdfRequests).toBe(2);
      releaseRetry();

      const shareAction = page.getByRole("menuitem", { name: "Share CV" });
      await expect(shareAction).toBeEnabled();
      await shareAction.click();
      await expect.poll(async () => (await readCvShareHarness(page)).shareCalls.length).toBe(1);

      const harness = await readCvShareHarness(page);
      expect(harness.openCalls).toBe(0);
      expect(popups).toBe(0);
      expect(mainFrameNavigations).toBe(initialMainFrameNavigations);
      expect(page.url()).toBe(initialUrl);
    });
  });
}
