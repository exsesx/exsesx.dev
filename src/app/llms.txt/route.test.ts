import { describe, expect, test } from "bun:test";
import { GET } from "./route";

describe("llms.txt", () => {
  test("includes the published Blog index and article", async () => {
    const body = await GET().text();

    expect(body).toContain("## Blog");
    expect(body).toContain("[Blog](https://exsesx.dev/blog/en)");
    expect(body).toContain("[Codex Agents V2 in 0.145.0](https://exsesx.dev/blog/en/codex-agents-v2)");
    expect(body).not.toContain("https://exsesx.dev/blog/uk/codex-agents-v2");
  });
});
