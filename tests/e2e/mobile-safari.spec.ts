import { expect, type Locator, type Page, test } from "@playwright/test";
import {
  BLOG_HEADER_HIDE_START,
  BLOG_HEADER_TOUCH_HIDE_DISTANCE,
  BLOG_HEADER_TOUCH_REVEAL_DISTANCE,
} from "../../src/lib/blog-focus";

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

    test("passive Blog header uses deliberate coarse-touch intent without overlapping the TOC", async ({ page }) => {
      await page.goto(BLOG_ARTICLE_PATH);

      const root = page.locator('[data-blog-article="true"]');
      const headerFrame = page.locator(".site-header-nav-frame");
      const title = page.getByRole("heading", { level: 1 });
      const toc = page.locator(".blog-toc-mobile-shell");

      await expect(root).toHaveAttribute("data-blog-header-motion", "instant");
      await scrollWithTouchIntent(page, BLOG_HEADER_HIDE_START + BLOG_HEADER_TOUCH_HIDE_DISTANCE - 1);

      await expect(root).not.toHaveAttribute("data-blog-passive-hidden", "true");
      const visibleTransform = await headerFrame.evaluate(element => {
        const matrix = new DOMMatrixReadOnly(getComputedStyle(element).transform);

        return { scale: matrix.a, translateY: matrix.m42 };
      });
      expect(visibleTransform.scale).toBeCloseTo(1, 3);
      expect(visibleTransform.translateY).toBeCloseTo(0, 1);

      await scrollWithTouchIntent(page, 1);

      await expect(root).toHaveAttribute("data-blog-passive-hidden", "true");
      await expect(headerFrame).toBeHidden();
      await expect(title).toBeInViewport();

      await scrollWithTouchIntent(page, 640);
      await expect(toc).toBeVisible();

      await scrollWithTouchIntent(page, -(BLOG_HEADER_TOUCH_REVEAL_DISTANCE - 1));
      await expect(root).toHaveAttribute("data-blog-passive-hidden", "true");

      await scrollWithTouchIntent(page, -1);
      await expect(root).not.toHaveAttribute("data-blog-passive-hidden", "true");
      await expect(headerFrame).toBeVisible();

      await expect.poll(async () => readTocHeaderGap(toc)).toBeCloseTo(16, 0);
    });

    test("Mermaid reveals a compact reset chip after pinch zoom in iPhone Safari", async ({ page }) => {
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
      await expect(toolbar.getByRole("button")).toHaveCount(2);
      await expect(toolbar).toHaveAttribute("data-zoomed", "false");
      await expect(toolbar.getByRole("button", { name: "Move", exact: true })).toHaveCount(0);
      await expect(toolbar.getByRole("button", { name: "Zoom out" })).toBeDisabled();
      await expect(toolbar).toHaveCSS("backdrop-filter", "none");
      const resetZoom = toolbar.locator('[data-mermaid-control="reset"]');
      await expect(resetZoom).toBeDisabled();
      await expect(resetZoom).toHaveCSS("opacity", "0");
      await expect(resetZoom).toHaveCSS("pointer-events", "none");

      const [bounds, diagramBounds, toolbarBounds] = await Promise.all([
        viewport.boundingBox(),
        diagram.boundingBox(),
        toolbar.boundingBox(),
      ]);
      const pageViewport = page.viewportSize();
      expect(bounds).not.toBeNull();
      expect(diagramBounds).not.toBeNull();
      expect(toolbarBounds).not.toBeNull();
      expect(pageViewport).not.toBeNull();
      expect(bounds?.height).toBeCloseTo(320, 0);
      expect(bounds?.x ?? -1).toBeGreaterThanOrEqual(0);
      expect((bounds?.x ?? 0) + (bounds?.width ?? 0)).toBeLessThanOrEqual(pageViewport?.width ?? 0);
      const toolbarRightInset =
        (diagramBounds?.x ?? 0) + (diagramBounds?.width ?? 0) - ((toolbarBounds?.x ?? 0) + (toolbarBounds?.width ?? 0));
      expect(toolbarRightInset).toBeCloseTo(9, 0);
      expect(toolbarBounds?.y).toBeCloseTo((diagramBounds?.y ?? 0) + 9, 0);
      expect(toolbarBounds?.width).toBeCloseTo(44, 0);
      expect(toolbarBounds?.height).toBeCloseTo(44, 0);

      await viewport.scrollIntoViewIfNeeded();
      const scrollBeforePinch = await page.evaluate(() => window.scrollY);
      await pinchMermaidWithPointers(viewport);
      await expect.poll(async () => Number(await diagram.getAttribute("data-zoom"))).toBeGreaterThan(210);
      await expect(toolbar).toHaveAttribute("data-zoomed", "true");
      await expect(toolbar.getByRole("button")).toHaveCount(3);
      await expect(resetZoom).toBeEnabled();
      await expect(resetZoom).toHaveCSS("opacity", "1");
      await expect(resetZoom).toHaveCSS("pointer-events", "auto");
      await expect(resetZoom.locator(".blog-mermaid-reset-chip")).toHaveText(/\d+%/);
      const [resetBounds, chipBounds] = await Promise.all([
        resetZoom.boundingBox(),
        resetZoom.locator(".blog-mermaid-reset-chip").boundingBox(),
      ]);
      expect(resetBounds?.height).toBeCloseTo(44, 0);
      expect(chipBounds?.height).toBeCloseTo(30, 0);

      const viewBoxBeforeTouchDrag = await svg.getAttribute("viewBox");
      await dragMermaidWithTouchPointer(viewport);
      await expect.poll(() => svg.getAttribute("viewBox")).not.toBe(viewBoxBeforeTouchDrag);
      expect(await page.evaluate(() => window.scrollY)).toBeCloseTo(scrollBeforePinch, 0);

      await resetZoom.click();
      await expect(diagram).toHaveAttribute("data-zoom", "100");
      await expect(toolbar).toHaveAttribute("data-zoomed", "false");
      await expect(resetZoom).toHaveCSS("opacity", "0");
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

    test("mobile table of contents keeps an upward selection current after retained touch intent", async ({ page }) => {
      await page.goto(BLOG_ARTICLE_PATH);

      const root = page.locator('[data-blog-article="true"]');
      const trigger = page.getByTestId("mobile-toc-trigger");
      await expect(trigger).toBeVisible();
      const tocShell = page.locator(".blog-toc-mobile-shell");
      expect(await tocShell.evaluate(element => getComputedStyle(element, "::after").content)).toBe("none");

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
      await expect(root).toHaveAttribute("data-blog-passive-hidden", "true");

      // Reproduce the touch intent retained immediately before a TOC-driven
      // upward scroll. The programmatic scroll must not consume that intent
      // and reveal the header above the selected heading.
      await page.locator("body").dispatchEvent("touchmove");

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
      await expect(root).toHaveAttribute("data-blog-passive-hidden", "true");
      await expect.poll(async () => Math.floor(await readTargetTriggerGap(earlierTarget, trigger))).toBe(16);
      await expect(trigger.locator(".blog-toc-current")).toHaveText("What changed from V1");

      await trigger.click();
      await expect(drawer).toBeVisible();
      await sectionLink.scrollIntoViewIfNeeded();
      await sectionLink.click();
      await expect(page).toHaveURL(/#how-to-enable-agents-v2$/);

      // New touch input interrupts the in-flight TOC navigation. Its upward
      // movement is immediately interpreted by the normal passive header.
      await scrollWithTouchIntent(page, -BLOG_HEADER_TOUCH_REVEAL_DISTANCE);
      await expect(root).not.toHaveAttribute("data-blog-passive-hidden", "true");
    });
  });
}

