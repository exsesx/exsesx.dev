import { describe, expect, test } from "bun:test";
import { resolveIPhoneDisplayProgress } from "./iphone-display-progress";

const IPHONE_USER_AGENT =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1";

function resolveProgress(overrides: Partial<Parameters<typeof resolveIPhoneDisplayProgress>[0]> = {}) {
  return resolveIPhoneDisplayProgress({
    devicePixelRatio: 3,
    screenHeight: 874,
    screenWidth: 402,
    userAgent: IPHONE_USER_AGENT,
    visualViewportHeight: 402,
    visualViewportOffsetLeft: 0,
    visualViewportOffsetTop: 0,
    visualViewportScale: 1,
    visualViewportWidth: 874,
    viewportHeight: 402,
    viewportWidth: 874,
    ...overrides,
  });
}

describe("iPhone display reading progress", () => {
  test("traces a full clockwise landscape frame from left center back to left center", () => {
    const progress = resolveProgress();

    expect(progress?.screenClass).toBe("402x874");
    expect(progress?.cornerExtent).toBeCloseTo(101.37, 2);
    expect(progress?.orientation).toBe("landscape");
    expect(progress?.pathWidth).toBe(874);
    expect(progress?.pathHeight).toBe(402);
    expect(progress?.path).toStartWith("M 0 201 L 0 101.37");
    expect(progress?.path).toContain("L 772.63 0");
    expect(progress?.path).toContain("L 874 300.63");
    expect(progress?.path).toContain("L 101.37 402");
    expect(progress?.path).toEndWith("L 0 300.63 L 0 201");
  });

  test("traces a full clockwise portrait frame from top center back to top center", () => {
    const progress = resolveProgress({
      visualViewportHeight: 874,
      visualViewportWidth: 402,
      viewportHeight: 874,
      viewportWidth: 402,
    });

    expect(progress?.orientation).toBe("portrait");
    expect(progress?.pathWidth).toBe(402);
    expect(progress?.pathHeight).toBe(874);
    expect(progress?.path).toStartWith("M 201 0 L 300.63 0");
    expect(progress?.path).toContain("L 402 772.63");
    expect(progress?.path).toContain("L 101.37 874");
    expect(progress?.path).toContain("L 0 101.37");
    expect(progress?.path).toEndWith("L 101.37 0 L 201 0");
  });

  test("normalizes screen orientation before matching the display", () => {
    expect(resolveProgress({ screenHeight: 402, screenWidth: 874 })?.screenClass).toBe("402x874");
  });

  test("keeps the straight fallback outside recognized iPhone displays", () => {
    expect(resolveProgress({ userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" })).toBeNull();
    expect(resolveProgress({ screenHeight: 900, screenWidth: 400 })).toBeNull();
    expect(resolveProgress({ devicePixelRatio: 2 })).toBeNull();
    expect(resolveProgress({ viewportHeight: 500, viewportWidth: 500 })).toBeNull();
  });

  test("keeps the straight fallback while browser chrome shortens the visible viewport or zooms it", () => {
    expect(resolveProgress({ viewportHeight: 330, visualViewportHeight: 330 })).toBeNull();
    expect(resolveProgress({ visualViewportHeight: 330 })).toBeNull();
    expect(resolveProgress({ visualViewportWidth: 800 })).toBeNull();
    expect(resolveProgress({ visualViewportHeight: 330, visualViewportOffsetTop: 12 })).toBeNull();
    expect(resolveProgress({ visualViewportScale: 1.2 })).toBeNull();
  });

  test("keeps the rounded frame through full-display elastic overscroll", () => {
    expect(resolveProgress({ visualViewportOffsetTop: -24 })?.orientation).toBe("landscape");
    expect(resolveProgress({ visualViewportOffsetTop: 24 })?.orientation).toBe("landscape");
    expect(resolveProgress({ visualViewportOffsetLeft: 12 })?.orientation).toBe("landscape");
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
      expect(
        resolveProgress({
          screenHeight,
          screenWidth,
          visualViewportHeight: screenWidth,
          visualViewportWidth: screenHeight,
          viewportHeight: screenWidth,
          viewportWidth: screenHeight,
        })?.cornerExtent,
      ).toBeCloseTo(cornerExtent, 2);
    }
  });
});
