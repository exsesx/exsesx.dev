import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { DIAGRAM_LAYOUT_WIDTHS } from "@/lib/mermaid-camera";
import { getMermaidAccessibleDescription, getMermaidAccessibleLabel } from "@/lib/mermaid-theme";
import MermaidDiagram, { MermaidDiagramView } from "./MermaidDiagram";

const globalsCssUrl = new URL("../../styles/globals.css", import.meta.url);

describe("MermaidDiagram", () => {
  test("reserves a universal diagram viewport with an inert loading skeleton", async () => {
    const markup = renderToStaticMarkup(<MermaidDiagram frame={null} source={"flowchart TD\n  Browser --> Server"} />);
    const css = await Bun.file(globalsCssUrl).text();

    expect(markup).toContain('data-state="loading"');
    expect(markup).toContain('data-theme="light"');
    // The server markup is what a reader without scripts keeps, and nothing will load there.
    expect(markup).not.toContain("aria-busy");
    expect(markup).not.toContain('role="img"');
    expect(markup).toContain('class="blog-mermaid-visual blog-mermaid-skeleton"');
    expect(markup).toContain('aria-hidden="true"');
    expect(markup).toContain("Diagram illustrating this section");
    expect(markup).not.toContain("blog-mermaid-source");
    expect(markup).not.toContain("Browser-&gt;&gt;Server");
    expect(markup).not.toContain("blog-mermaid-skeleton-node");
    expect(markup).not.toContain("<noscript>");
    // An invisible, inert toolbar holds the header column so the caption does not rewrap when the drawing lands.
    expect(markup).toMatch(
      /<div class="blog-mermaid-toolbar" aria-hidden="true"[^>]*data-placeholder="true"[^>]*inert=""/,
    );
    expect(css).toMatch(/\.blog-mermaid-toolbar\[data-placeholder\]\s*\{[^}]*visibility:\s*hidden/s);
    expect(css).toMatch(
      /\.blog-mermaid:has\(\.blog-mermaid-fallback\) :is\(\.blog-mermaid-skeleton, \.blog-mermaid-toolbar\)\s*\{[^}]*display:\s*none/s,
    );
    expect(css).toMatch(/\.blog-mermaid-visual\s*\{[^}]*block-size:\s*clamp\(/s);
    expect(css).toMatch(/\.blog-mermaid-visual\s*\{[^}]*clamp\(20rem,\s*65vw,\s*32rem\)/s);
    expect(css).toMatch(/\.blog-mermaid-svg\s*\{[^}]*position:\s*relative/s);
    expect(css).toMatch(/\.blog-mermaid-svg\s*\{[^}]*cursor:\s*default/s);
    expect(css).not.toMatch(/cursor:\s*zoom-in/);
    expect(css).toMatch(/\.blog-mermaid-svg\s*\{[^}]*touch-action:\s*pan-y/s);
    expect(css).toMatch(/\.blog-mermaid-svg\[data-zoomed="true"\]\s*\{[^}]*touch-action:\s*none/s);
    expect(css).toMatch(/\.blog-mermaid-svg svg\s*\{[^}]*position:\s*absolute[^}]*height:\s*100%/s);
    expect(css).toMatch(/\.blog-mermaid-svg svg\s*\{[^}]*max-width:\s*none !important/s);
    expect(css).toMatch(/\.blog-mermaid\[data-state="loading"\]\s*\{[^}]*overflow:\s*hidden/s);
    expect(css).toMatch(
      /\.blog-mermaid\[data-state="loading"\]::after\s*\{[^}]*animation:\s*blog-mermaid-loading-sweep/s,
    );
    expect(css).not.toMatch(/\.blog-mermaid-skeleton\s*\{[^}]*(?:border-radius|background|overflow):/s);
    expect(css).not.toMatch(/\.blog-mermaid-skeleton::(?:before|after)/);
    expect(css).toMatch(/@keyframes blog-mermaid-loading-sweep\s*\{[^}]*transform:/s);
    expect(css).not.toMatch(/@keyframes blog-mermaid-loading-sweep\s*\{[^}]*background-position:/s);
    expect(css).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.blog-mermaid\[data-state="loading"\]::after\s*\{[^}]*animation:\s*none[^}]*will-change:\s*auto/s,
    );
  });

  test("shows the authored description in place of the canvas when scripts never run", () => {
    const markup = renderToStaticMarkup(
      <MermaidDiagram frame={null} source={"flowchart TD\n  accDescr: The root delegates work.\n  root --> child"} />,
    );

    expect(markup).toMatch(
      /<noscript><p class="blog-mermaid-visual blog-mermaid-fallback" aria-hidden="true"[^>]*>The root delegates work\.<\/p><\/noscript>/,
    );
    expect(markup).toContain('class="blog-mermaid-visual blog-mermaid-skeleton"');
  });

  test("hands the reserved visual over to one labelled ready-state image", () => {
    const markup = renderToStaticMarkup(
      <MermaidDiagramView
        accessibleDescription="A root agent delegates work."
        accessibleLabel="Agents V2 task hierarchy"
        frame={null}
        isRendering={false}
        reactId="diagram"
        resolvedTheme="dark"
        source="flowchart TD"
        state={{
          status: "ready",
          renderedSource: "flowchart TD",
          svg: '<svg aria-hidden="true" focusable="false"><title>Duplicate title</title></svg>',
        }}
      />,
    );

    expect(markup).toContain('data-state="ready"');
    expect(markup).toContain('data-theme="dark"');
    expect(markup).not.toContain("aria-busy");
    expect(markup).toContain('aria-labelledby="diagram-label"');
    expect(markup).toContain('class="blog-mermaid-visual blog-mermaid-svg"');
    expect(markup).toMatch(/class="blog-mermaid-visual blog-mermaid-svg"[^>]*role="img"[^>]*tabindex="0"/);
    expect(markup).toContain('role="toolbar"');
    expect(markup).toContain('class="blog-mermaid-toolbar"');
    expect(markup).toContain('data-zoomed="false"');
    expect(markup).toContain('aria-label="Zoom in"');
    expect(markup).toContain('aria-label="Zoom out"');
    expect(markup).toContain('aria-label="Reset diagram zoom, 100%"');
    expect(markup).toContain('data-mermaid-control="zoom-in"');
    expect(markup).toContain('data-mermaid-control="zoom-out"');
    expect(markup).toContain('data-mermaid-control="reset"');
    expect(markup.match(/blog-mermaid-zoom-step/g)).toHaveLength(2);
    expect(markup).toContain('class="blog-mermaid-reset-chip">100%</span>');
    expect(markup).not.toContain('aria-label="Move"');
    expect(markup).not.toContain("blog-mermaid-gesture-hint");
    expect(markup).not.toContain("<noscript>");
    expect(markup).toContain('aria-hidden="true" focusable="false"');
    expect(markup).toContain("A root agent delegates work.");
    expect(markup).not.toContain("blog-mermaid-skeleton");
    expect(markup).not.toContain("blog-mermaid-source");
  });

  test("reserves the server-measured frame from the skeleton through the drawing", async () => {
    const source = "flowchart TD\n  root --> child";
    const frame = { compact: { width: 290, height: 232 }, wide: { width: 1055, height: 150 } };
    const frameStyle =
      'style="--blog-mermaid-compact-ratio:290 / 232;--blog-mermaid-compact-height:232px;' +
      '--blog-mermaid-wide-ratio:1055 / 150;--blog-mermaid-wide-height:150px"';
    const skeleton = renderToStaticMarkup(<MermaidDiagram frame={frame} source={source} />);
    const ready = renderToStaticMarkup(
      <MermaidDiagramView
        accessibleDescription={null}
        accessibleLabel="Task hierarchy"
        frame={frame}
        isRendering={false}
        reactId="diagram"
        resolvedTheme="light"
        source={source}
        state={{ status: "ready", renderedSource: source, svg: '<svg viewBox="0 0 400 100" />' }}
      />,
    );
    const css = await Bun.file(globalsCssUrl).text();

    for (const markup of [skeleton, ready]) {
      expect(markup).toContain('data-frame="reserved"');
      expect(markup).toContain(frameStyle);
    }

    expect(ready).not.toMatch(/blog-mermaid-svg"[^>]*style=/);
    expect(css).toMatch(/\.blog-mermaid\s*\{[^}]*container-type:\s*inline-size/s);
    expect(css).toMatch(
      /\.blog-mermaid\[data-frame\] > :is\(\.blog-mermaid-skeleton, \.blog-mermaid-svg\)\s*\{[^}]*aspect-ratio:\s*var\(--blog-mermaid-compact-ratio\)/s,
    );
    // The stylesheet switches layouts at the frame width the component draws the wide layout from.
    expect(css).toMatch(
      new RegExp(
        `@container \\(width >= ${DIAGRAM_LAYOUT_WIDTHS.wide}px\\)\\s*\\{\\s*\\.blog-mermaid\\[data-frame\\][^{]*\\{[^}]*aspect-ratio:\\s*var\\(--blog-mermaid-wide-ratio\\)`,
        "s",
      ),
    );
  });

  test("uses an authored Mermaid accessibility title with a safe fallback", () => {
    expect(getMermaidAccessibleLabel("flowchart TD\n  accTitle: Agents V2 task hierarchy")).toBe(
      "Agents V2 task hierarchy",
    );
    expect(getMermaidAccessibleLabel("flowchart TD\n  root --> child")).toBe("Diagram illustrating this section");
    expect(getMermaidAccessibleDescription("flowchart TD\n  accDescr: The root delegates work.")).toBe(
      "The root delegates work.",
    );
    expect(getMermaidAccessibleDescription("flowchart TD\n  root --> child")).toBeNull();
  });

  test("keeps the loaded diagram and controls visible while layout is updated", () => {
    const source = "flowchart TD\n  root --> child";
    const markup = renderToStaticMarkup(
      <MermaidDiagramView
        accessibleDescription={null}
        accessibleLabel="Task hierarchy"
        frame={null}
        isRendering={true}
        reactId="diagram"
        resolvedTheme="dark"
        source={source}
        state={{ status: "ready", renderedSource: source, svg: '<svg data-layout="previous" />' }}
      />,
    );

    expect(markup).toContain('data-state="updating"');
    expect(markup).toContain('aria-busy="true"');
    expect(markup).toContain('data-layout="previous"');
    expect(markup).toContain('data-mermaid-control="zoom-in"');
    expect(markup).not.toContain("blog-mermaid-skeleton");
  });

  test("shows the source and a readable error when rendering fails", () => {
    const source = "flowchart TD\n broken[";
    const markup = renderToStaticMarkup(
      <MermaidDiagramView
        accessibleDescription={null}
        accessibleLabel="Diagram"
        frame={null}
        isRendering={false}
        reactId="broken"
        resolvedTheme="light"
        source={source}
        state={{ status: "error", renderedSource: source, message: "Unclosed node label" }}
      />,
    );

    expect(markup).toContain('data-state="error"');
    expect(markup).not.toContain("aria-busy");
    expect(markup).toContain("Unclosed node label");
    expect(markup).toContain("broken[");
    expect(markup).toContain("blog-mermaid-source");
    expect(markup).not.toContain('role="toolbar"');
  });
});
