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

  test("keeps narrow fine-pointer Mermaid controls below the canvas without shrinking targets", async () => {
    const css = await Bun.file(globalsCssUrl).text();
    const mobileMermaidRules = css.slice(css.lastIndexOf("@variant max-sm"));
    const mobileToolbarRule = mobileMermaidRules.match(/\.blog-mermaid-toolbar\s*\{([^}]*)\}/s)?.[1] ?? "";
    const mobileControlRule = mobileMermaidRules.match(/\.blog-mermaid-control svg\s*\{([^}]*)\}/s)?.[1] ?? "";
    const mobileResetRule = mobileMermaidRules.match(/\.blog-mermaid-reset\s*\{([^}]*)\}/s)?.[1] ?? "";
    const controlRule = css.match(/\.blog-mermaid-control\s*\{([^}]*)\}/s)?.[1] ?? "";

    expect(mobileToolbarRule).toContain("position: static");
    expect(mobileToolbarRule).toContain("display: flex");
    expect(mobileToolbarRule).toContain("width: max-content");
    expect(mobileToolbarRule).toContain("margin: 0.75rem 0 0 auto");
    expect(mobileToolbarRule).toContain("background: color-mix(in oklab, var(--foreground) 6%, var(--background))");
    expect(mobileToolbarRule).toContain("backdrop-filter: none");
    expect(mobileToolbarRule).not.toContain("saturate(");
    expect(mobileToolbarRule).toContain("0 4px 12px");
    expect(controlRule).toContain("appearance: none");
    expect(controlRule).toContain("width: 2.75rem");
    expect(controlRule).toContain("height: 2.75rem");
    expect(mobileControlRule).toContain("width: 0.9rem");
    expect(mobileControlRule).toContain("height: 0.9rem");
    expect(mobileResetRule).toContain("width: 3rem");
    expect(mobileResetRule).toContain("min-width: 3rem");
  });

  test("shows only a compact reset chip after coarse-touch Mermaid zoom", async () => {
    const css = await Bun.file(globalsCssUrl).text();
    const coarseStart = css.indexOf("@media (hover: none) and (pointer: coarse)", css.indexOf(".blog-mermaid-reset"));
    const coarseRules = css.slice(coarseStart, css.indexOf(".blog-mermaid-source", coarseStart));
    const toolbarRule = coarseRules.match(/\.blog-mermaid-toolbar\s*\{([^}]*)\}/s)?.[1] ?? "";
    const stepRule = coarseRules.match(/\.blog-mermaid-zoom-step\s*\{([^}]*)\}/s)?.[1] ?? "";
    const resetRule = coarseRules.match(/\.blog-mermaid-reset\s*\{([^}]*)\}/s)?.[1] ?? "";
    const chipRule = coarseRules.match(/\.blog-mermaid-reset-chip\s*\{([^}]*)\}/s)?.[1] ?? "";

    expect(toolbarRule).toContain("position: absolute");
    expect(toolbarRule).toContain("top: 0.5rem");
    expect(toolbarRule).toContain("right: 0.5rem");
    expect(toolbarRule).toContain("width: 2.75rem");
    expect(toolbarRule).toContain("height: 2.75rem");
    expect(toolbarRule).toContain("background: transparent");
    expect(toolbarRule).toContain("box-shadow: none");
    expect(stepRule).toContain("position: absolute");
    expect(stepRule).toContain("clip-path: inset(50%)");
    expect(resetRule).toContain("height: 2.75rem");
    expect(resetRule).toContain("opacity 160ms var(--ease-out)");
    expect(chipRule).toContain("min-width: 2.75rem");
    expect(chipRule).toContain("height: 1.875rem");
    expect(chipRule).toContain("backdrop-filter: blur(12px) saturate(1.1)");
    expect(coarseRules).toMatch(
      /\.blog-mermaid-toolbar\[data-zoomed="false"\] \.blog-mermaid-reset\s*\{[^}]*opacity:\s*0[^}]*pointer-events:\s*none/s,
    );
    expect(coarseRules).toMatch(
      /\.blog-mermaid-toolbar\[data-zoomed="true"\] \.blog-mermaid-reset\s*\{[^}]*opacity:\s*1[^}]*pointer-events:\s*auto/s,
    );
    expect(css).toMatch(/@media print\s*\{[\s\S]*?\.blog-mermaid-toolbar\s*\{?\s*display:\s*none/s);
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
    expect(scrollRule).toContain("overscroll-behavior-x: none");
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

  test("lets opt-in article figures keep their intrinsic transparent corners", async () => {
    const css = await Bun.file(globalsCssUrl).text();
    const intrinsicFigureRule = css.match(/\.blog-figure--intrinsic img\s*\{([^}]*)\}/s)?.[1] ?? "";

    expect(intrinsicFigureRule).toContain("border: 0");
    expect(intrinsicFigureRule).toContain("border-radius: 0");
    expect(intrinsicFigureRule).toContain("background: transparent");
    expect(intrinsicFigureRule).not.toContain("box-shadow");
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

  test("keeps compact Blog controls smaller on precise pointers and touch-friendly elsewhere", async () => {
    const css = await Bun.file(globalsCssUrl).text();

    expect(css).toMatch(/\.blog-locale-link::before\s*\{[^}]*inset:\s*-0\.25rem 0/s);
    expect(css).toMatch(/\.blog-code-action\s*\{[^}]*width:\s*2\.5rem;[^}]*height:\s*2\.5rem/s);
    expect(css).toMatch(
      /@media \(hover: hover\) and \(pointer: fine\)\s*\{[\s\S]*?\.blog-code-action\s*\{[^}]*width:\s*2\.25rem;[^}]*height:\s*2\.25rem/s,
    );
    expect(css).toMatch(/\.blog-read-link,\s*\.blog-back-link\s*\{[^}]*min-height:\s*2\.75rem/s);
  });

  test("keeps code wrapping opt-in, visibly selected, and printable", async () => {
    const css = await Bun.file(globalsCssUrl).text();

    expect(css).toMatch(
      /\.blog-code-block\[data-wrap="true"\] pre\s*\{[^}]*overflow-x:\s*hidden;[^}]*white-space:\s*pre-wrap/s,
    );
    expect(css).toMatch(/\.blog-code-block pre\s*\{[^}]*overflow-x:\s*auto;[^}]*overscroll-behavior-x:\s*none/s);
    expect(css).toMatch(
      /\.blog-code-action\[aria-pressed="true"\]\s*\{[^}]*color:\s*var\(--accent\);[^}]*background:[^}]*var\(--accent\)/s,
    );
    expect(css).not.toContain('.blog-code-action[data-code-action="wrap"]::after');
    expect(css).toMatch(
      /@media print\s*\{[\s\S]*?\.blog-code-toolbar\s*\{[^}]*display:\s*none;[\s\S]*?\.blog-code-block pre\s*\{[^}]*white-space:\s*pre-wrap/s,
    );
    expect(css).toMatch(
      /@media \(prefers-reduced-motion: reduce\)\s*\{[\s\S]*?\.blog-code-state-icon\s*\{[^}]*animation:\s*none/s,
    );
    expect(css).not.toContain(".blog-code-tooltip");
  });

  test("keeps Blog pointer motion gated and transparency preferences effective", async () => {
    const css = await Bun.file(globalsCssUrl).text();

    expect(css).toMatch(
      /@media \(hover: hover\) and \(pointer: fine\) \{[\s\S]*?\.blog-read-link:hover svg[\s\S]*?\.blog-back-link:hover svg/,
    );
    expect(css).toMatch(
      /@media \(prefers-reduced-transparency: reduce\) \{[\s\S]*?\.blog-toc-mobile-trigger,[\s\S]*?\.blog-toc-drawer,[\s\S]*?backdrop-filter:\s*none/,
    );
  });

  test("keeps the mobile table of contents compact and confines overflow to the modal drawer", async () => {
    const css = await Bun.file(globalsCssUrl).text();
    const triggerRule = css.match(/\.blog-toc-mobile-trigger\s*\{([^}]*)\}/s)?.[1] ?? "";
    const drawerRule = css.match(/\.blog-toc-drawer\s*\{([^}]*)\}/s)?.[1] ?? "";
    const drawerScrollRule = css.match(/\.blog-toc-drawer-scroll\s*\{([^}]*)\}/s)?.[1] ?? "";

    expect(triggerRule).toContain("width: 100%");
    expect(triggerRule).toContain("min-height: 3rem");
    expect(drawerRule).toContain("max-height: 72dvh");
    expect(drawerRule).toContain("margin-inline: auto");
    expect(drawerScrollRule).toContain("overflow-y: auto");
    expect(drawerScrollRule).toContain("overscroll-behavior: contain");
    expect(css).not.toContain(".blog-toc-mobile-shell::after");
    expect(css).not.toContain(".blog-toc-mobile nav");
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

  test("dismisses the article header as one unscaled, interruptible object", async () => {
    const css = await Bun.file(globalsCssUrl).text();
    const coarseTouchStart = css.indexOf(
      "@media (hover: none) and (pointer: coarse)",
      css.indexOf('[data-blog-article="true"] .site-header-nav-frame'),
    );
    const coarseTouchRules = css.slice(coarseTouchStart, css.indexOf("/* Keyboard-driven", coarseTouchStart));
    const visibleFrameRule =
      css.match(/\[data-blog-article="true"\] \.site-header-nav-frame\s*\{([^}]*)\}/s)?.[1] ?? "";
    const visibleFadeRule = css.match(/\[data-blog-article="true"\] \.site-header-fade\s*\{([^}]*)\}/s)?.[1] ?? "";
    const hiddenFrameRule =
      css.match(
        /:is\(\s*html\[data-blog-focus-bootstrap="pending"\] \[data-blog-article="true"\],[\s\S]*?\[data-blog-article="true"\]\[data-blog-focus="true"\]\s*\)\s*\.site-header-nav-frame\s*\{([^}]*)\}/s,
      )?.[1] ?? "";
    const hiddenFadeRule =
      css.match(
        /:is\(\s*html\[data-blog-focus-bootstrap="pending"\] \[data-blog-article="true"\],[\s\S]*?\[data-blog-article="true"\]\[data-blog-focus="true"\]\s*\)\s*\.site-header-fade\s*\{([^}]*)\}/s,
      )?.[1] ?? "";

    expect(visibleFrameRule).toContain("transform: translate3d(0, 0, 0) scale(1)");
    expect(visibleFrameRule).toContain("opacity 140ms var(--ease-out)");
    expect(visibleFrameRule).toContain("transform 180ms var(--ease-weight)");
    expect(hiddenFrameRule).toContain(
      "transform: translate3d(0, calc(-100% - env(safe-area-inset-top) - 1.5rem), 0) scale(1)",
    );
    expect(hiddenFrameRule).toContain("opacity 160ms var(--ease-out)");
    expect(hiddenFrameRule).toContain("transform 220ms var(--ease-out)");
    expect(visibleFadeRule).toContain("opacity 140ms var(--ease-out)");
    expect(hiddenFadeRule).toContain("opacity 160ms var(--ease-out)");
    expect(visibleFadeRule).not.toContain("transform");
    expect(hiddenFadeRule).not.toContain("transform");
    expect(coarseTouchRules).toMatch(
      /\[data-blog-article="true"\] \.site-header-nav-frame\s*\{[^}]*opacity 240ms var\(--ease-out\)[^}]*transform 300ms var\(--ease-weight\)/s,
    );
    expect(coarseTouchRules).toMatch(
      /\[data-blog-article="true"\] \.site-header-fade\s*\{[^}]*opacity 240ms var\(--ease-out\)/s,
    );
    expect(coarseTouchRules).toMatch(
      /\.site-header-nav-frame\s*\{[^}]*opacity 220ms var\(--ease-out\)[^}]*transform 280ms var\(--ease-out\)[^}]*visibility 0s linear 280ms/s,
    );
    expect(coarseTouchRules).toMatch(
      /\.site-header-fade\s*\{[^}]*opacity 220ms var\(--ease-out\)[^}]*visibility 0s linear 220ms/s,
    );
    expect(css).toMatch(
      /\[data-blog-article="true"\]\[data-blog-header-motion="instant"\] \.site-header-nav-frame,[\s\S]*?\.site-header-fade\s*\{\s*transition:\s*none/s,
    );
  });

  test("keeps article tables of contents clear of the transient header", async () => {
    const css = await Bun.file(globalsCssUrl).text();
    const mobileRule = css.match(/\.blog-toc-mobile-shell\s*\{([^}]*)\}/s)?.[1] ?? "";
    const desktopRule = css.match(/\.blog-toc-desktop\s*\{([^}]*)\}/s)?.[1] ?? "";
    const mobileSection = css.slice(css.indexOf(".blog-toc-mobile-shell"), css.indexOf(".blog-toc-desktop"));
    const coarseTouchStart = mobileSection.indexOf("@media (hover: none) and (pointer: coarse)");
    const coarseTouchRules = mobileSection.slice(coarseTouchStart);
    const desktopSection = css.slice(css.indexOf(".blog-toc-desktop"), css.indexOf(".blog-toc-desktop > p"));

    expect(css).toContain('html[data-blog-focus-bootstrap="pending"]');
    expect(css).toContain('html[data-blog-focus-bootstrap="hidden"]');
    expect(mobileRule).toContain("--blog-toc-visible-top: calc(env(safe-area-inset-top) + 5.875rem)");
    expect(mobileRule).toContain("top: var(--blog-toc-visible-top)");
    expect(mobileRule).toContain("transition: top 180ms var(--ease-weight)");
    expect(mobileSection).toMatch(
      /\[data-blog-article="true"\]\[data-blog-passive-hidden="true"\],[\s\S]*?\[data-blog-article="true"\]\[data-blog-focus="true"\][\s\S]*?\.blog-toc-mobile-shell\s*\{[^}]*top:\s*calc\(env\(safe-area-inset-top\) \+ 0\.75rem\)[^}]*transition:\s*top 220ms var\(--ease-out\)/s,
    );
    expect(coarseTouchRules).toMatch(/\.blog-toc-mobile-shell\s*\{[^}]*transition:\s*top 300ms var\(--ease-weight\)/s);
    expect(coarseTouchRules).toMatch(
      /\[data-blog-article="true"\]\[data-blog-passive-hidden="true"\],[\s\S]*?\.blog-toc-mobile-shell\s*\{[^}]*transition:\s*top 280ms var\(--ease-out\)/s,
    );
    expect(desktopRule).toContain("top: calc(env(safe-area-inset-top) + 5.875rem)");
    expect(desktopRule).toContain("max-height: calc(100svh - env(safe-area-inset-top) - 7.125rem)");
    expect(desktopRule).toContain("transition: top 180ms var(--ease-weight)");
    expect(desktopSection).toMatch(
      /\[data-blog-article="true"\]\[data-blog-passive-hidden="true"\],[\s\S]*?\[data-blog-article="true"\]\[data-blog-focus="true"\][\s\S]*?\.blog-toc-desktop\s*\{[^}]*top:\s*calc\(env\(safe-area-inset-top\) \+ 1\.25rem\)[^}]*transition:\s*top 220ms var\(--ease-out\)/s,
    );
    expect(desktopSection).toMatch(
      /html\[data-blog-focus-bootstrap\] \[data-blog-article="true"\] :is\(\.blog-toc-mobile-shell, \.blog-toc-desktop\),[\s\S]*?\[data-blog-header-motion="instant"\] :is\(\.blog-toc-mobile-shell, \.blog-toc-desktop\)\s*\{\s*transition:\s*none/s,
    );
    expect(desktopSection).toMatch(
      /@media \(prefers-reduced-motion: reduce\)\s*\{[\s\S]*?:is\(\.blog-toc-mobile-shell, \.blog-toc-desktop\)\s*\{\s*transition:\s*none/s,
    );
  });

  test("gives the compact table of contents a restrained supporting frost", async () => {
    const css = await Bun.file(globalsCssUrl).text();
    const triggerRule = css.match(/\.blog-toc-mobile-trigger\s*\{([^}]*)\}/s)?.[1] ?? "";
    const hoverRule = css.match(/\.blog-toc-mobile-trigger:is\(:hover, :focus-visible\)\s*\{([^}]*)\}/s)?.[1] ?? "";
    const increasedContrastStart = css.indexOf(
      "@media (prefers-contrast: more)",
      css.indexOf(".blog-toc-mobile-trigger:active"),
    );
    const increasedContrastRules = css.slice(
      increasedContrastStart,
      css.indexOf(".blog-toc-current", increasedContrastStart),
    );

    expect(triggerRule).toContain("background: color-mix(in oklab, var(--background) 72%, transparent)");
    expect(triggerRule).toContain("inset 0 1px 0");
    expect(triggerRule).toContain("0 10px 28px");
    expect(triggerRule).toContain("backdrop-filter: blur(14px) saturate(1.2)");
    expect(hoverRule).toContain("background: color-mix(in oklab, var(--background) 78%, var(--foreground) 2%)");
    expect(increasedContrastRules).toMatch(
      /\.blog-toc-mobile-trigger\s*\{[^}]*background:\s*color-mix\(in oklab, var\(--background\) 97%, var\(--foreground\) 3%\)[^}]*backdrop-filter:\s*none/s,
    );
  });

  test("uses opacity-only article header changes when reduced motion is requested", async () => {
    const css = await Bun.file(globalsCssUrl).text();
    const reducedMotionCss = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"));

    expect(reducedMotionCss).toMatch(
      /\[data-blog-article="true"\] \.site-header-nav-frame\s*\{[^}]*transform:\s*none[^}]*opacity 140ms var\(--ease-out\)/s,
    );
    expect(reducedMotionCss).toMatch(
      /\[data-blog-article="true"\]\[data-blog-passive-hidden="true"\][\s\S]*?\.site-header-nav-frame\s*\{[^}]*transform:\s*none[^}]*opacity 160ms var\(--ease-out\)/s,
    );
    expect(reducedMotionCss).toMatch(
      /html\[data-blog-focus-bootstrap\] \[data-blog-article="true"\] \.site-header-nav-frame,[\s\S]*?\[data-blog-header-motion="instant"\] \.site-header-fade\s*\{\s*transition:\s*none/s,
    );
    expect(css).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.site-header-nav-frame,[\s\S]*?\.site-header-fade,[\s\S]*?\.nav-back-button\s*\{\s*transition:\s*none/s,
    );
  });
});
