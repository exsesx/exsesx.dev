import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { getMermaidAccessibleLabel } from "@/lib/mermaid-theme";
import MermaidDiagram, { MermaidDiagramView } from "./MermaidDiagram";

const mermaidDiagramSourceUrl = new URL("./MermaidDiagram.tsx", import.meta.url);
const globalsCssUrl = new URL("../../styles/globals.css", import.meta.url);

describe("MermaidDiagram", () => {
  test("reserves a universal diagram viewport with an inert loading skeleton", async () => {
    const markup = renderToStaticMarkup(<MermaidDiagram source={"sequenceDiagram\n  Browser->>Server: Request"} />);
    const css = await Bun.file(globalsCssUrl).text();

    expect(markup).toContain('data-state="loading"');
    expect(markup).toContain('data-theme="light"');
    expect(markup).toContain('aria-busy="true"');
    expect(markup).toContain('role="img"');
    expect(markup).toContain('class="blog-mermaid-visual blog-mermaid-skeleton"');
    expect(markup).toContain('aria-hidden="true"');
    expect(markup).toContain("Diagram illustrating this section");
    expect(markup).not.toContain("blog-mermaid-source");
    expect(markup).not.toContain("Browser-&gt;&gt;Server");
    expect(markup).not.toContain("blog-mermaid-skeleton-node");
    expect(css).toMatch(/\.blog-mermaid-visual\s*\{[^}]*block-size:\s*clamp\(/s);
    expect(css).toMatch(/\.blog-mermaid-svg\s*\{[^}]*position:\s*relative/s);
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
        accessibleLabel="Agents V2 task hierarchy"
        isRendering={false}
        reactId="diagram"
        resolvedTheme="dark"
        source="flowchart TD"
        state={{ status: "ready", svg: '<svg role="graphics-document"><title>Duplicate title</title></svg>' }}
      />,
    );

    expect(markup).toContain('data-state="ready"');
    expect(markup).toContain('data-theme="dark"');
    expect(markup).toContain('aria-busy="false"');
    expect(markup).toContain('aria-labelledby="diagram-label"');
    expect(markup).toContain('class="blog-mermaid-visual blog-mermaid-svg"');
    expect(markup).toMatch(/class="blog-mermaid-visual blog-mermaid-svg"[^>]*aria-hidden="true"/);
    expect(markup).not.toContain("blog-mermaid-skeleton");
    expect(markup).not.toContain("blog-mermaid-source");
  });

  test("uses an authored Mermaid accessibility title with a safe fallback", () => {
    expect(getMermaidAccessibleLabel("flowchart TD\n  accTitle: Agents V2 task hierarchy")).toBe(
      "Agents V2 task hierarchy",
    );
    expect(getMermaidAccessibleLabel("flowchart TD\n  root --> child")).toBe("Diagram illustrating this section");
  });

  test("keeps the previous SVG while a loaded mono font theme is rendered", async () => {
    const source = await Bun.file(mermaidDiagramSourceUrl).text();

    expect(source).toContain("await document.fonts.load");
    expect(source).toContain("const [isRendering, setIsRendering] = useState(true)");
    expect(source).toContain('const visualState = state.status === "ready" && isRendering ? "updating" : state.status');
    expect(source).toContain("data-state={visualState}");
    expect(source).not.toContain('setState({ status: "loading" });');
  });
});
