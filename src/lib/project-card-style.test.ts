import { describe, expect, test } from "bun:test";

const cardUrl = new URL("../components/Card.tsx", import.meta.url);
const wrapperUrl = new URL("../components/InteractiveCardShell.tsx", import.meta.url);
const globalsUrl = new URL("../styles/globals.css", import.meta.url);

function getRuleBody(css: string, selector: string) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return css.match(new RegExp(`${escapedSelector}\\s*\\{(?<body>[\\s\\S]*?)\\n\\}`))?.groups?.body ?? "";
}

describe("project card performance styles", () => {
  test("keeps ProjectCard server-rendered through the shared UiCard primitive", async () => {
    const source = await Bun.file(cardUrl).text();

    expect(source).toMatch(/Card as UiCard/);
    expect(source).toMatch(/<UiCard[\s\S]*className=\{cn\([\s\S]*interactive-card/);
    expect(source).not.toMatch(/["']use client["']/);
    expect(source).not.toContain("InteractiveCardShell");
    expect(await Bun.file(wrapperUrl).exists()).toBe(false);
  });

  test("uses a static hover and focus glow without pointer coordinates", async () => {
    const cardSource = await Bun.file(cardUrl).text();
    const css = await Bun.file(globalsUrl).text();
    const glowRule = getRuleBody(css, ".interactive-card::after");

    expect(`${cardSource}\n${css}`).not.toMatch(/--pointer-(?:x|y)|getBoundingClientRect|onPointerMove/);
    expect(glowRule).toMatch(/inset:\s*0/);
    expect(glowRule).not.toMatch(/translate3d|--pointer-/);
    expect(css).toMatch(/\.interactive-card:focus-within::after\s*\{[\s\S]*?opacity:\s*1/);
    expect(css).toMatch(
      /@media \(hover: hover\) and \(pointer: fine\)[\s\S]*?\.interactive-card:hover::after\s*\{[\s\S]*?opacity:\s*1/,
    );
    expect(css).not.toMatch(
      /@media \(hover: hover\) and \(pointer: fine\)[\s\S]*?\.interactive-card:focus-within::after/,
    );
  });

  test("preserves fine-pointer lift and neutralizes card transforms for reduced motion", async () => {
    const css = await Bun.file(globalsUrl).text();

    expect(css).toMatch(
      /@media \(hover: hover\) and \(pointer: fine\)[\s\S]*?\.interactive-card:hover\s*\{[\s\S]*?translateY\(-5px\)/,
    );
    expect(css).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.interactive-card,[\s\S]*?transform:\s*none !important/,
    );
    expect(css).not.toContain("No pointer tracking under reduced motion");
  });
});
