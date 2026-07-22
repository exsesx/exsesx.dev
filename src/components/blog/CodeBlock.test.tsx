import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import CodeBlock from "./CodeBlock";

describe("CodeBlock", () => {
  test("exposes copy feedback through a polite status without changing the initial label", () => {
    const markup = renderToStaticMarkup(
      <CodeBlock>
        <code>codex features enable multi_agent_v2</code>
      </CodeBlock>,
    );

    expect(markup).toContain('aria-label="Copy code"');
    expect(markup).toContain('role="status"');
    expect(markup).toContain("codex features enable multi_agent_v2");
  });
});
