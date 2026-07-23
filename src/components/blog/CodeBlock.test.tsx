import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { BlogLocaleProvider } from "./BlogLocaleContext";
import CodeBlock from "./CodeBlock";

describe("CodeBlock", () => {
  test("renders an unwrapped icon toolbar with accessible copy feedback", () => {
    const markup = renderToStaticMarkup(
      <CodeBlock>
        <code>codex features enable multi_agent_v2</code>
      </CodeBlock>,
    );

    expect(markup).toContain('aria-label="Copy code"');
    expect(markup).toContain('aria-label="Code actions"');
    expect(markup).toContain('aria-label="Wrap lines"');
    expect(markup).toContain('aria-pressed="false"');
    expect(markup).toContain('data-slot="tooltip-trigger"');
    expect(markup).toContain('data-wrap="false"');
    expect(markup).not.toContain(">Copy<");
    expect(markup).toContain('role="status"');
    expect(markup).toContain("codex features enable multi_agent_v2");
  });

  test("uses localized accessible labels for Ukrainian articles", () => {
    const markup = renderToStaticMarkup(
      <BlogLocaleProvider locale="uk">
        <CodeBlock>
          <code>codex features list</code>
        </CodeBlock>
      </BlogLocaleProvider>,
    );

    expect(markup).toContain('aria-label="Дії з кодом"');
    expect(markup).toContain('aria-label="Переносити рядки"');
    expect(markup).toContain('aria-label="Копіювати код"');
    expect(markup).toContain('lang="uk"');
  });
});
