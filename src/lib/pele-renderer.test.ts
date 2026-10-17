import { describe, expect, test } from "bun:test";
import { getMermaidAccessibleDescription, getMermaidAccessibleLabel } from "./mermaid-theme";
import { renderPeleDiagram } from "./pele-renderer";

const contentRoot = new URL("../content/blog/", import.meta.url).pathname;
const diagrams: { path: string; source: string }[] = [];

for await (const path of new Bun.Glob("**/*.mdx").scan(contentRoot)) {
  const content = await Bun.file(`${contentRoot}${path}`).text();

  for (const block of content.matchAll(/^```mermaid\n([\s\S]*?)^```/gm)) {
    diagrams.push({ path, source: block[1]?.trim() ?? "" });
  }
}

function renderDiagram(source: string, maxWidth = 800, idPrefix = "test") {
  return renderPeleDiagram(source, { idPrefix, maxWidth });
}

describe("Pele flowchart renderer", () => {
  test("covers the six authored English and Ukrainian diagrams", () => {
    expect(diagrams).toHaveLength(6);
  });

  for (const { path, source } of diagrams) {
    test(`renders ${path} at desktop and mobile widths`, () => {
      for (const width of [320, 900]) {
        const svg = renderDiagram(source, width);
        const viewBox = /viewBox="([^"]+)"/.exec(svg)?.[1]?.split(" ").map(Number);

        expect(viewBox).toHaveLength(4);
        expect(viewBox?.every(Number.isFinite)).toBe(true);
        expect(viewBox?.[2]).toBeGreaterThan(0);
        expect(viewBox?.[3]).toBeGreaterThan(0);
        expect(viewBox?.[2]).toBeLessThan(4000);
        expect(viewBox?.[3]).toBeLessThan(4000);
        expect(svg).toContain(getMermaidAccessibleLabel(source));
        expect(svg).toContain(getMermaidAccessibleDescription(source) ?? "");
        expect(svg).toContain('aria-hidden="true" focusable="false"');
        expect(svg).not.toContain("<foreignObject");
        expect(svg).not.toMatch(/NaN|Infinity/);

        for (const node of source.matchAll(/\b([A-Za-z][\w]*)\s*(?:\["|\{")/g)) {
          expect(svg).toContain(`data-id="${node[1]}"`);
        }
      }
    });
  }

  test("preserves focus styling, multiline labels and unique accessibility IDs", () => {
    const source =
      'flowchart TD\n accTitle: Pipeline\n A["First phase<br/>Second phase"] --> B["Done"]\n class A focus';
    const first = renderDiagram(source, 800, "first");
    const second = renderDiagram(source, 800, "second");

    expect(first).toContain('class="pele-node pele-shape-rect focus"');
    expect(first).toContain("First phase");
    expect(first).toContain("Second phase");
    expect(first).toContain("<tspan");
    expect(first).toContain('id="first-title"');
    expect(second).toContain('id="second-title"');
    expect(second).not.toContain('id="first-title"');
  });

  test("adapts a wide left-to-right diagram to a narrow container", () => {
    const source = diagrams.find(diagram => diagram.path === "safari-26-invisible-tint-sampler/en.mdx")?.source;

    expect(source).toBeDefined();

    const desktop = renderDiagram(source ?? "", 900);
    const mobile = renderDiagram(source ?? "", 320);
    const widthOf = (svg: string) => Number(/viewBox="0 0 ([\d.]+)/.exec(svg)?.[1]);

    expect(widthOf(mobile)).toBeLessThan(widthOf(desktop));
  });

  test("lets the fixed camera viewport control the SVG dimensions", () => {
    const svg = renderDiagram("flowchart TD\n A --> B --> C --> D", 320);
    const rootElement = svg.slice(0, svg.indexOf(">") + 1);

    expect(rootElement).toContain('viewBox="');
    expect(rootElement).not.toContain("height:auto");
    expect(rootElement).not.toContain("max-width:100%");
  });

  test("rejects malformed input so the component can show its source fallback", () => {
    expect(() => renderDiagram('flowchart TD\n A["unfinished')).toThrow();
    expect(() => renderDiagram("sequenceDiagram\n A->>B: unsupported")).toThrow();
  });

  test("escapes authored markup and disables interactive links", () => {
    const svg = renderDiagram('flowchart TD\n A["<script>alert(1)</script>"]\n click A "https://example.com"');

    expect(svg).not.toContain("<script>");
    expect(svg).not.toContain("<a ");
    expect(svg).not.toContain("onclick=");
  });
});
