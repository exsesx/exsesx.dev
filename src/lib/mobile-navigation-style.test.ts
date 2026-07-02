import { describe, expect, test } from "bun:test";

const globalsCssUrl = new URL("../styles/globals.css", import.meta.url);
const rootLayoutUrl = new URL("../app/layout.tsx", import.meta.url);
const nextConfigUrl = new URL("../../next.config.mts", import.meta.url);
const projectPageUrl = new URL("../app/project/[slug]/page.tsx", import.meta.url);
const navBackButtonUrl = new URL("../components/NavBackButton.tsx", import.meta.url);

async function readGlobalsCss() {
  return Bun.file(globalsCssUrl).text();
}

function getRuleBody(css: string, selector: string) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const rule = css.match(new RegExp(`${escapedSelector}\\s*\\{(?<body>[\\s\\S]*?)\\n\\}`));

  return rule?.groups?.body ?? "";
}

function getReducedMotionActivePillRule(css: string) {
  const rule = css.match(
    /@media \(prefers-reduced-motion: reduce\) \{(?:\s*\/\*[\s\S]*?\*\/)?\s*\.site-nav-active-pill\s*\{(?<body>[\s\S]*?)\n\s*\}\s*\n\}/,
  );

  return rule?.groups?.body ?? "";
}

describe("mobile navigation styles", () => {
  test("keeps the active nav pill positioned when reduced motion removes animation", async () => {
    const css = await readGlobalsCss();
    const activePillRule = getReducedMotionActivePillRule(css);

    expect(activePillRule).not.toBe("");
    // the translate parks the pill on the active tab; reduced motion may only
    // remove the slide, never the transform itself
    expect(activePillRule).not.toMatch(/transform:/);
    expect(activePillRule).toMatch(/transition-duration:\s*0ms/);
  });

  test("fully collapses the nav back chip on non-project routes", async () => {
    const css = await readGlobalsCss();
    const foldedChipRule = getRuleBody(css, '.nav-back-button[data-active="false"]');

    expect(foldedChipRule).toMatch(/max-width:\s*0/);
    expect(foldedChipRule).toMatch(/opacity:\s*0/);
  });

  test("wires the back chip's morph transition type from the project page through the DOM", async () => {
    const projectPage = await Bun.file(projectPageUrl).text();
    const navBackButton = await Bun.file(navBackButtonUrl).text();

    // page publishes it, chip reads it; both sides of the contract must agree
    expect(projectPage).toContain("data-back-transition-type={projectTransitionType}");
    expect(navBackButton).toContain('querySelector("main[data-back-transition-type]")');
  });

  test("does not put the app shell in an overflow container that disables sticky descendants", async () => {
    const rootLayout = await Bun.file(rootLayoutUrl).text();

    expect(rootLayout).not.toContain("overflow-x-hidden");
    expect(rootLayout).toContain("overflow-x-clip");
  });

  test("keeps the Turbopack persistent build cache disabled", async () => {
    const nextConfig = await Bun.file(nextConfigUrl).text();

    // it shipped a stale compiled globals.css to production (new markup, old
    // stylesheet), which is how the nav pill broke on 2026-07-02
    expect(nextConfig).not.toMatch(/turbopackFileSystemCacheForBuild:\s*true/);
  });
});
