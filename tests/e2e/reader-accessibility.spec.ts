import { expect, test } from "@playwright/test";
import { specialties } from "../../src/lib/projects";

if (!("Bun" in globalThis)) {
  test.describe("reader accessibility", () => {
    test("reduced motion keeps every specialty visible on narrow screens", async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("/");

      const rail = page.getByRole("region", { name: "Specialties" });
      const track = rail.locator(".snapshot-specialty-track");
      const badges = track.locator("> div:first-child > [data-slot=badge]");

      for (const width of [320, 390]) {
        await page.setViewportSize({ width, height: 844 });
        await rail.scrollIntoViewIfNeeded();
        await expect(badges).toHaveText(specialties);
        await expect(track).toHaveCSS("animation-name", "none");
        await expect(track.locator('> [aria-hidden="true"]')).toBeHidden();
        expect(
          await badges.evaluateAll(elements =>
            elements.every(element => {
              const bounds = element.getBoundingClientRect();
              const railBounds = element.closest(".snapshot-specialty-rail")?.getBoundingClientRect();
              return (
                railBounds &&
                bounds.left >= railBounds.left - 1 &&
                bounds.right <= railBounds.right + 1 &&
                bounds.top >= railBounds.top - 1 &&
                bounds.bottom <= railBounds.bottom + 1
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
