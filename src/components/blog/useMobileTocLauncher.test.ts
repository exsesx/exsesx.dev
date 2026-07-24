import { describe, expect, test } from "bun:test";
import { resolveMobileTocLauncherState } from "./useMobileTocLauncher";

describe("mobile table of contents launcher", () => {
  test("stays inline until its source position has left the viewport", () => {
    expect(
      resolveMobileTocLauncherState({
        articleBottom: 1800,
        isCompactLayout: true,
        launcherBottom: 1,
        viewportHeight: 844,
      }),
    ).toBe("inline");
  });

  test("docks after the inline launcher passes while article content remains", () => {
    expect(
      resolveMobileTocLauncherState({
        articleBottom: 1200,
        isCompactLayout: true,
        launcherBottom: 0,
        viewportHeight: 844,
      }),
    ).toBe("docked");
  });

  test("withdraws before the article body yields to the footer", () => {
    expect(
      resolveMobileTocLauncherState({
        articleBottom: 764,
        isCompactLayout: true,
        launcherBottom: -44,
        viewportHeight: 844,
      }),
    ).toBe("hidden");
  });

  test("never docks while the desktop article layout is available", () => {
    expect(
      resolveMobileTocLauncherState({
        articleBottom: 1200,
        isCompactLayout: false,
        launcherBottom: -44,
        viewportHeight: 844,
      }),
    ).toBe("inline");
  });
});
