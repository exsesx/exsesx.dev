import { describe, expect, test } from "bun:test";
import { NAV_CONDENSE_AFTER, NAV_EXPAND_BELOW, resolveNavCondensed } from "./nav-condense";

describe("resolveNavCondensed", () => {
  test("stays expanded until scrolling past the condense threshold", () => {
    expect(resolveNavCondensed(0, false)).toBe(false);
    expect(resolveNavCondensed(NAV_CONDENSE_AFTER, false)).toBe(false);
    expect(resolveNavCondensed(NAV_CONDENSE_AFTER + 1, false)).toBe(true);
  });

  test("stays condensed until returning near the top (hysteresis)", () => {
    expect(resolveNavCondensed(NAV_CONDENSE_AFTER, true)).toBe(true);
    expect(resolveNavCondensed(NAV_EXPAND_BELOW + 1, true)).toBe(true);
    expect(resolveNavCondensed(NAV_EXPAND_BELOW, true)).toBe(false);
  });
});
