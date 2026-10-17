import { expect, type Locator, type Page, test } from "@playwright/test";

const ARTICLES = [
  { slug: "codex-agents-v2", nodes: 4 },
  { slug: "codex-memories", nodes: 6 },
  { slug: "safari-26-invisible-tint-sampler", nodes: 7 },
];

async function selectTheme(page: Page, theme: "Light" | "Dark") {
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  const trigger = page.getByRole("button", { name: /^Theme:/ });
  await expect(trigger).toBeVisible();
  await trigger.click();
  await page.getByRole("menuitemradio", { name: theme, exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme-mode", theme.toLowerCase());
}

async function readDiagramColors(svg: Locator) {
  return svg.evaluate(element => {
    const shape = element.querySelector(".pele-node > rect, .pele-node > polygon");
    const label = element.querySelector(".pele-node > .pele-label");
    const edge = element.querySelector(".pele-edge > path");

    if (!shape || !label || !edge) {
      throw new Error("Expected Pele node, label, and edge elements");
    }

    return {
      fill: getComputedStyle(shape).fill,
      stroke: getComputedStyle(shape).stroke,
      text: getComputedStyle(label).fill,
      edge: getComputedStyle(edge).stroke,
    };
  });
}

async function expectLabelsInsideShapes(svg: Locator) {
  const failures = await svg.evaluate(async element => {
    await document.fonts.ready;

    return Array.from(element.querySelectorAll<SVGGElement>(".pele-node")).flatMap(node => {
      const shape = node.querySelector<SVGGeometryElement>(":scope > rect, :scope > polygon");
      const label = node.querySelector<SVGTextElement>(":scope > .pele-label");
      const id = node.getAttribute("data-id");

      if (!shape || !label) {
        return [`${id}: missing shape or label`];
      }

      const style = getComputedStyle(label);
      const bounds = label.getBBox();
      const fontLoaded = document.fonts.check(
        `${style.fontWeight} ${style.fontSize} MonoLisaCode`,
        label.textContent ?? "",
      );
      const inset = 0.5;
      const corners = [
        [bounds.x + inset, bounds.y + inset],
        [bounds.x + bounds.width - inset, bounds.y + inset],
        [bounds.x + inset, bounds.y + bounds.height - inset],
        [bounds.x + bounds.width - inset, bounds.y + bounds.height - inset],
      ];

      if (!style.fontFamily.includes("MonoLisaCode") || !fontLoaded) {
        return [`${id}: diagram font is not loaded`];
      }

      if (
        bounds.width <= 0 ||
        bounds.height <= 0 ||
        !corners.every(([x, y]) => shape.isPointInFill(new DOMPoint(x, y)))
      ) {
        return [`${id}: label exceeds its shape: ${label.textContent}`];
      }

      return [];
    });
  });

  expect(failures).toEqual([]);
}

async function expectSvgFillsViewport(svg: Locator, viewport: Locator) {
  const [svgBounds, viewportBounds] = await Promise.all([svg.boundingBox(), viewport.boundingBox()]);

  expect(svgBounds).not.toBeNull();
  expect(viewportBounds).not.toBeNull();

  for (const dimension of ["x", "y", "width", "height"] as const) {
    expect(Math.abs((svgBounds?.[dimension] ?? 0) - (viewportBounds?.[dimension] ?? 0))).toBeLessThanOrEqual(1);
  }
}

if (!("Bun" in globalThis)) {
  test.describe("Pele diagram rendering", () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem("exsesx:color-scheme", JSON.stringify("light"));
      });
    });

    for (const { slug, nodes } of ARTICLES) {
      for (const locale of ["en", "uk"]) {
        test(`${locale}/${slug} fits its labels and page in both themes`, async ({ page }) => {
          await page.goto(`/blog/${locale}/${slug}`);

          const diagram = page.locator(".blog-mermaid");
          const viewport = diagram.getByTestId("mermaid-viewport");
          const svg = viewport.locator("svg.pele.pele-flowchart");

          await expect(diagram).toHaveCount(1);
          await expect(diagram).toHaveAttribute("data-state", "ready", { timeout: 15_000 });
          await expect(viewport).toHaveRole("img");
          await expect(viewport).toHaveAccessibleName(/\S/);
          await expect(svg).toHaveCount(1);
          await expect(svg.locator(".pele-node")).toHaveCount(nodes);
          await expect(svg.locator("foreignObject")).toHaveCount(0);
          await expect(svg).not.toContainText(/<br\s*\/?\s*>/i);

          if (slug === "codex-agents-v2") {
            await expect(svg.locator('.pele-node[data-id="root"]')).toHaveClass(/\bfocus\b/);
          }

          await expectLabelsInsideShapes(svg);
          await expectSvgFillsViewport(svg, viewport);
          expect(
            await svg.evaluate(element => {
              if (!(element instanceof SVGSVGElement)) {
                throw new Error("Expected an SVG root");
              }

              const geometry = element.getBBox();
              const viewBox = element.viewBox.baseVal;

              return (
                geometry.x >= viewBox.x - 1 &&
                geometry.y >= viewBox.y - 1 &&
                geometry.x + geometry.width <= viewBox.x + viewBox.width + 1 &&
                geometry.y + geometry.height <= viewBox.y + viewBox.height + 1
              );
            }),
          ).toBe(true);
          const lightColors = await readDiagramColors(svg);
          await selectTheme(page, "Dark");
          await expect.poll(() => readDiagramColors(svg)).not.toEqual(lightColors);
          await expectLabelsInsideShapes(svg);
          await expect(diagram).toHaveAttribute("data-state", "ready");
          await expect
            .poll(() =>
              page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
            )
            .toBeLessThanOrEqual(1);
        });
      }
    }

    test("theme changes recolor the same SVG without resetting its panned camera", async ({ page, isMobile }) => {
      await page.goto("/blog/en/codex-memories");

      const diagram = page.locator(".blog-mermaid");
      const viewport = diagram.getByTestId("mermaid-viewport");
      const svg = viewport.locator("svg.pele");

      await expect(diagram).toHaveAttribute("data-state", "ready", { timeout: 15_000 });
      const originalSvg = await svg.elementHandle();
      expect(originalSvg).not.toBeNull();
      const lightColors = await readDiagramColors(svg);

      await viewport.press("+");
      await expect(diagram).toHaveAttribute("data-zoom", "125");
      const centeredViewBox = await svg.getAttribute("viewBox");
      await viewport.press("ArrowDown");
      await expect(svg).not.toHaveAttribute("viewBox", centeredViewBox ?? "");
      const pannedViewBox = await svg.getAttribute("viewBox");

      await selectTheme(page, "Dark");
      await expect.poll(() => readDiagramColors(svg)).not.toEqual(lightColors);
      expect(await originalSvg?.evaluate(element => element.isConnected)).toBe(true);
      await expect(svg).toHaveAttribute("viewBox", pannedViewBox ?? "");
      await expect(diagram).toHaveAttribute("data-zoom", "125");

      await selectTheme(page, "Light");
      await expect.poll(() => readDiagramColors(svg)).toEqual(lightColors);
      expect(await originalSvg?.evaluate(element => element.isConnected)).toBe(true);
      await expect(svg).toHaveAttribute("viewBox", pannedViewBox ?? "");
      await expect(diagram).toHaveAttribute("data-zoom", "125");

      if (!isMobile) {
        await page.setViewportSize({ width: 390, height: 844 });
        await expect(svg).not.toHaveAttribute("viewBox", pannedViewBox ?? "");
        await expect(diagram).toHaveAttribute("data-state", "ready");
        await expect(diagram).toHaveAttribute("data-zoom", "125");
        await expectLabelsInsideShapes(svg);
        await expectSvgFillsViewport(svg, viewport);

        const viewBox =
          (await svg.getAttribute("viewBox"))
            ?.trim()
            .split(/[\s,]+/)
            .map(Number) ?? [];
        expect(viewBox).toHaveLength(4);
        expect(viewBox.every(Number.isFinite)).toBe(true);
        expect(viewBox[2]).toBeGreaterThan(0);
        expect(viewBox[3]).toBeGreaterThan(0);
      }
    });
  });
}
