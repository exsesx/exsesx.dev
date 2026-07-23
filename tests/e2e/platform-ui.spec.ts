import { expect, type Locator, type Page, test } from "@playwright/test";

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

type ThemeSnapshot = {
  className: string;
  label: string | null;
  mode: string | null;
};

declare global {
  interface Window {
    __cvShareHarness: CvShareHarness;
    __localeSwitchThemeSnapshots: ThemeSnapshot[];
    __themeViewTransitionCalls: number;
  }
}

const TEST_PDF = "%PDF-1.7\n1 0 obj\n<<>>\nendobj\n%%EOF";
const BLOG_ARTICLE_PATH = "/blog/en/codex-agents-v2";
const MERMAID_ARTICLE_PATH = "/blog/en/codex-memories";

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
    test("header keeps the GitHub action compact on mobile", async ({ page, isMobile }) => {
      await page.goto("/project/this-is-language");

      const nav = page.locator(".site-nav-glass");
      const githubLink = nav.getByRole("link", { name: "GitHub" });
      const githubLabel = githubLink.locator("span");
      const githubIcon = githubLink.locator("svg");
      const themeIcon = nav
        .getByRole("button", { name: /^Theme:/ })
        .locator("svg")
        .first();

      await expect(githubLink).toBeVisible();
      await expect(githubIcon).toHaveAttribute("stroke-width", "2.2");
      await expect(themeIcon).toHaveAttribute("stroke-width", "2.2");

      const [githubBounds, navBounds] = await Promise.all([githubLink.boundingBox(), nav.boundingBox()]);
      const viewport = page.viewportSize();

      expect(githubBounds).not.toBeNull();
      expect(navBounds).not.toBeNull();
      expect(viewport).not.toBeNull();
      expect((navBounds?.x ?? 0) + (navBounds?.width ?? 0)).toBeLessThanOrEqual(viewport?.width ?? 0);

      if (isMobile) {
        expect(githubBounds?.width).toBeCloseTo(40, 1);
        expect(githubBounds?.height).toBeCloseTo(40, 1);
        await expect(githubLabel).toHaveCSS("position", "absolute");
      } else {
        expect(githubBounds?.width).toBeGreaterThan(40);
        await expect(githubLabel).toHaveCSS("position", "static");
      }
    });

    test("header gives Back and the logo deliberate room on iPhone 17 Pro", async ({ page, isMobile }) => {
      test.skip(!isMobile, "iPhone 17 Pro mobile contract");
      await page.setViewportSize({ width: 402, height: 874 });
      await page.goto("/project/this-is-language");

      const nav = page.locator(".site-nav-glass");
      const backButton = nav.getByRole("button", { name: "Back" });
      const logoTile = nav.getByRole("link", { name: "Oleh Vanin home" }).locator(".logo-tile");

      await expect(backButton).toBeVisible();
      await expect(logoTile).toBeVisible();

      const [backBounds, logoBounds, navBounds] = await Promise.all([
        backButton.boundingBox(),
        logoTile.boundingBox(),
        nav.boundingBox(),
      ]);
      const viewport = page.viewportSize();

      expect(backBounds).not.toBeNull();
      expect(logoBounds).not.toBeNull();
      expect(navBounds).not.toBeNull();
      expect(viewport).not.toBeNull();
      expect(backBounds?.width).toBeCloseTo(40, 1);
      expect(backBounds?.height).toBeCloseTo(40, 1);
      expect(logoBounds?.width).toBeCloseTo(40, 1);
      expect(logoBounds?.height).toBeCloseTo(40, 1);
      expect((logoBounds?.x ?? 0) - ((backBounds?.x ?? 0) + (backBounds?.width ?? 0))).toBeGreaterThanOrEqual(6);
      expect(navBounds?.x).toBeGreaterThanOrEqual(0);
      expect((navBounds?.x ?? 0) + (navBounds?.width ?? 0)).toBeLessThanOrEqual(viewport?.width ?? 0);
    });

    test("document language follows the Blog locale without changing the site language", async ({ page, isMobile }) => {
      test.skip(Boolean(isMobile), "document language is viewport-independent");

      await page.goto("/");
      await expect(page.locator("html")).toHaveAttribute("lang", "en");

      await page.goto("/blog/en");
      await expect(page.locator("html")).toHaveAttribute("lang", "en");
      await expect(page.locator(".site-header")).toHaveAttribute("lang", "en");

      await page.goto("/blog/uk");
      await expect(page.locator("html")).toHaveAttribute("lang", "uk");
      await expect(page.locator(".site-header")).toHaveAttribute("lang", "en");
      await expect(page.getByRole("heading", { level: 1, name: "Нотатки з майстерні" })).toBeVisible();
    });

    test("Blog locale switching keeps RSS and the device theme stable", async ({ page, isMobile }) => {
      test.skip(Boolean(isMobile), "locale state is viewport-independent");

      const consoleErrors: string[] = [];
      page.on("console", message => {
        if (message.type() === "error") {
          consoleErrors.push(message.text());
        }
      });
      await page.emulateMedia({ colorScheme: "dark" });
      await page.addInitScript(() => {
        window.localStorage.setItem("exsesx:color-scheme", JSON.stringify("system"));
        window.__localeSwitchThemeSnapshots = [];
      });
      await page.goto("/blog/en");

      await expect(page.getByRole("link", { name: "RSS feed" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Theme: Device" })).toBeVisible();
      await expect(page.locator("html")).toHaveClass(/dark/);
      await expect(page.locator("html")).toHaveAttribute("data-theme-mode", "system");

      await page.evaluate(() => {
        window.__localeSwitchThemeSnapshots = [];
        let frames = 0;
        const sampleTheme = () => {
          const themeButton = document.querySelector<HTMLButtonElement>('button[aria-label^="Theme:"]');
          window.__localeSwitchThemeSnapshots.push({
            className: document.documentElement.className,
            label: themeButton?.getAttribute("aria-label") ?? null,
            mode: document.documentElement.dataset.themeMode ?? null,
          });
          frames += 1;
          if (frames < 180) {
            requestAnimationFrame(sampleTheme);
          }
        };
        requestAnimationFrame(sampleTheme);
      });

      await Promise.all([page.waitForURL("**/blog/uk"), page.getByRole("link", { name: "UA", exact: true }).click()]);
      await page.evaluate(
        () => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
      );

      await expect(page.locator("html")).toHaveAttribute("lang", "uk");
      await expect(page.getByRole("link", { name: "RSS-стрічка" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Theme: Device" })).toBeVisible();
      await expect(page.locator("html")).toHaveClass(/dark/);
      await expect(page.locator("html")).toHaveAttribute("data-theme-mode", "system");

      const snapshots = await page.evaluate(() => window.__localeSwitchThemeSnapshots);
      expect(snapshots.length).toBeGreaterThan(0);
      expect(snapshots.every(snapshot => snapshot.className.includes("dark"))).toBe(true);
      expect(snapshots.every(snapshot => snapshot.mode === "system")).toBe(true);
      expect(snapshots.every(snapshot => snapshot.label === "Theme: Device")).toBe(true);
      expect(consoleErrors).not.toContainEqual(expect.stringContaining("Encountered a script tag"));
    });

    test("Blog navigation and article content fit the 390px mobile viewport", async ({ page, isMobile }) => {
      test.skip(!isMobile, "390px mobile contract");

      await page.goto("/projects");
      const blogLink = page.getByRole("link", { name: "Blog", exact: true });
      await expect(blogLink).toBeVisible();
      await expect(blogLink).toHaveAttribute("href", "/blog/en");
      await Promise.all([page.waitForURL("**/blog/en"), blogLink.click()]);

      await expect(page.getByRole("link", { name: "Blog", exact: true })).toHaveAttribute("aria-current", "page");
      await expect(page.locator(".site-nav-active-pill")).toHaveAttribute("data-active-nav", "blog");
      await expect(page.locator("html")).toHaveAttribute("lang", "en");
      await expectPageToFitViewport(page);

      await Promise.all([
        page.waitForURL("**/blog/en/codex-memories"),
        page.getByRole("link", { name: "Read article" }).click(),
      ]);
      await expect(
        page.getByRole("heading", { level: 1, name: "How I use Codex Memories between coding sessions" }),
      ).toBeVisible();
      await expectPageToFitViewport(page);
    });

    test("Mermaid camera preserves scrolling and supports pointer, keyboard, and touch gestures", async ({
      page,
      isMobile,
    }) => {
      await page.goto(MERMAID_ARTICLE_PATH);

      const diagram = page.locator(".blog-mermaid").first();
      const viewport = diagram.getByTestId("mermaid-viewport");
      const toolbar = diagram.getByRole("toolbar", { name: "Diagram controls" });
      const zoomOut = toolbar.getByRole("button", { name: "Zoom out" });
      const resetZoom = toolbar.getByRole("button", { name: /^Reset diagram zoom,/ });
      const zoomIn = toolbar.getByRole("button", { name: "Zoom in" });
      const svg = viewport.locator("svg");

      await expect(diagram).toHaveAttribute("data-state", "ready", { timeout: 15_000 });
      await expect(viewport).toBeVisible();
      await expect(zoomIn).toBeEnabled();
      await expect(toolbar.getByRole("button")).toHaveCount(3);
      await expect(toolbar.getByRole("button", { name: "Move", exact: true })).toHaveCount(0);
      await expect(diagram.getByTestId("mermaid-gesture-hint")).toHaveCount(0);
      await expect(diagram).toHaveAttribute("data-zoom", "100");
      const baseViewBox = await svg.getAttribute("viewBox");
      const zoomInBoundsAt100 = await zoomIn.boundingBox();
      expect(baseViewBox).not.toBeNull();
      expect(zoomInBoundsAt100).not.toBeNull();

      if (!isMobile) {
        await expect(viewport).toHaveCSS("cursor", "default");
        await viewport.click();
        await expect(diagram).toHaveAttribute("data-zoom", "100");
        await viewport.dblclick();
        await expect(diagram).toHaveAttribute("data-zoom", "100");
      }

      await zoomIn.click();
      await expect(diagram).toHaveAttribute("data-zoom", "125");
      await expect(resetZoom).toHaveText("125%");
      if (!isMobile) {
        await expect(viewport).toHaveCSS("cursor", "grab");
      }
      const zoomInBoundsAt125 = await zoomIn.boundingBox();
      expect(zoomInBoundsAt125).not.toBeNull();
      expect(zoomInBoundsAt125?.x).toBeCloseTo(zoomInBoundsAt100?.x ?? 0, 1);
      await zoomOut.click();
      await expect(diagram).toHaveAttribute("data-zoom", "100");
      await zoomIn.click();
      await resetZoom.click();
      await expect(diagram).toHaveAttribute("data-zoom", "100");

      if (isMobile) {
        await pinchMermaidWithPointers(viewport);
        await expect.poll(async () => Number(await diagram.getAttribute("data-zoom"))).toBeGreaterThan(210);
        const viewBoxBeforeTouchDrag = await svg.getAttribute("viewBox");
        await dragMermaidWithTouchPointer(viewport);
        await expect.poll(() => svg.getAttribute("viewBox")).not.toBe(viewBoxBeforeTouchDrag);
        await resetZoom.click();
        await expect(diagram).toHaveAttribute("data-zoom", "100");
        return;
      }

      await viewport.scrollIntoViewIfNeeded();
      const viewportBounds = await viewport.boundingBox();
      expect(viewportBounds).not.toBeNull();
      const pointer = {
        x: (viewportBounds?.x ?? 0) + (viewportBounds?.width ?? 0) / 2,
        y: (viewportBounds?.y ?? 0) + (viewportBounds?.height ?? 0) / 2,
      };
      await page.mouse.move(pointer.x, pointer.y);

      const scrollBeforeWheel = await page.evaluate(() => window.scrollY);
      await page.mouse.wheel(0, 240);
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(scrollBeforeWheel);
      await expect(diagram).toHaveAttribute("data-zoom", "100");

      await viewport.scrollIntoViewIfNeeded();
      const wheelBounds = await viewport.boundingBox();
      expect(wheelBounds).not.toBeNull();
      await page.mouse.move(
        (wheelBounds?.x ?? 0) + (wheelBounds?.width ?? 0) / 2,
        (wheelBounds?.y ?? 0) + (wheelBounds?.height ?? 0) / 2,
      );
      await page.keyboard.down("Control");
      try {
        await page.mouse.wheel(0, -120);
      } finally {
        await page.keyboard.up("Control");
      }
      await expect.poll(async () => Number(await diagram.getAttribute("data-zoom"))).toBeGreaterThan(100);
      await resetZoom.click();

      await zoomIn.click();
      const viewBoxBeforeDrag = await svg.getAttribute("viewBox");
      const [baseX = 0, baseY = 0] = (baseViewBox ?? "").split(/\s+/).map(Number);
      const [currentX = 0, currentY = 0] = (viewBoxBeforeDrag ?? "").split(/\s+/).map(Number);
      const dragDeltaX = currentX > baseX + 0.01 ? 48 : -48;
      const dragDeltaY = currentY > baseY + 0.01 ? 32 : -32;
      await viewport.scrollIntoViewIfNeeded();
      const dragBounds = await viewport.boundingBox();
      expect(dragBounds).not.toBeNull();
      const dragStart = {
        x: (dragBounds?.x ?? 0) + (dragBounds?.width ?? 0) / 2,
        y: (dragBounds?.y ?? 0) + (dragBounds?.height ?? 0) / 2,
      };
      await page.mouse.move(dragStart.x, dragStart.y);
      await page.mouse.down();
      await page.mouse.move(dragStart.x + dragDeltaX, dragStart.y + dragDeltaY, { steps: 4 });
      await page.mouse.up();
      await expect.poll(() => svg.getAttribute("viewBox")).not.toBe(viewBoxBeforeDrag);

      await viewport.focus();
      await expect(viewport).toBeFocused();
      await page.keyboard.press("Home");
      await expect(diagram).toHaveAttribute("data-zoom", "100");
      await expect(svg).toHaveAttribute("viewBox", baseViewBox ?? "");
    });

    test("Blog Focus has no header control and remains a desktop-only shortcut", async ({ page, isMobile }) => {
      await page.goto("/blog/en");
      await expect(page.getByRole("button", { name: "Focus" })).toHaveCount(0);
      await expect(page.locator(".site-nav-glass").getByRole("link", { name: "GitHub" })).toBeVisible();

      await page.goto(BLOG_ARTICLE_PATH);

      const root = page.locator('[data-blog-article="true"]');
      await expect(page.getByRole("button", { name: "Focus" })).toHaveCount(0);
      await expect(page.getByRole("button", { name: "Exit focus" })).toHaveCount(0);

      if (!isMobile) {
        await expect(page.getByRole("button", { name: "Toggle keyboard shortcuts" })).toBeVisible();
      }

      await page.keyboard.press("Control+.");

      if (isMobile) {
        await expect(root).not.toHaveAttribute("data-blog-focus", "true");
        return;
      }

      await expect(root).toHaveAttribute("data-blog-focus", "true");
      await expect(page.locator(".site-header-nav-frame")).toBeHidden();
      await expect(page.locator(".site-header-fade")).toBeHidden();
      await expect(page.locator(".kinetic-backdrop > *").first()).toBeHidden();
      await expect(page.locator(".site-version-tag")).toBeHidden();
      const readingProgress = page.locator(".blog-reading-progress");
      await expect(readingProgress).toBeHidden();
      await page.evaluate(() => {
        const article = document.getElementById("article-content");

        if (!article) {
          throw new Error("Expected article content");
        }

        window.scrollTo(0, article.getBoundingClientRect().top + window.scrollY + 240);
      });
      await expect(readingProgress).toBeVisible();
      await expect(page.locator(".blog-toc-desktop")).toBeVisible();

      await page.keyboard.press("Control+.");
      await expect(root).not.toHaveAttribute("data-blog-focus", "true");
    });

    test("Blog Focus shortcuts respect dialog, reading focus, and Back Escape precedence", async ({
      page,
      isMobile,
    }) => {
      test.skip(Boolean(isMobile), "explicit Focus is a desktop-only shortcut");
      await page.goto(BLOG_ARTICLE_PATH);

      const root = page.locator('[data-blog-article="true"]');
      const dialog = page.getByRole("dialog", { name: "Keyboard shortcuts" });
      const themeTrigger = page.getByRole("button", { name: "Theme: Device" });

      await themeTrigger.click();
      await expect(page.getByRole("menu", { name: "Theme: Device" })).toBeVisible();

      await page.keyboard.press("Control+.");
      await expect(root).toHaveAttribute("data-blog-focus", "true");
      await expect(page.getByRole("menu", { name: "Theme: Device" })).toBeHidden();
      await expect(page.locator("#main-content")).toBeFocused();
      await page.keyboard.press("Control+.");
      await expect(root).not.toHaveAttribute("data-blog-focus", "true");
      await page.keyboard.press("Control+.");
      await expect(root).toHaveAttribute("data-blog-focus", "true");

      await page.keyboard.press("Control+/");
      await expect(dialog).toBeVisible();

      await page.keyboard.press("Escape");
      await expect(dialog).toBeHidden();
      await expect(root).toHaveAttribute("data-blog-focus", "true");
      await expect(page.locator("#main-content")).toBeFocused();

      await page.keyboard.press("Escape");
      await expect(root).not.toHaveAttribute("data-blog-focus", "true");
      await expect(page).toHaveURL(new RegExp(`${BLOG_ARTICLE_PATH}$`));

      await Promise.all([page.waitForURL("**/blog/en"), page.keyboard.press("Escape")]);
      await page.goBack();
      await expect(page).toHaveURL(new RegExp(`${BLOG_ARTICLE_PATH}$`));
      await expect(page.locator('[data-blog-article="true"]')).not.toHaveAttribute("data-blog-focus", "true");
    });

    test("passive Blog header starts hidden at a restored reading position", async ({ page, isMobile }) => {
      await page.goto(BLOG_ARTICLE_PATH);

      const root = page.locator('[data-blog-article="true"]');
      const headerFrame = page.locator(".site-header-nav-frame");

      await page.evaluate(() => {
        const article = document.getElementById("article-content");
        if (!article) {
          throw new Error("Blog article content is missing");
        }

        const articleTop = article.getBoundingClientRect().top + window.scrollY;
        window.scrollTo(0, articleTop + 240);
      });
      await page.evaluate(
        () => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
      );

      await expect(root).toHaveAttribute("data-blog-passive-hidden", "true");
      await expect(headerFrame).toBeHidden();

      if (isMobile) {
        await page.locator("body").dispatchEvent("touchmove");
        await page.evaluate(() => window.scrollBy(0, 160));
      } else {
        const viewport = page.viewportSize();
        expect(viewport).not.toBeNull();
        await page.mouse.move((viewport?.width ?? 1280) / 2, (viewport?.height ?? 900) / 2);
        await page.mouse.wheel(0, 160);
      }

      await expect(root).toHaveAttribute("data-blog-passive-hidden", "true");
      await expect(headerFrame).toBeHidden();

      if (isMobile) {
        await page.locator("body").dispatchEvent("touchmove");
        await page.evaluate(() => window.scrollBy(0, -320));
      } else {
        await page.mouse.wheel(0, -320);
      }

      await expect(root).not.toHaveAttribute("data-blog-passive-hidden", "true");
      await expect(headerFrame).toBeVisible();
    });

    test("theme dropdown stays anchored and applies a selected mode", async ({ page }) => {
      await page.addInitScript(() => {
        window.localStorage.setItem("exsesx:color-scheme", JSON.stringify("light"));
        window.__themeViewTransitionCalls = 0;
        document.startViewTransition = (options => {
          window.__themeViewTransitionCalls += 1;
          const updateCallback = typeof options === "function" ? options : options?.update;
          void updateCallback?.();
          return { finished: Promise.resolve() } as ViewTransition;
        }) as Document["startViewTransition"];
      });
      await page.goto("/");

      const trigger = page.getByRole("button", { name: "Theme: Light" });
      await trigger.click();

      const menu = page.getByRole("menu");
      await expect(menu).toBeVisible();
      await expect(menu).toHaveAccessibleName("Theme: Light");

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
      const darkTrigger = page.getByRole("button", { name: "Theme: Dark" });
      await expect(darkTrigger).toBeVisible();

      await darkTrigger.press("Enter");
      await expect(menu).toBeVisible();
      await page.keyboard.press("Home");
      await expect(page.getByRole("menuitemradio", { name: "Light" })).toBeFocused();
      await page.keyboard.press("Enter");

      await expect(menu).toBeHidden();
      await expect(page.locator("html")).toHaveClass(/light/);
      await expect(page.getByRole("button", { name: "Theme: Light" })).toBeVisible();
      expect(await page.evaluate(() => window.__themeViewTransitionCalls)).toBe(0);
    });

    test("changing theme mode without changing its resolved color skips the sweep", async ({ page }) => {
      await page.emulateMedia({ colorScheme: "dark" });
      await page.addInitScript(() => {
        window.localStorage.setItem("exsesx:color-scheme", JSON.stringify("system"));
        window.__themeViewTransitionCalls = 0;
        document.startViewTransition = (options => {
          window.__themeViewTransitionCalls += 1;
          const updateCallback = typeof options === "function" ? options : options?.update;
          void updateCallback?.();
          return { finished: Promise.resolve() } as ViewTransition;
        }) as Document["startViewTransition"];
      });
      await page.goto("/");

      await expect(page.locator("html")).toHaveAttribute("data-theme-mode", "system");
      await expect(page.locator("html")).toHaveClass(/dark/);
      await page.getByRole("button", { name: "Theme: Device" }).click();
      await page.getByRole("menuitemradio", { name: "Dark" }).click();

      await expect(page.getByRole("button", { name: "Theme: Dark" })).toBeVisible();
      await expect.poll(() => page.evaluate(() => window.localStorage.getItem("exsesx:color-scheme"))).toBe('"dark"');
      expect(await page.evaluate(() => window.__themeViewTransitionCalls)).toBe(0);
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

async function expectPageToFitViewport(page: Page) {
  await expect.poll(() => page.evaluate(() => window.innerWidth)).toBe(390);
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth))
    .toBeLessThanOrEqual(0);

  const [mainBounds, navBounds] = await Promise.all([
    page.locator("main").boundingBox(),
    page.locator(".site-nav-glass").boundingBox(),
  ]);

  expect(mainBounds).not.toBeNull();
  expect(navBounds).not.toBeNull();
  expect(mainBounds?.x ?? -1).toBeGreaterThanOrEqual(0);
  expect((mainBounds?.x ?? 0) + (mainBounds?.width ?? 0)).toBeLessThanOrEqual(391);
  expect(navBounds?.x ?? -1).toBeGreaterThanOrEqual(0);
  expect((navBounds?.x ?? 0) + (navBounds?.width ?? 0)).toBeLessThanOrEqual(391);
}

async function pinchMermaidWithPointers(viewport: Locator) {
  await viewport.scrollIntoViewIfNeeded();
  const bounds = await viewport.boundingBox();
  expect(bounds).not.toBeNull();

  const centerX = (bounds?.x ?? 0) + (bounds?.width ?? 0) / 2;
  const centerY = (bounds?.y ?? 0) + (bounds?.height ?? 0) / 2;
  const pointer = (pointerId: number, clientX: number, isPrimary: boolean, buttons: number) => ({
    bubbles: true,
    button: 0,
    buttons,
    cancelable: true,
    clientX,
    clientY: centerY,
    composed: true,
    isPrimary,
    pointerId,
    pointerType: "touch",
  });
  const firstStart = pointer(41, centerX - 24, true, 1);
  const secondStart = pointer(42, centerX + 24, false, 1);

  await viewport.dispatchEvent("pointerdown", firstStart);
  await viewport.dispatchEvent("pointerdown", secondStart);

  for (let step = 1; step <= 4; step += 1) {
    const halfDistance = 24 + step * 6;
    await viewport.dispatchEvent("pointermove", pointer(41, centerX - halfDistance, true, 1));
    await viewport.dispatchEvent("pointermove", pointer(42, centerX + halfDistance, false, 1));
  }

  await viewport.dispatchEvent("pointerup", pointer(41, centerX - 48, true, 0));
  await viewport.dispatchEvent("pointerup", pointer(42, centerX + 48, false, 0));
}

async function dragMermaidWithTouchPointer(viewport: Locator) {
  const bounds = await viewport.boundingBox();
  expect(bounds).not.toBeNull();

  const startX = (bounds?.x ?? 0) + (bounds?.width ?? 0) / 2;
  const startY = (bounds?.y ?? 0) + (bounds?.height ?? 0) / 2;
  const pointer = (clientX: number, clientY: number, buttons: number) => ({
    bubbles: true,
    button: 0,
    buttons,
    cancelable: true,
    clientX,
    clientY,
    composed: true,
    isPrimary: true,
    pointerId: 43,
    pointerType: "touch",
  });

  await viewport.dispatchEvent("pointerdown", pointer(startX, startY, 1));
  await viewport.dispatchEvent("pointermove", pointer(startX + 48, startY + 32, 1));
  await viewport.dispatchEvent("pointerup", pointer(startX + 48, startY + 32, 0));
}
