import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import SourceLink from "./SourceLink";

describe("SourceLink", () => {
  test("renders a descriptive external citation with a local host icon", () => {
    const markup = renderToStaticMarkup(
      <SourceLink href="https://github.com/openai/codex/releases/tag/rust-v0.145.0">Codex 0.145.0</SourceLink>,
    );

    expect(markup).toContain('href="https://github.com/openai/codex/releases/tag/rust-v0.145.0"');
    expect(markup).toContain("github.com");
    expect(markup).toContain("Codex 0.145.0");
    expect(markup).toContain("opens in a new tab");
    expect(markup).toContain("source-link-icon");
  });
});
