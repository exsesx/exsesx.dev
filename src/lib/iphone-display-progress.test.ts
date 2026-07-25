import { describe, expect, test } from "bun:test";
import { resolveIPhoneLandscapeProgress } from "./iphone-display-progress";

const IPHONE_USER_AGENT =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1";

function resolveProgress(overrides: Partial<Parameters<typeof resolveIPhoneLandscapeProgress>[0]> = {}) {
  return resolveIPhoneLandscapeProgress({
    devicePixelRatio: 3,
    screenHeight: 874,
    screenWidth: 402,
    userAgent: IPHONE_USER_AGENT,
    viewportHeight: 402,
    viewportWidth: 956,
    ...overrides,
  });
}

describe("iPhone landscape reading progress", () => {
  test("builds the measured frame path for a recognized iPhone screen class", () => {
    const progress = resolveProgress();

    expect(progress?.screenClass).toBe("402x874");
    expect(progress?.cornerExtent).toBeCloseTo(101.37, 2);
    expect(progress?.path).toStartWith("M 0 101.37");
    expect(progress?.path).toContain("L 854.63 0");
    expect(progress?.path).toEndWith("L 956 101.37");
  });

  test("normalizes screen orientation before matching the display", () => {
    expect(resolveProgress({ screenHeight: 402, screenWidth: 874 })?.screenClass).toBe("402x874");
  });

  test("keeps the straight fallback outside recognized iPhone landscape displays", () => {
    expect(resolveProgress({ viewportHeight: 874, viewportWidth: 402 })).toBeNull();
    expect(resolveProgress({ userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" })).toBeNull();
    expect(resolveProgress({ screenHeight: 900, screenWidth: 400 })).toBeNull();
    expect(resolveProgress({ devicePixelRatio: 2 })).toBeNull();
  });

  test("covers the measured classic, Dynamic Island, and modern display families", () => {
    const screenClasses = [
      [360, 780, 60.94],
      [390, 844, 67.47],
      [428, 926, 75.16],
      [393, 852, 77.16],
      [430, 932, 77.15],
      [402, 874, 101.37],
      [420, 912, 101.39],
      [440, 956, 101.87],
    ] as const;

    for (const [screenWidth, screenHeight, cornerExtent] of screenClasses) {
      expect(resolveProgress({ screenHeight, screenWidth })?.cornerExtent).toBeCloseTo(cornerExtent, 2);
    }
  });
});
