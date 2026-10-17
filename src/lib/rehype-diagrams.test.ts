import { describe, expect, test } from "bun:test";
import type { Element, Root } from "hast";
import rehypeDiagrams from "./rehype-diagrams.mts";

function codeBlock(language: string, source: string): Element {
  return {
    type: "element",
    tagName: "pre",
    properties: {},
    children: [
      {
        type: "element",
        tagName: "code",
        properties: { className: [`language-${language}`] },
        children: [{ type: "text", value: source }],
      },
    ],
  };
}

describe("MDX diagram blocks", () => {
  test("preserves Mermaid source as text outside the code highlighter", () => {
    const source = 'flowchart TD\n  start["Початок<br/>A & B"] --> end["Кінець"]\n';
    const diagram = codeBlock("mermaid", source);
    const code = codeBlock("typescript", "const answer = 42;\n");
    const originalCode = structuredClone(code);
    const tree: Root = { type: "root", children: [diagram, code] };

    rehypeDiagrams()(tree);

    expect(diagram.properties.className).toEqual(["mermaid"]);
    expect(diagram.children).toEqual([{ type: "text", value: source }]);
    expect(code).toEqual(originalCode);
  });

  test("finds diagrams nested inside article markup", () => {
    const diagram = codeBlock("mermaid", "flowchart LR\n  A --> B\n");
    const tree: Root = {
      type: "root",
      children: [{ type: "element", tagName: "section", properties: {}, children: [diagram] }],
    };

    rehypeDiagrams()(tree);

    expect(diagram.properties.className).toEqual(["mermaid"]);
    expect(diagram.children[0]).toMatchObject({ type: "text", value: "flowchart LR\n  A --> B\n" });
  });
});
