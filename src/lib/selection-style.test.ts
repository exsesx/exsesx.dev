import { describe, expect, test } from "bun:test";

const globalsUrl = new URL("../styles/globals.css", import.meta.url);

describe("text selection styles", () => {
  test("keeps the global accent selection translucent in both themes", async () => {
    const css = await Bun.file(globalsUrl).text();

    expect(css).toMatch(
      /::selection\s*\{\s*background:\s*color-mix\(in oklab,\s*var\(--ring\) 28%,\s*transparent\);\s*color:\s*var\(--foreground\);/,
    );
    expect(css).toMatch(
      /\.dark ::selection\s*\{\s*background:\s*color-mix\(in oklab,\s*var\(--ring\) 30%,\s*transparent\);\s*color:\s*var\(--foreground\);/,
    );
  });

  test("restores opaque and system-native accessibility fallbacks", async () => {
    const css = await Bun.file(globalsUrl).text();

    expect(css).toMatch(
      /@media \(prefers-reduced-transparency: reduce\)\s*\{[\s\S]*?::selection\s*\{[\s\S]*?var\(--ring\) 42%,\s*var\(--background\)[\s\S]*?\.dark ::selection\s*\{[\s\S]*?var\(--ring\) 48%,\s*var\(--background\)/,
    );
    expect(css).toMatch(
      /@media \(forced-colors: active\)\s*\{[\s\S]*?::selection,\s*\.dark ::selection\s*\{[\s\S]*?color:\s*HighlightText;[\s\S]*?background:\s*Highlight;/,
    );
  });
});
