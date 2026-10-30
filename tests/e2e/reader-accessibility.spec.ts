import { expect, test } from "@playwright/test";
import { specialties } from "../../src/lib/projects";

if (!("Bun" in globalThis)) {
  test.describe("reader accessibility", () => {
    test("scrolling past the end of a constrained dropdown keeps it open", async ({ page, browserName }) => {
      test.skip(browserName === "webkit", "Playwright cannot dispatch wheel input in mobile WebKit");

      await page.setViewportSize({ width: 390, height: 220 });
      await page.goto("/");

      const trigger = page.getByRole("button", { name: /^Theme:/ });
      const menu = page.getByRole("menu");
      await trigger.click();
      await expect(menu).toBeVisible();
      expect(await menu.evaluate(element => element.scrollHeight > element.clientHeight)).toBe(true);

      await menu.hover();
      await page.mouse.wheel(0, 600);
      await expect
        .poll(() => menu.evaluate(element => element.scrollHeight - element.clientHeight - element.scrollTop))
        .toBeLessThan(1);

      // A fresh gesture at the menu's end chains to the page unless the menu contains its overscroll.
      await page.mouse.wheel(0, 600);
      await page.evaluate(
        () =>
          new Promise<void>(resolve => {
            let remainingFrames = 10;

            function waitForFrame() {
              remainingFrames -= 1;

              if (remainingFrames === 0) {
                resolve();
                return;
              }

              requestAnimationFrame(waitForFrame);
            }

            requestAnimationFrame(waitForFrame);
          }),
      );

      expect(await page.evaluate(() => window.scrollY)).toBe(0);
      await expect(menu).toBeVisible();
      await expect(trigger).toHaveAttribute("aria-expanded", "true");
      await page.getByRole("menuitemcheckbox", { name: "Sound effects" }).click();
      await expect(menu).toBeVisible();
    });

    test("CV dropdown closes when its trigger scrolls away without restoring the old scroll position", async ({
      page,
    }) => {
      await page.goto("/");

      const trigger = page.getByRole("button", { name: "Show CV actions" });
      const menu = page.getByRole("menu", { name: "Show CV actions" });
      await trigger.click();
      await expect(menu).toBeVisible();

      const scrollTop = await trigger.evaluate(element => {
        const bounds = element.getBoundingClientRect();

        return window.scrollY + bounds.bottom + 20;
      });
      await page.evaluate(top => window.scrollTo({ top, behavior: "instant" }), scrollTop);

      await expect(menu).toBeHidden();
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThanOrEqual(scrollTop - 1);

      await trigger.scrollIntoViewIfNeeded();
      await expect(menu).toBeHidden();
      await trigger.press("Enter");
      await expect(menu).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(menu).toBeHidden();
      await expect(trigger).toBeFocused();
    });

    test("theme dropdown closes when reading scroll hides the blog header", async ({ page, isMobile }) => {
      await page.goto("/blog/en/codex-agents-v2");

      const trigger = page.locator('button[aria-label^="Theme:"]');
      const menu = page.getByRole("menu");
      await trigger.click();
      await expect(menu).toBeVisible();

      if (isMobile) {
        await page.locator("body").dispatchEvent("touchmove");
      } else {
        await page.evaluate(() => window.dispatchEvent(new WheelEvent("wheel", { deltaY: 800 })));
      }

      await page.evaluate(() => window.scrollBy({ top: 800, behavior: "instant" }));

      await expect(menu).toBeHidden();
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
      await expect(page.locator("[data-blog-passive-hidden]")).toHaveAttribute("data-blog-passive-hidden", "true");
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThanOrEqual(799);
    });

    test("keeps every specialty visible on narrow screens", async ({ page }) => {
      await page.goto("/");

      const list = page.getByRole("list", { name: "Specialties" });
      const badges = list.locator("[data-slot=badge]");

      for (const width of [320, 390]) {
        await page.setViewportSize({ width, height: 844 });
        await list.scrollIntoViewIfNeeded();

        await expect(badges).toHaveText(specialties);
        expect(
          await badges.evaluateAll(elements =>
            elements.every(element => {
              const bounds = element.getBoundingClientRect();
              const listBounds = element.closest("ul")?.getBoundingClientRect();
              return (
                listBounds &&
                bounds.width > 0 &&
                bounds.left >= listBounds.left - 1 &&
                bounds.right <= listBounds.right + 1
              );
            }),
          ),
        ).toBe(true);
      }
    });

    test("overflowing tables have localized keyboard access", async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });

      for (const [locale, label] of [
        ["en", "Scrollable table"],
        ["uk", "Таблиця з прокручуванням"],
      ]) {
        await page.goto(`/blog/${locale}/codex-memories`);
        const tableScroll = page.getByRole("region", { name: label }).first();
        await expect(tableScroll).toHaveAttribute("tabindex", "0");
        await tableScroll.scrollIntoViewIfNeeded();
        await tableScroll.focus();
        await expect(tableScroll).toBeFocused();
        await page.keyboard.press("Shift+Tab");
        await expect(tableScroll).not.toBeFocused();
        await page.keyboard.press("Tab");
        await expect(tableScroll).toBeFocused();
        await expect(tableScroll).toHaveCSS("outline-width", "2px");
        // WebKit can settle native keyboard scrolling after focus has already moved.
        await expect
          .poll(async () => {
            await page.keyboard.press("ArrowRight");
            return tableScroll.evaluate(element => element.scrollLeft);
          })
          .toBeGreaterThan(0);

        const fittedTables = page.locator('.blog-table-frame[data-overflow="false"] .blog-table-scroll');
        expect(await fittedTables.count()).toBeGreaterThan(0);
        for (const fittedTable of await fittedTables.all()) {
          await expect(fittedTable).toHaveAttribute("tabindex", "-1");
        }
      }
    });

    test("character shortcuts can be disabled across reloads without disabling help", async ({ page }) => {
      await page.goto("/projects");
      const dialog = page.getByRole("dialog", { name: "Keyboard shortcuts" });
      const characterShortcuts = dialog.getByRole("checkbox", { name: "Character shortcuts" });

      async function openHelp() {
        // The shortcut handler loads lazily after a fresh navigation.
        await expect(async () => {
          await page.keyboard.press("Control+/");
          await expect(dialog).toBeVisible({ timeout: 1000 });
        }).toPass();
      }

      await openHelp();
      await expect(characterShortcuts).toBeChecked();
      await characterShortcuts.uncheck();
      await page.keyboard.press("Escape");
      await expect(dialog).toBeHidden();
      await page.reload();
      await openHelp();
      await expect(characterShortcuts).not.toBeChecked();
      await page.keyboard.press("Escape");

      await page.keyboard.press("g");
      await page.keyboard.press("h");
      await page.keyboard.press("Shift+H");
      await page.keyboard.press(".");
      await expect(page).toHaveURL(/\/projects$/);

      await page.keyboard.press("Control+/");
      await characterShortcuts.check();
      await page.keyboard.press("Escape");
      await page.keyboard.press("g");
      await page.keyboard.press("h");
      await expect(page).toHaveURL("/");
    });

    test("mobile TOC keeps its reading placement with enlarged text", async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("/blog/en/codex-agents-v2");
      await page.locator("html").evaluate(element => {
        element.style.fontSize = "200%";
      });

      await page.getByTestId("mobile-toc-trigger").click();
      const drawer = page.getByTestId("mobile-toc-drawer");
      await expect(drawer).toBeVisible();
      const targetLink = drawer.getByRole("link", { name: "How to enable Agents V2", exact: true });
      await targetLink.scrollIntoViewIfNeeded();
      await targetLink.click();

      const heading = page.locator("#how-to-enable-agents-v2");
      await expect(drawer).toBeHidden();
      await expect(heading).toBeFocused();
      await expect(page).toHaveURL(/#how-to-enable-agents-v2$/);
      await expect
        .poll(() => heading.evaluate(element => Math.abs(element.getBoundingClientRect().top - 76)))
        .toBeLessThanOrEqual(1);
    });
  });
}
