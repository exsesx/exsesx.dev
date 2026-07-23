import { expect, type Locator, type Page, test } from "@playwright/test";

const BLOG_ARTICLE_PATH = "/blog/en/codex-agents-v2";
const MERMAID_ARTICLE_PATH = "/blog/en/codex-memories";

if (!("Bun" in globalThis)) {
  test.describe("iPhone 17 Pro Safari contracts", () => {
    test("header actions fit without crowding Back and the logo", async ({ page }) => {
      await page.goto(BLOG_ARTICLE_PATH);

      const nav = page.locator(".site-nav-glass");
      const backButton = nav.getByRole("button", { name: "Back" });
      const logoTile = nav.getByRole("link", { name: "Oleh Vanin home" }).locator(".logo-tile");
      const githubIcon = nav.getByRole("link", { name: "GitHub" }).locator("svg");
      const themeIcon = nav
        .getByRole("button", { name: /^Theme:/ })
        .locator("svg")
        .first();

      await expect(nav).toBeVisible();
      await expect(backButton).toBeVisible();
      await expect(logoTile).toBeVisible();
      await expect(githubIcon).toHaveAttribute("stroke-width", "2.2");
      await expect(themeIcon).toHaveAttribute("stroke-width", "2.2");

      const [navBounds, backBounds, logoBounds] = await Promise.all([
        nav.boundingBox(),
        backButton.boundingBox(),
        logoTile.boundingBox(),
      ]);
      const viewport = page.viewportSize();

      expect(navBounds).not.toBeNull();
      expect(backBounds).not.toBeNull();
      expect(logoBounds).not.toBeNull();
      expect(viewport).not.toBeNull();
      expect(backBounds?.width).toBeCloseTo(40, 1);
      expect(backBounds?.height).toBeCloseTo(40, 1);
      expect(logoBounds?.width).toBeCloseTo(40, 1);
      expect(logoBounds?.height).toBeCloseTo(40, 1);
      expect((logoBounds?.x ?? 0) - ((backBounds?.x ?? 0) + (backBounds?.width ?? 0))).toBeGreaterThanOrEqual(6);
      expect(navBounds?.x).toBeGreaterThanOrEqual(0);
      expect((navBounds?.x ?? 0) + (navBounds?.width ?? 0)).toBeLessThanOrEqual(viewport?.width ?? 0);
    });

    test("Mermaid accepts pinch and drag gestures in iPhone Safari", async ({ page }) => {
      await page.goto(MERMAID_ARTICLE_PATH);

      const diagram = page.locator(".blog-mermaid").first();
      const viewport = diagram.getByTestId("mermaid-viewport");
      const toolbar = diagram.getByRole("toolbar", { name: "Diagram controls" });
      const svg = viewport.locator("svg");

      await expect(diagram).toHaveAttribute("data-state", "ready", { timeout: 15_000 });
      await expect(viewport).toHaveRole("img");
      await expect(viewport).toHaveAccessibleName("Codex local memory pipeline");
      await expect(svg).toBeVisible();
      await expect(toolbar.getByRole("button", { name: "Zoom in" })).toBeEnabled();
      await expect(toolbar.getByRole("button")).toHaveCount(3);
      await expect(toolbar.getByRole("button", { name: "Move", exact: true })).toHaveCount(0);
      await expect(toolbar.getByRole("button", { name: "Zoom out" })).toBeDisabled();
      const resetZoom = toolbar.getByRole("button", { name: /^Reset diagram zoom,/ });
      await expect(resetZoom).toBeDisabled();
      await expect(resetZoom).toHaveCSS("appearance", "none");
      await expect(resetZoom).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");

      const [bounds, diagramBounds, toolbarBounds, zoomInBounds] = await Promise.all([
        viewport.boundingBox(),
        diagram.boundingBox(),
        toolbar.boundingBox(),
        toolbar.getByRole("button", { name: "Zoom in" }).boundingBox(),
      ]);
      const pageViewport = page.viewportSize();
      expect(bounds).not.toBeNull();
      expect(diagramBounds).not.toBeNull();
      expect(toolbarBounds).not.toBeNull();
      expect(zoomInBounds).not.toBeNull();
      expect(pageViewport).not.toBeNull();
      expect(bounds?.height).toBeCloseTo(320, 0);
      expect(bounds?.x ?? -1).toBeGreaterThanOrEqual(0);
      expect((bounds?.x ?? 0) + (bounds?.width ?? 0)).toBeLessThanOrEqual(pageViewport?.width ?? 0);
      expect(toolbarBounds?.y ?? 0).toBeGreaterThanOrEqual((bounds?.y ?? 0) + (bounds?.height ?? 0) + 10);
      expect((toolbarBounds?.x ?? 0) + (toolbarBounds?.width ?? 0)).toBeCloseTo(
        (bounds?.x ?? 0) + (bounds?.width ?? 0),
        1,
      );
      expect(toolbarBounds?.height).toBeCloseTo(46, 0);
      expect(zoomInBounds?.height).toBeCloseTo(44, 0);
      expect((diagramBounds?.y ?? 0) + (diagramBounds?.height ?? 0)).toBeGreaterThanOrEqual(
        (toolbarBounds?.y ?? 0) + (toolbarBounds?.height ?? 0),
      );

      await viewport.scrollIntoViewIfNeeded();
      const scrollBeforePinch = await page.evaluate(() => window.scrollY);
      await pinchMermaidWithPointers(viewport);
      await expect.poll(async () => Number(await diagram.getAttribute("data-zoom"))).toBeGreaterThan(210);
      const viewBoxBeforeTouchDrag = await svg.getAttribute("viewBox");
      await dragMermaidWithTouchPointer(viewport);
      await expect.poll(() => svg.getAttribute("viewBox")).not.toBe(viewBoxBeforeTouchDrag);
      expect(await page.evaluate(() => window.scrollY)).toBeCloseTo(scrollBeforePinch, 0);
    });

    test("wide tables keep horizontal scrolling without elastic edge gaps", async ({ page }) => {
      await page.goto(MERMAID_ARTICLE_PATH);

      const tableScroll = page.locator(".blog-table-scroll").first();
      await expect(tableScroll).toBeVisible();
      await expect(tableScroll).toHaveCSS("overflow-x", "auto");
      await expect(tableScroll).toHaveCSS("overscroll-behavior-x", "none");

      const dimensions = await tableScroll.evaluate(element => ({
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth,
      }));
      expect(dimensions.scrollWidth).toBeGreaterThan(dimensions.clientWidth);
    });

    test("mobile table of contents closes and lands reliably on a section", async ({ page }) => {
      await page.goto(BLOG_ARTICLE_PATH);

      const trigger = page.getByTestId("mobile-toc-trigger");
      await expect(trigger).toBeVisible();

      const triggerBounds = await trigger.boundingBox();
      expect(triggerBounds).not.toBeNull();
      expect(triggerBounds?.height).toBeGreaterThanOrEqual(44);
      expect(triggerBounds?.height).toBeLessThanOrEqual(50);

      await trigger.click();

      const drawer = page.getByTestId("mobile-toc-drawer");
      const drawerScroll = page.getByTestId("mobile-toc-scroll");
      await expect(drawer).toBeVisible();
      await expect(drawerScroll).toBeVisible();

      const lockState = await readDocumentScrollLock(page);
      expect(lockState.overflowLocked || lockState.fixedBody).toBe(true);

      const documentScrollBefore = await page.evaluate(() => window.scrollY);
      const sectionLink = drawer.getByRole("link", { name: "How to enable Agents V2", exact: true });
      await sectionLink.scrollIntoViewIfNeeded();
      expect(await page.evaluate(() => window.scrollY)).toBeCloseTo(documentScrollBefore, 0);

      const href = await sectionLink.getAttribute("href");
      expect(href).toBe("#how-to-enable-agents-v2");
      await sectionLink.click();

      await expect(drawer).toBeHidden();
      await expect(page).toHaveURL(/#how-to-enable-agents-v2$/);

      const target = page.locator("#how-to-enable-agents-v2");
      await waitForScrollToSettle(page);
      await expect(target).toBeFocused();
      await expectTargetBelowTrigger(target, trigger);

      await trigger.click();
      await expect(drawer).toBeVisible();

      const earlierSectionLink = drawer.getByRole("link", { name: "What changed from V1", exact: true });
      await earlierSectionLink.scrollIntoViewIfNeeded();
      await earlierSectionLink.click();

      await expect(drawer).toBeHidden();
      await expect(page).toHaveURL(/#what-changed-from-v1$/);

      const earlierTarget = page.locator("#what-changed-from-v1");
      await waitForScrollToSettle(page);
      await expect(earlierTarget).toBeFocused();
      await expectTargetBelowTrigger(earlierTarget, trigger);
    });
  });
}

async function expectTargetBelowTrigger(target: Locator, trigger: Locator) {
  const [targetBounds, triggerBounds] = await Promise.all([target.boundingBox(), trigger.boundingBox()]);
  expect(targetBounds).not.toBeNull();
  expect(triggerBounds).not.toBeNull();

  const targetGap = (targetBounds?.y ?? 0) - ((triggerBounds?.y ?? 0) + (triggerBounds?.height ?? 0));
  expect(targetGap).toBeGreaterThanOrEqual(8);
  expect(targetGap).toBeLessThanOrEqual(180);
}

async function readDocumentScrollLock(page: Page) {
  return page.evaluate(() => {
    const rootStyle = getComputedStyle(document.documentElement);
    const bodyStyle = getComputedStyle(document.body);
    const lockedOverflowValues = new Set(["clip", "hidden"]);

    return {
      fixedBody: bodyStyle.position === "fixed",
      overflowLocked:
        lockedOverflowValues.has(rootStyle.overflow) ||
        lockedOverflowValues.has(rootStyle.overflowY) ||
        lockedOverflowValues.has(bodyStyle.overflow) ||
        lockedOverflowValues.has(bodyStyle.overflowY),
    };
  });
}

async function waitForScrollToSettle(page: Page) {
  await page.evaluate(
    () =>
      new Promise<void>(resolve => {
        let frameCount = 0;
        let previousScrollY = window.scrollY;
        let stableFrames = 0;

        const sample = () => {
          const nextScrollY = window.scrollY;
          stableFrames = Math.abs(nextScrollY - previousScrollY) < 0.25 ? stableFrames + 1 : 0;
          previousScrollY = nextScrollY;
          frameCount += 1;

          if (stableFrames >= 8 || frameCount >= 360) {
            resolve();
            return;
          }

          requestAnimationFrame(sample);
        };

        requestAnimationFrame(sample);
      }),
  );
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
  const firstStart = pointer(51, centerX - 24, true, 1);
  const secondStart = pointer(52, centerX + 24, false, 1);

  await viewport.dispatchEvent("pointerdown", firstStart);
  await viewport.dispatchEvent("pointerdown", secondStart);

  for (let step = 1; step <= 4; step += 1) {
    const halfDistance = 24 + step * 6;
    await viewport.dispatchEvent("pointermove", pointer(51, centerX - halfDistance, true, 1));
    await viewport.dispatchEvent("pointermove", pointer(52, centerX + halfDistance, false, 1));
  }

  await viewport.dispatchEvent("pointerup", pointer(51, centerX - 48, true, 0));
  await viewport.dispatchEvent("pointerup", pointer(52, centerX + 48, false, 0));
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
    pointerId: 53,
    pointerType: "touch",
  });

  await viewport.dispatchEvent("pointerdown", pointer(startX, startY, 1));
  await viewport.dispatchEvent("pointermove", pointer(startX + 48, startY + 32, 1));
  await viewport.dispatchEvent("pointerup", pointer(startX + 48, startY + 32, 0));
}
