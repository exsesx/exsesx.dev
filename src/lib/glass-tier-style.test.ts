import { describe, expect, test } from "bun:test";

const globalsUrl = new URL("../styles/globals.css", import.meta.url);
const headerUrl = new URL("../components/Header.tsx", import.meta.url);
const dropdownUrl = new URL("../components/ui/dropdown-menu.tsx", import.meta.url);
const homeUrl = new URL("../app/page.tsx", import.meta.url);
const projectsUrl = new URL("../app/projects/page.tsx", import.meta.url);
const detailUrl = new URL("../app/project/[slug]/page.tsx", import.meta.url);
const cardUrl = new URL("../components/Card.tsx", import.meta.url);
const hotkeysUrl = new URL("../components/Hotkeys.tsx", import.meta.url);

function getRuleBody(css: string, selector: string) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return css.match(new RegExp(`${escapedSelector}\\s*\\{(?<body>[\\s\\S]*?)\\n\\}`))?.groups?.body ?? "";
}

describe("glass tier contracts", () => {
  test("reserves refractive liquid glass for nav and dropdown chrome", async () => {
    const [css, header, dropdown] = await Promise.all([
      Bun.file(globalsUrl).text(),
      Bun.file(headerUrl).text(),
      Bun.file(dropdownUrl).text(),
    ]);

    expect(header).toMatch(/liquid-glass site-nav-glass/);
    expect(dropdown).toMatch(/dropdown-menu liquid-glass/);
    expect(css).toMatch(
      /@media \(min-width: 768px\) and \(hover: hover\) and \(pointer: fine\)[\s\S]*?html\.glass-lens \.site-nav-glass/,
    );
    expect(css).toMatch(/html\.glass-lens \.dropdown-menu\.liquid-glass/);
    expect(css).not.toContain("-webkit-backdrop-filter");
  });

  test("defines reduced-transparency-safe light frost and non-blurred hero surfaces", async () => {
    const css = await Bun.file(globalsUrl).text();
    const frostRule = getRuleBody(css, ".glass-frost");
    const heroRule = getRuleBody(css, ".hero-surface-panel");
    const blur = Number(frostRule.match(/backdrop-filter:\s*blur\((?<pixels>\d+(?:\.\d+)?)px\)/)?.groups?.pixels);

    expect(frostRule).not.toBe("");
    expect(blur).toBeGreaterThanOrEqual(6);
    expect(blur).toBeLessThanOrEqual(8);
    expect(heroRule).toMatch(/backdrop-filter:\s*none/);
    expect(css).toMatch(
      /@media \(prefers-reduced-transparency: reduce\)[\s\S]*?\.glass-frost,[\s\S]*?\.hero-surface-panel[\s\S]*?backdrop-filter:\s*none/,
    );
    expect(css).toMatch(/\.site-header\s*\{[\s\S]*?background-color:\s*var\(--safari-chrome-color\)/);
  });

  test("classifies large heroes as rim-lit panels and small surfaces as frost", async () => {
    const [home, projects, detail, card, hotkeys] = await Promise.all([
      Bun.file(homeUrl).text(),
      Bun.file(projectsUrl).text(),
      Bun.file(detailUrl).text(),
      Bun.file(cardUrl).text(),
      Bun.file(hotkeysUrl).text(),
    ]);

    expect(home).toMatch(/motion-rise glass-frost mb-6/);
    expect(home).toMatch(/<aside className="motion-rise motion-delay-2 surface-panel hero-surface-panel/);
    expect(home).toMatch(/snapshot-inner-card surface-panel/);
    expect(detail).toMatch(/motion-rise motion-delay-1 surface-panel hero-surface-panel/);
    expect(projects).toMatch(/motion-rise motion-delay-1[^"]*glass-frost/);
    expect(card).toMatch(/absolute glass-frost[^"\n]*rounded-full/);
    expect(card).not.toContain("backdrop-blur-xl");
    expect(hotkeys.match(/glass-frost/g)).toHaveLength(2);
    expect(hotkeys).toMatch(/hotkeys-corner-hint glass-frost/);
    expect(hotkeys).toMatch(/hotkeys-panel glass-frost/);
    expect(`${home}\n${detail}`).not.toMatch(/hero-surface-panel[^"\n]*(?:liquid-glass|backdrop-blur)/);
  });

  test("keeps the project period badge dark with white text in both themes", async () => {
    const [css, card] = await Promise.all([Bun.file(globalsUrl).text(), Bun.file(cardUrl).text()]);
    const badgeRule = getRuleBody(css, ".project-period-badge");
    const darkBadgeRule = getRuleBody(css, ".dark .project-period-badge");

    expect(card).toMatch(/project-period-badge[^"\n]*text-white/);
    expect(badgeRule).toMatch(/background:[\s\S]*(?:#|rgb|hsl|oklch|slate)/);
    expect(badgeRule).toMatch(/color:\s*(?:#fff|white|rgb\(255,\s*255,\s*255\))/);
    expect(darkBadgeRule).toMatch(/background:[\s\S]*(?:#|rgb|hsl|oklch|slate)/);
    expect(darkBadgeRule).toMatch(/color:\s*(?:#fff|white|rgb\(255,\s*255,\s*255\))/);
  });

  test("keeps the project period badge dark and blur-free under reduced transparency", async () => {
    const css = await Bun.file(globalsUrl).text();

    expect(css).toMatch(
      /@media \(prefers-reduced-transparency: reduce\)[\s\S]*?\.glass-frost,[\s\S]*?backdrop-filter:\s*none;[\s\S]*?\.project-period-badge,\s*\.dark \.project-period-badge\s*\{[\s\S]*?background:\s*#020617;[\s\S]*?color:\s*#fff;[\s\S]*?backdrop-filter:\s*none;/,
    );
  });

  test("limits TSX liquid-glass usage to Header and the dropdown primitive", async () => {
    const glob = new Bun.Glob("src/**/*.tsx");
    const matches: string[] = [];

    for await (const path of glob.scan({ cwd: new URL("../..", import.meta.url).pathname })) {
      if ((await Bun.file(new URL(`../../${path}`, import.meta.url)).text()).includes("liquid-glass")) {
        matches.push(path);
      }
    }

    expect(matches.sort()).toEqual(["src/components/Header.tsx", "src/components/ui/dropdown-menu.tsx"]);
  });
});
