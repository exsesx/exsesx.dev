import { afterEach, describe, expect, test } from "bun:test";
import { triggerHaptic } from "./haptics";

const originalNavigator = globalThis.navigator;

function setNavigator(value: Partial<Navigator> | undefined) {
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value,
  });
}

describe("triggerHaptic", () => {
  afterEach(() => {
    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: originalNavigator,
    });
  });

  test("vibrates with a light tap pattern on touch devices", () => {
    const calls: VibratePattern[] = [];

    setNavigator({
      maxTouchPoints: 1,
      vibrate(pattern: VibratePattern | Iterable<number>) {
        calls.push(pattern as VibratePattern);
        return true;
      },
    });

    expect(triggerHaptic("tap")).toBe(true);
    expect(calls).toEqual([8]);
  });

  test("uses a slightly stronger pattern for successful actions", () => {
    const calls: VibratePattern[] = [];

    setNavigator({
      maxTouchPoints: 1,
      vibrate(pattern: VibratePattern | Iterable<number>) {
        calls.push(pattern as VibratePattern);
        return true;
      },
    });

    expect(triggerHaptic("success")).toBe(true);
    expect(calls).toEqual([[8, 24, 12]]);
  });

  test("does nothing when haptics are disabled", () => {
    const calls: VibratePattern[] = [];

    setNavigator({
      maxTouchPoints: 1,
      vibrate(pattern: VibratePattern | Iterable<number>) {
        calls.push(pattern as VibratePattern);
        return true;
      },
    });

    expect(triggerHaptic("tap", { enabled: false })).toBe(false);
    expect(calls).toEqual([]);
  });

  test("does nothing when vibration support is missing", () => {
    setNavigator({ maxTouchPoints: 1 });

    expect(triggerHaptic("tap")).toBe(false);
  });

  test("does nothing on non-touch devices", () => {
    const calls: VibratePattern[] = [];

    setNavigator({
      maxTouchPoints: 0,
      vibrate(pattern: VibratePattern | Iterable<number>) {
        calls.push(pattern as VibratePattern);
        return true;
      },
    });

    expect(triggerHaptic("tap")).toBe(false);
    expect(calls).toEqual([]);
  });

  test("is SSR-safe when navigator is undefined", () => {
    setNavigator(undefined);

    expect(triggerHaptic("tap")).toBe(false);
  });
});
