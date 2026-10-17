import type { Element, Root } from "hast";

export default function rehypeDiagrams() {
  function transform(node: Element | Root) {
    if (node.type === "element" && node.tagName === "pre" && node.children.length === 1) {
      const code = node.children[0];

      if (
        code?.type === "element" &&
        code.tagName === "code" &&
        Array.isArray(code.properties.className) &&
        code.properties.className.includes("language-mermaid")
      ) {
        node.properties.className = ["mermaid"];
        node.children = code.children;

        return;
      }
    }

    for (const child of node.children) {
      if ("children" in child) {
        transform(child);
      }
    }
  }

  return transform;
}
