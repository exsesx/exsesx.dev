import { describe, expect, test } from "bun:test";

const globalsUrl = new URL("../styles/globals.css", import.meta.url);
const buttonVariantsUrl = new URL("../components/ui/button-variants.ts", import.meta.url);
const cvMenuUrl = new URL("../components/CvMenu.tsx", import.meta.url);
const themeSwitcherUrl = new URL("../components/ThemeSwitcher.tsx", import.meta.url);
const homePageUrl = new URL("../app/page.tsx", import.meta.url);
const projectsPageUrl = new URL("../app/projects/page.tsx", import.meta.url);

async function readGlobalsCss() {
  return Bun.file(globalsUrl).text();
}

async function readSource(url: URL) {
  return Bun.file(url).text();
}

function ruleBody(css: string, selector: string) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return css.match(new RegExp(`${escaped}\\s*\\{(?<body>[\\s\\S]*?)\\n\\}`, "m"))?.groups?.body ?? "";
}

describe("semantic animation styles", () => {
  test("defines the shared interaction duration scale once", async () => {
    const css = await readGlobalsCss();
    const expectedTokens = [
      ["--duration-press", "150ms"],
      ["--duration-ui", "200ms"],
      ["--duration-popover-enter", "170ms"],
      ["--duration-popover-exit", "150ms"],
    ] as const;

    for (const [token, value] of expectedTokens) {
      expect(css.match(new RegExp(`${token}:\\s*${value}`, "g"))).toHaveLength(1);
    }
  });

  test("uses interruptible trigger-anchored dropdown transitions", async () => {
    const [css, cvMenu, themeSwitcher] = await Promise.all([
      readGlobalsCss(),
      readSource(cvMenuUrl),
      readSource(themeSwitcherUrl),
    ]);
    const menuRule = ruleBody(css, ".dropdown-menu");

    expect(menuRule).toContain("transform-origin: var(--transform-origin)");
    expect(menuRule).toContain("var(--duration-popover-enter)");
    expect(css).toContain(".dropdown-menu[data-starting-style]");
    expect(css).toContain(".dropdown-menu[data-ending-style]");
    expect(css).toContain("var(--duration-popover-exit)");
    expect(css).not.toMatch(/animation:\s*menu-(?:enter|exit)/);
    expect(css).not.toMatch(/@keyframes\s+menu-(?:enter|exit)/);
    expect(cvMenu).not.toContain("origin-top-right");
    expect(themeSwitcher).not.toContain("origin-top-right");
  });

  test("separates fast button press feedback from visual hover feedback", async () => {
    const [css, buttonVariants] = await Promise.all([readGlobalsCss(), readSource(buttonVariantsUrl)]);
    const buttonRule = ruleBody(css, ".button-motion");

    expect(buttonRule).toContain("transform var(--duration-press) var(--ease-out)");
    expect(buttonRule).toContain("background-color var(--duration-ui) ease");
    expect(buttonRule).toContain("box-shadow var(--duration-ui) ease");
    expect(buttonVariants).toContain("button-motion");
    expect(buttonVariants).not.toContain("transition-[background-color,border-color,color,box-shadow,transform]");
    expect(buttonVariants).toContain("active:scale-[0.97]");
  });

  test("uses calm on-screen movement for persistent navigation", async () => {
    const css = await readGlobalsCss();
    const headerRule = ruleBody(css, ".site-header-nav-frame");
    const pillRule = ruleBody(css, ".site-nav-active-pill");

    expect(headerRule).toContain("transition: transform var(--duration-ui) var(--ease-in-out)");
    expect(pillRule).toContain("transition: transform var(--duration-ui) var(--ease-in-out)");
    expect(css).not.toContain("--ease-spring");
    expect(css).not.toContain("transition-duration: 380ms");
  });

  test("preserves non-spatial feedback for reduced motion", async () => {
    const css = await readGlobalsCss();
    const reducedMotion = css.slice(css.lastIndexOf("@media (prefers-reduced-motion: reduce)"));

    expect(reducedMotion).not.toMatch(/animation-duration:\s*0\.01ms/);
    expect(reducedMotion).not.toMatch(/transition-duration:\s*0\.01ms/);
    expect(reducedMotion).toContain(".site-header-nav-frame");
    expect(reducedMotion).toContain(".site-nav-active-pill");
    expect(reducedMotion).toContain(".nav-back-button");
    expect(reducedMotion).toContain(".button-motion.nav-back-button");
    expect(reducedMotion).toContain("transition: none");
    expect(reducedMotion).toContain(".dropdown-menu");
    expect(reducedMotion).toContain("transition: opacity var(--duration-popover-exit) var(--ease-out)");
    expect(reducedMotion).toContain(".button-motion");
    expect(reducedMotion).toContain("background-color var(--duration-ui) ease");
    expect(reducedMotion).not.toMatch(/\.site-nav-active-pill[^}]*transform:\s*none/s);
  });

  test("keeps entry motion at section level instead of every repeated card", async () => {
    const [homePage, projectsPage] = await Promise.all([readSource(homePageUrl), readSource(projectsPageUrl)]);

    expect(homePage.match(/className="scroll-rise mb-8/g)).toHaveLength(3);
    expect(homePage).not.toMatch(/className="scroll-rise surface-panel/);
    expect(homePage).not.toMatch(/className="scroll-rise h-full/);
    expect(projectsPage).toContain('<div className="motion-rise">');
    expect(projectsPage).toContain('className="motion-rise motion-delay-1 glass-frost');
    expect(projectsPage).not.toMatch(/key=\{project\.id\}\s+className="motion-rise h-full"/);
  });
});
