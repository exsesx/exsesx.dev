import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { getMermaidAccessibleLabel } from "@/lib/mermaid-theme";
import MermaidDiagram from "./MermaidDiagram";

const mermaidDiagramSourceUrl = new URL("./MermaidDiagram.tsx", import.meta.url);

describe("MermaidDiagram", () => {
  test("exposes a stable themed loading state before the client SVG is ready", () => {
    const markup = renderToStaticMarkup(
      <MermaidDiagram source={'flowchart TD\n  accTitle: Agents V2 task hierarchy\n  root["/root"]'} />,
    );

    expect(markup).toContain('data-state="loading"');
    expect(markup).toContain('data-theme="light"');
    expect(markup).toContain('aria-busy="true"');
    expect(markup).toContain("Agents V2 task hierarchy");
    expect(markup).toContain("/root");
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
    expect(source).toContain('data-state={isRendering ? "updating" : "ready"}');
    expect(source).not.toContain('setState({ status: "loading" });');
  });
});