async function scrollWithTouchIntent(page: Page, deltaY: number) {
  await page.locator("body").dispatchEvent("touchmove");
  await page.evaluate(distance => window.scrollBy({ behavior: "instant" as ScrollBehavior, top: distance }), deltaY);
  await page.evaluate(
    () => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
  );
}

async function readTocHeaderGap(toc: Locator) {
  return toc.evaluate(element => {
    const header = document.querySelector(".site-header-nav-frame");

    if (!(header instanceof HTMLElement)) {
      throw new Error("Expected the Blog header frame");
    }

    return element.getBoundingClientRect().top - header.getBoundingClientRect().bottom;
  });
}

async function expectTargetBelowTrigger(target: Locator, trigger: Locator) {
  const targetGap = await readTargetTriggerGap(target, trigger);
  expect(targetGap).toBeGreaterThanOrEqual(8);
  expect(targetGap).toBeLessThanOrEqual(180);
}

async function readTargetTriggerGap(target: Locator, trigger: Locator) {
  const [targetBounds, triggerBounds] = await Promise.all([target.boundingBox(), trigger.boundingBox()]);
  expect(targetBounds).not.toBeNull();
  expect(triggerBounds).not.toBeNull();

  return (targetBounds?.y ?? 0) - ((triggerBounds?.y ?? 0) + (triggerBounds?.height ?? 0));
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
