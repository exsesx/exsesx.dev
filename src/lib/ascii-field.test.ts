import { describe, expect, test } from "bun:test";
import { ASCII_GLYPHS, glowFalloff, glyphFor, hashCell, smoothstep } from "./ascii-field";

describe("ascii field helpers", () => {
  test("hashCell is deterministic and stays in [0, 1)", () => {
    for (let cell = 0; cell < 500; cell++) {
      const value = hashCell(cell, 42);
      expect(value).toBe(hashCell(cell, 42));
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  test("glyphFor only returns glyphs from the set and changes with the tick", () => {
    const glyphs = new Set<string>();

    for (let tick = 0; tick < 200; tick++) {
      const glyph = glyphFor(17, tick);
      expect(ASCII_GLYPHS).toContain(glyph);
      glyphs.add(glyph);
    }

    expect(glyphs.size).toBeGreaterThan(10);
  });

  test("glowFalloff peaks at the center and reaches zero at the radius", () => {
    expect(glowFalloff(0, 120)).toBe(1);
    expect(glowFalloff(60, 120)).toBeCloseTo(0.25);
    expect(glowFalloff(120, 120)).toBe(0);
    expect(glowFalloff(500, 120)).toBe(0);
  });

  test("smoothstep clamps outside its edges", () => {
    expect(smoothstep(0, 10, -5)).toBe(0);
    expect(smoothstep(0, 10, 5)).toBe(0.5);
    expect(smoothstep(0, 10, 50)).toBe(1);
  });
});
