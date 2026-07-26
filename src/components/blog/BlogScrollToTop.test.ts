import { describe, expect, test } from "bun:test";
import { resolveBlogScrollTopState } from "./BlogScrollToTop";

describe("Blog scroll-to-top visibility", () => {
  test("reveals after one viewport of scrolling", () => {
    expect(
      resolveBlogScrollTopState({
        currentState: "hidden",
        scrollY: 843,
        viewportHeight: 844,
      }),
    ).toBe("hidden");
    expect(
      resolveBlogScrollTopState({
        currentState: "hidden",
        scrollY: 844,
        viewportHeight: 844,
      }),
    ).toBe("visible");
  });

  test("stays visible until the reader returns to the top quarter-viewport", () => {
    expect(
      resolveBlogScrollTopState({
        currentState: "visible",
        scrollY: 212,
        viewportHeight: 844,
      }),
    ).toBe("visible");
    expect(
      resolveBlogScrollTopState({
        currentState: "visible",
        scrollY: 211,
        viewportHeight: 844,
      }),
    ).toBe("hidden");
  });

  test("recomputes both thresholds when the viewport height changes", () => {
    expect(
      resolveBlogScrollTopState({
        currentState: "hidden",
        scrollY: 900,
        viewportHeight: 800,
      }),
    ).toBe("visible");
    expect(
      resolveBlogScrollTopState({
        currentState: "visible",
        scrollY: 400,
        viewportHeight: 2000,
      }),
    ).toBe("hidden");
  });
});
