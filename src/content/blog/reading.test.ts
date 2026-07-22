import { describe, expect, test } from "bun:test";
import { analyzeMdxSource } from "./reading";

describe("MDX reading analysis", () => {
  test("derives reading time from prose without counting fenced code", () => {
    const prose = Array.from({ length: 226 }, (_, index) => `word${index}`).join(" ");
    const code = Array.from({ length: 900 }, (_, index) => `symbol${index}`).join(" ");
    const source = `${prose}\n\n\`\`\`ts\n${code}\n\`\`\``;

    expect(analyzeMdxSource(source).readingMinutes).toBe(2);
  });

  test("extracts a stable h2/h3 table of contents and ignores code examples", () => {
    const source = [
      "## What changed",
      "### Model routing",
      "```md",
      "## Not a real heading",
      "```",
      "## What changed",
    ].join("\n");

    expect(analyzeMdxSource(source).headings).toEqual([
      { depth: 2, id: "what-changed", text: "What changed" },
      { depth: 3, id: "model-routing", text: "Model routing" },
      { depth: 2, id: "what-changed-1", text: "What changed" },
    ]);
  });
});
