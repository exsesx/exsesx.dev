import { expect, type Locator, type Page, test } from "@playwright/test";

const BLOG_ARTICLE_PATH = "/blog/en/codex-agents-v2";

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
