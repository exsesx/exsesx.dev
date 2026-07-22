import { describe, expect, test } from "bun:test";

const globalsCssUrl = new URL("../styles/globals.css", import.meta.url);
const readingProgressUrl = new URL("../components/blog/ReadingProgress.tsx", import.meta.url);

describe("Blog production styles", () => {
  test("uses a Shiki theme selector that survives the Next CSS minifier", async () => {
    const css = await Bun.file(globalsCssUrl).text();

    expect(css).toContain("code[data-theme] span");
    expect(css).not.toContain('code[data-theme*=" "] span');
  });

  test("does not force Mermaid diagrams wider than a mobile article", async () => {
    const css = await Bun.file(globalsCssUrl).text();

    expect(css).not.toMatch(/\.blog-mermaid-svg\s*\{[^}]*min-width:\s*30rem/s);
    expect(css).toMatch(/\.blog-mermaid-source\s*\{[^}]*font-family:\s*var\(--font-mono\)/s);
  });

  test("frames Mermaid diagrams with the site's restrained accent treatment", async () => {
    const css = await Bun.file(globalsCssUrl).text();
    const rule = css.match(/\.blog-mermaid\s*\{([^}]*)\}/s)?.[1] ?? "";

    expect(rule).toContain("border: 1px solid color-mix(in oklab, var(--accent)");
    expect(rule).toContain("radial-gradient(");
    expect(rule).toContain("box-shadow:");
  });

  test("vertically aligns inline source badges without a font-specific offset", async () => {
    const css = await Bun.file(globalsCssUrl).text();

    expect(css).toMatch(/\.source-link-host\s*\{[^}]*vertical-align:\s*middle/s);
    expect(css).not.toMatch(/\.source-link-host\s*\{[^}]*vertical-align:\s*0\.12em/s);
  });

  test("uses contrast and surface feedback instead of underlining Blog links", async () => {
    const css = await Bun.file(globalsCssUrl).text();
    const blogCss = css.slice(css.indexOf("/* Blog"));

    expect(blogCss).not.toContain("text-decoration: underline;");
    expect(blogCss).toContain("a:not(.source-link):is(:hover, :focus-visible)");
    expect(blogCss).toContain(".source-link:is(:hover, :focus-visible) .source-link-label");
    expect(blogCss).toContain(".blog-read-link:is(:hover, :focus-visible)");
  });

  test("moves both halves of a source citation on one hover timing curve", async () => {
    const css = await Bun.file(globalsCssUrl).text();

    expect(css).toContain("--source-link-hover-duration: var(--duration-ui)");
    expect(css).toContain("--source-link-hover-ease: var(--ease-out)");
    expect(css).toContain("background-color var(--source-link-hover-duration) var(--source-link-hover-ease)");
    expect(css).toContain("box-shadow var(--source-link-hover-duration) var(--source-link-hover-ease)");
    expect(css).toContain("border-color var(--source-link-hover-duration) var(--source-link-hover-ease)");
  });

  test("extends compact Blog controls to touch-friendly hit areas", async () => {
    const css = await Bun.file(globalsCssUrl).text();

    expect(css).toMatch(/\.blog-locale-link::before\s*\{[^}]*inset:\s*-0\.25rem 0/s);
    expect(css).toMatch(/\.blog-code-copy::before\s*\{[^}]*inset:\s*-0\.45rem/s);
    expect(css).toMatch(/\.blog-read-link,\s*\.blog-back-link\s*\{[^}]*min-height:\s*2\.75rem/s);
  });

  test("keeps Blog pointer motion gated and transparency preferences effective", async () => {
    const css = await Bun.file(globalsCssUrl).text();

    expect(css).toMatch(
      /@media \(hover: hover\) and \(pointer: fine\) \{[\s\S]*?\.blog-read-link:hover svg[\s\S]*?\.blog-back-link:hover svg/,
    );
    expect(css).toMatch(
      /@media \(prefers-reduced-transparency: reduce\) \{[\s\S]*?\.blog-toc-mobile\s*\{[\s\S]*?backdrop-filter:\s*none/,
    );
  });

  test("updates continuous reading progress without a React render per frame", async () => {
    const source = await Bun.file(readingProgressUrl).text();

    expect(source).toContain("const progressBarRef = useRef<HTMLSpanElement>(null)");
    expect(source).toMatch(/progressBarElement\.style\.transform = `scaleX\(\$\{nextProgress\}\)`/);
    expect(source).not.toContain("useState(");
  });
});
