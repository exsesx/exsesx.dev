import { describe, expect, test } from "bun:test";

const globalsUrl = new URL("../styles/globals.css", import.meta.url);
const headerUrl = new URL("../components/Header.tsx", import.meta.url);
const dropdownUrl = new URL("../components/ui/dropdown-menu.tsx", import.meta.url);
const homeUrl = new URL("../app/(site)/page.tsx", import.meta.url);
const projectsUrl = new URL("../app/(site)/projects/page.tsx", import.meta.url);
const detailUrl = new URL("../app/(site)/project/[slug]/page.tsx", import.meta.url);
const cardUrl = new URL("../components/ProjectCard.tsx", import.meta.url);
const hotkeysUrl = new URL("../components/Hotkeys.tsx", import.meta.url);

function getRuleBody(css: string, selector: string) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return css.match(new RegExp(`${escapedSelector}\\s*\\{(?<body>[\\s\\S]*?)\\n\\}`))?.groups?.body ?? "";
}

describe("glass tier contracts", () => {
  test("keeps the nav bar opaque and floating chrome to the dropdown, without refraction", async () => {
    const [css, header, dropdown] = await Promise.all([
      Bun.file(globalsUrl).text(),
      Bun.file(headerUrl).text(),
      Bun.file(dropdownUrl).text(),
    ]);
    const surfaceRule = getRuleBody(css, ".site-nav-glass > .site-nav-surface");

    // Copy scrolling under the nav must never show through it.
    expect(header).toMatch(/className="site-nav-surface"/);
    expect(surfaceRule).toContain("background: var(--background);");
    expect(surfaceRule).not.toContain("backdrop-filter");
    expect(css).not.toContain(".site-nav-switcher::before");
    expect(dropdown).toMatch(/dropdown-menu liquid-glass/);
    expect(css).not.toContain("glass-lens");
    expect(css).not.toContain("-webkit-backdrop-filter");
  });

  test("defines reduced-transparency-safe light frost", async () => {
    const css = await Bun.file(globalsUrl).text();
    const frostRule = getRuleBody(css, ".glass-frost");
    const blur = Number(frostRule.match(/backdrop-filter:\s*blur\((?<pixels>\d+(?:\.\d+)?)px\)/)?.groups?.pixels);

    expect(frostRule).not.toBe("");
    expect(blur).toBeGreaterThanOrEqual(6);
    expect(blur).toBeLessThanOrEqual(8);
    expect(css).toMatch(
      /@media \(prefers-reduced-transparency: reduce\)[\s\S]*?\.glass-frost,[\s\S]*?backdrop-filter:\s*none/,
    );
    expect(css).toMatch(/\.safari-chrome-sample\s*\{[\s\S]*?background-color:\s*var\(--safari-chrome-color\)/);
  });

  test("keeps project content on paper and small surfaces as frost", async () => {
    const [home, projects, detail, card, hotkeys] = await Promise.all([
      Bun.file(homeUrl).text(),
      Bun.file(projectsUrl).text(),
      Bun.file(detailUrl).text(),
      Bun.file(cardUrl).text(),
      Bun.file(hotkeysUrl).text(),
    ]);

    // The poster hero keeps the ASCII field unobstructed: no glass or frosted panels on the homepage.
    expect(home).not.toMatch(/glass-frost|liquid-glass|backdrop-blur|surface-panel/);
    // Project pages separate content with hairlines: no glass, frost, or raised panels.
    expect(`${projects}\n${detail}\n${card}`).not.toMatch(/glass-frost|liquid-glass|backdrop-blur|surface-panel/);
    expect(hotkeys.match(/glass-frost/g)).toHaveLength(2);
    expect(hotkeys).toMatch(/hotkeys-corner-hint glass-frost/);
    expect(hotkeys).toMatch(/hotkeys-panel glass-frost/);
    expect(`${home}\n${detail}`).not.toMatch(/hero-surface-panel[^"\n]*(?:liquid-glass|backdrop-blur)/);
  });

  test("limits TSX liquid-glass usage to the dropdown primitive", async () => {
    const glob = new Bun.Glob("src/**/*.tsx");
    const matches: string[] = [];

    for await (const path of glob.scan({ cwd: new URL("../..", import.meta.url).pathname })) {
      if ((await Bun.file(new URL(`../../${path}`, import.meta.url)).text()).includes("liquid-glass")) {
        matches.push(path);
      }
    }

    expect(matches.sort()).toEqual(["src/components/ui/dropdown-menu.tsx"]);
  });
});
