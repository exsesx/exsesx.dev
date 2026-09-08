import { describe, expect, test } from "bun:test";
import { getRoutePathname } from "./route-path";

describe("route pathnames", () => {
  test.each([
    ["/projects", "/projects"],
    ["/projects?filter=ai#selected", "/projects"],
    ["/blog/uk/codex-agents-v2#overview", "/blog/uk/codex-agents-v2"],
    ["https://exsesx.dev/blog/en?from=nav", "/blog/en"],
    ["project/quicklizard", "/project/quicklizard"],
    ["", "/"],
    ["http://[invalid]?from=nav#selected", "http://[invalid]"],
  ])("extracts %s without changing route normalization", (input, pathname) => {
    expect(getRoutePathname(input)).toBe(pathname);
  });
});
