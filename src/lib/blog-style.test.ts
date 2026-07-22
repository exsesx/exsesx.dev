import { describe, expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ReadingProgress from "../components/blog/ReadingProgress";

const globalsCssUrl = new URL("../styles/globals.css", import.meta.url);
const readingProgressUrl = new URL("../components/blog/ReadingProgress.tsx", import.meta.url);
const focusProviderUrl = new URL("../components/blog/BlogFocusProvider.tsx", import.meta.url);
const headerUrl = new URL("../components/Header.tsx", import.meta.url);

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
    expect(rule).toContain("border-radius: var(--blog-rich-block-radius)");
    expect(rule).toContain("radial-gradient(");
    expect(rule).toContain("box-shadow:");
  });

  test("gives the featured Blog card one opaque, evenly weighted outer frame", async () => {
    const css = await Bun.file(globalsCssUrl).text();
    const indexRule = css.match(/\.blog-index\s*\{([^}]*)\}/s)?.[1] ?? "";
    const cardRule = css.match(/\.blog-featured-post,\s*\.blog-empty-state\s*\{([^}]*)\}/s)?.[1] ?? "";

    expect(indexRule).toContain("--blog-index-card-radius: 2rem");
    expect(indexRule).toContain(
      "--blog-index-card-surface: color-mix(in oklab, var(--foreground) 3%, var(--background))",
    );
    expect(indexRule).toContain("--blog-index-card-border:");
    expect(indexRule).not.toMatch(/--blog-index-card-(?:surface|border):[^;]*transparent/);
    expect(cardRule).toContain("overflow: hidden");
    expect(cardRule).toContain("border: 1px solid var(--blog-index-card-border)");
    expect(cardRule).toContain("border-radius: var(--blog-index-card-radius)");
    expect(cardRule).toContain("var(--blog-index-card-surface)");
    expect(cardRule).not.toContain("box-shadow:");
    expect(css).not.toContain(".blog-featured-post::before");
  });

  test("frames semantic tables as one clipped rich block with directional overflow cues", async () => {
    const css = await Bun.file(globalsCssUrl).text();
    const frameRule = css.match(/\.blog-table-frame\s*\{([^}]*)\}/s)?.[1] ?? "";
    const scrollRule = css.match(/\.blog-table-scroll\s*\{([^}]*)\}/s)?.[1] ?? "";
    const tableRule = css.match(/\.blog-prose table\s*\{([^}]*)\}/s)?.[1] ?? "";
    const rhythmRule =
      css.match(
        /\.blog-prose \.blog-table-frame,\s*\.blog-prose > figure,\s*\.blog-prose \.blog-callout\s*\{([^}]*)\}/s,
      )?.[1] ?? "";

    expect(frameRule).toContain("overflow: hidden");
    expect(frameRule).toContain("border: 1px solid var(--blog-rich-block-border)");
    expect(frameRule).toContain("border-radius: var(--blog-rich-block-radius)");
    expect(frameRule).toContain("background: var(--blog-rich-block-surface)");
    expect(scrollRule).toContain("overflow-x: auto");
    expect(scrollRule).not.toContain("overscroll-behavior");
    expect(tableRule).toContain("font-family: var(--font-sans)");
    expect(tableRule).toContain("margin: 0");
    expect(tableRule).not.toContain("overflow");
    expect(tableRule).not.toContain("border-radius");
    expect(tableRule).not.toMatch(/(?:^|\n)\s*border:/);
    expect(rhythmRule).toContain("margin-top: var(--blog-rich-block-gap)");
    expect(css).toMatch(/\.blog-prose tr > :where\(th, td\):last-child\s*\{[^}]*border-inline-end:\s*0/s);
    expect(css).toMatch(
      /\.blog-prose table > :last-child > tr:last-child > :where\(th, td\)\s*\{[^}]*border-block-end:\s*0/s,
    );
    expect(css).toMatch(/\.blog-table-frame::before,\s*\.blog-table-frame::after\s*\{[^}]*opacity:\s*0/s);
    expect(css).toMatch(/\.blog-table-frame\[data-scroll-left="true"\]::before\s*\{[^}]*opacity:\s*1/s);
    expect(css).toMatch(/\.blog-table-frame\[data-scroll-right="true"\]::after\s*\{[^}]*opacity:\s*1/s);
    expect(css).not.toContain("background-attachment: local, scroll");
  });

  test("uses one strong outer-edge contract across rounded article rich blocks", async () => {
    const css = await Bun.file(globalsCssUrl).text();
    const proseRule = css.match(/\.blog-prose\s*\{([^}]*)\}/s)?.[1] ?? "";

    expect(proseRule).toContain("--blog-rich-block-radius: var(--radius)");
    expect(proseRule).toContain("--blog-rich-block-gap: 1.5rem");
    expect(proseRule).toContain("--blog-rich-block-border:");
    expect(proseRule).toContain(
      "--blog-rich-block-surface: color-mix(in oklab, var(--foreground) 3%, var(--background))",
    );
    expect(proseRule).not.toMatch(/--blog-rich-block-(?:border|divider):[^;]*transparent/);
    expect(css).toMatch(/\.blog-callout\s*\{[^}]*var\(--blog-rich-block-border\)/s);
    expect(css).toMatch(/figure\[data-rehype-pretty-code-figure\]\s*\{[^}]*var\(--blog-rich-block-border\)/s);
    expect(css).toMatch(/\.blog-mermaid\s*\{[^}]*var\(--blog-rich-block-border\)/s);
    expect(css).toMatch(/\.blog-figure img\s*\{[^}]*var\(--blog-rich-block-border\)/s);
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

  test("keeps the reading-progress surface non-painting until its first measured commit", async () => {
    const [css, source] = await Promise.all([Bun.file(globalsCssUrl).text(), Bun.file(readingProgressUrl).text()]);
    const markup = renderToStaticMarkup(createElement(ReadingProgress, { articleId: "article-content" }));
    const renderBody = source.match(/function renderProgress\(\) \{([\s\S]*?)\n {4}\}/)?.[1] ?? "";
    const measureBody = source.match(/function measure\(\) \{([\s\S]*?)\n {4}\}/)?.[1] ?? "";

    expect(markup).toMatch(/<div(?=[^>]*class="blog-reading-progress")(?=[^>]*hidden)/);
    expect(css).toMatch(/\.blog-reading-progress\[hidden\]\s*\{[^}]*display:\s*none/s);
    expect(source).toContain('import { useLayoutEffect, useRef } from "react"');
    expect(renderBody).toMatch(/progressBarElement\.style\.transform = `scaleX\(\$\{nextProgress\}\)`/);
    expect(renderBody).toContain("progressRootElement.hidden = nextProgress <= 0");
    expect(renderBody.indexOf("style.transform")).toBeLessThan(renderBody.indexOf(".hidden"));
    expect(measureBody).toContain("renderProgress()");
    expect(measureBody).not.toContain("update()");
  });

  test("scopes focus state to Blog articles without adding a header control", async () => {
    const [provider, header] = await Promise.all([Bun.file(focusProviderUrl).text(), Bun.file(headerUrl).text()]);

    expect(provider).toContain("isBlogPostPath(pathname)");
    expect(provider).toContain('data-blog-focus={isFocusMode ? "true" : undefined}');
    expect(provider).toContain('data-blog-passive-hidden={isPassiveHeaderHidden ? "true" : undefined}');
    expect(header).not.toContain("blog-focus-toggle");
    expect(header).not.toContain('aria-keyshortcuts="Meta+. Control+."');
    expect(header).toContain("inert={isReadingHeaderHidden ? true : undefined}");
  });

  test("confirms every explicit Focus toggle with one subtle Base UI toast", async () => {
    const provider = await Bun.file(focusProviderUrl).text();

    expect(provider).toContain('import { Toast } from "@base-ui/react/toast"');
    expect(provider).toContain("<Toast.Provider limit={1} timeout={BLOG_FOCUS_TOAST_TIMEOUT}>");
    expect(provider).toContain("id: BLOG_FOCUS_TOAST_ID");
    expect(provider).toContain('priority: "low"');
    expect(provider).toContain("showFocusToast(copy.focusModeOn)");
    expect(provider).toContain("showFocusToast(copy.focusModeOff)");
    expect(provider).toContain("closeToast(BLOG_FOCUS_TOAST_ID)");
    expect(provider).toContain('<Toast.Viewport className="blog-focus-toast-viewport">');
    expect(provider).toContain('<Toast.Title className="blog-focus-toast-title" />');
    expect(provider).not.toContain("setAnnouncement");
  });

  test("moves the whole article upward only in explicit Focus mode", async () => {
    const css = await Bun.file(globalsCssUrl).text();
    const focusArticleRule = css.match(/\[data-blog-focus="true"\] \.blog-article\s*\{([^}]*)\}/s)?.[1] ?? "";

    expect(focusArticleRule).toContain("padding-top: calc(env(safe-area-inset-top) + 2rem)");
    expect(focusArticleRule).not.toContain("transition");
    expect(focusArticleRule).not.toContain("transform");
    expect(css).toMatch(
      /@media \(min-width: 64rem\)\s*\{\s*\[data-blog-focus="true"\] \.blog-article\s*\{[^}]*padding-top:\s*calc\(env\(safe-area-inset-top\) \+ 2\.5rem\)/s,
    );
    expect(css).not.toMatch(/\[data-blog-passive-hidden="true"\][^{]*\.blog-article/);
  });

  test("keeps Safari's header sample shell while hiding only reading distractions", async () => {
    const css = await Bun.file(globalsCssUrl).text();

    expect(css).toMatch(/\.site-header\s*\{[^}]*--safari-sample-band/s);
    expect(css).toContain('[data-blog-focus="true"] .kinetic-backdrop > *');
    expect(css).toContain('[data-blog-focus="true"] .hotkeys-corner-hint');
    expect(css).toContain('[data-blog-focus="true"] .site-version-tag');
    expect(css).not.toMatch(/\[data-blog-focus="true"\][^{]*\.blog-reading-progress/);
    expect(css).not.toMatch(/\[data-blog-focus="true"\][^{]*\.blog-prose/);
  });

  test("reclaims the header offset for both sticky table-of-contents surfaces", async () => {
    const css = await Bun.file(globalsCssUrl).text();

    expect(css).toContain('html[data-blog-focus-bootstrap="pending"]');
    expect(css).toContain('html[data-blog-focus-bootstrap="hidden"]');
    expect(css).toMatch(
      /:is\([\s\S]*?\[data-blog-passive-hidden="true"\][\s\S]*?\[data-blog-focus="true"\][\s\S]*?\)\s*\.blog-toc-mobile-shell\s*\{[^}]*safe-area-inset-top[^}]*0\.75rem/s,
    );
    expect(css).toMatch(
      /:is\([\s\S]*?\[data-blog-passive-hidden="true"\][\s\S]*?\[data-blog-focus="true"\][\s\S]*?\)\s*\.blog-toc-desktop\s*\{[^}]*safe-area-inset-top/s,
    );
    expect(css).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.blog-toc-mobile-shell,[\s\S]*?\.blog-toc-desktop\s*\{\s*transition:\s*none/s,
    );
    expect(css).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.site-nav-glass,[\s\S]*?\.site-header-nav-frame,[\s\S]*?\.nav-back-button\s*\{\s*transition:\s*none/s,
    );
  });
});
