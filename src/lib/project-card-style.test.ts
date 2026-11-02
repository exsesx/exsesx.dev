import { describe, expect, test } from "bun:test";

const cardUrl = new URL("../components/ProjectCard.tsx", import.meta.url);
const wrapperUrl = new URL("../components/InteractiveCardShell.tsx", import.meta.url);
const globalsUrl = new URL("../styles/globals.css", import.meta.url);

describe("project card performance styles", () => {
  test("keeps ProjectCard server-rendered", async () => {
    const source = await Bun.file(cardUrl).text();

    expect(source).not.toMatch(/["']use client["']/);
    expect(source).not.toContain("InteractiveCardShell");
    expect(await Bun.file(wrapperUrl).exists()).toBe(false);
  });

  test("sounds every project-card activation surface", async () => {
    const source = await Bun.file(cardUrl).text();

    expect(source.match(/data-cuelume-press=""/g)).toHaveLength(3);
  });

  test("keeps hover feedback free of pointer coordinates", async () => {
    const cardSource = await Bun.file(cardUrl).text();
    const css = await Bun.file(globalsUrl).text();

    expect(`${cardSource}\n${css}`).not.toMatch(/--pointer-(?:x|y)|getBoundingClientRect|onPointerMove/);
  });

  test("neutralizes shared project media transforms for reduced motion", async () => {
    const css = await Bun.file(globalsUrl).text();

    expect(css).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.shared-project-media\s*\{[\s\S]*?transform:\s*none !important/,
    );
    expect(css).not.toContain("No pointer tracking under reduced motion");
  });
});
