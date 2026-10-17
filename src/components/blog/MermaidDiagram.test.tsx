import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { getMermaidAccessibleDescription, getMermaidAccessibleLabel } from "@/lib/mermaid-theme";
import MermaidDiagram, { MermaidDiagramView } from "./MermaidDiagram";

const globalsCssUrl = new URL("../../styles/globals.css", import.meta.url);

describe("MermaidDiagram", () => {
  test("reserves a universal diagram viewport with an inert loading skeleton", async () => {
    const markup = renderToStaticMarkup(<MermaidDiagram source={"flowchart TD\n  Browser --> Server"} />);
    const css = await Bun.file(globalsCssUrl).text();

    expect(markup).toContain('data-state="loading"');
    expect(markup).toContain('data-theme="light"');
    expect(markup).toContain('aria-busy="true"');
    expect(markup).not.toContain('role="img"');
    expect(markup).toContain('class="blog-mermaid-visual blog-mermaid-skeleton"');
    expect(markup).toContain('aria-hidden="true"');
    expect(markup).toContain("Diagram illustrating this section");
    expect(markup).not.toContain("blog-mermaid-source");
    expect(markup).not.toContain("Browser-&gt;&gt;Server");
    expect(markup).not.toContain("blog-mermaid-skeleton-node");
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

  test("hands the reserved visual over to one labelled ready-state image", () => {
    const markup = renderToStaticMarkup(
      <MermaidDiagramView
        accessibleDescription="A root agent delegates work."
        accessibleLabel="Agents V2 task hierarchy"
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
    expect(markup).toContain('aria-busy="false"');
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
    expect(markup).toContain('aria-hidden="true" focusable="false"');
    expect(markup).toContain("A root agent delegates work.");
    expect(markup).not.toContain("blog-mermaid-skeleton");
    expect(markup).not.toContain("blog-mermaid-source");
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
        isRendering={false}
        reactId="broken"
        resolvedTheme="light"
        source={source}
        state={{ status: "error", renderedSource: source, message: "Unclosed node label" }}
      />,
    );

    expect(markup).toContain('data-state="error"');
    expect(markup).toContain('aria-busy="false"');
    expect(markup).toContain("Unclosed node label");
    expect(markup).toContain("broken[");
    expect(markup).toContain("blog-mermaid-source");
    expect(markup).not.toContain('role="toolbar"');
  });
});
