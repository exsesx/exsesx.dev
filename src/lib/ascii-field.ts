/*
 * Pure helpers for the homepage ASCII field. Glyphs come from a deterministic
 * integer hash of (cell, tick) instead of Math.random, so a cell keeps its
 * character between frames and only changes when its own tick advances.
 */

export const ASCII_GLYPHS = "01<>/\\{}[]()=+-*:;._#$%&@~^|";

export function hashCell(cell: number, salt: number): number {
  let value = Math.imul(0x9e3779b9 ^ cell, 0x85ebca6b) ^ Math.imul((salt + 0x632be5ab) | 0, 0xc2b2ae35);
  value ^= value >>> 13;
  value = Math.imul(value, 0x27d4eb2f);
  value ^= value >>> 16;
  return (value >>> 0) / 0x100000000;
}

export function glyphIndexFor(cell: number, tick: number): number {
  return Math.floor(hashCell(cell, tick) * ASCII_GLYPHS.length);
}

export function glyphFor(cell: number, tick: number): string {
  return ASCII_GLYPHS[glyphIndexFor(cell, tick)];
}

/* Quadratic falloff: 1 at the center, 0 at (and beyond) the radius. */
export function glowFalloff(distance: number, radius: number): number {
  if (distance >= radius) {
    return 0;
  }

  const t = 1 - distance / radius;
  return t * t;
}

export function smoothstep(edge0: number, edge1: number, value: number): number {
  const t = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}
