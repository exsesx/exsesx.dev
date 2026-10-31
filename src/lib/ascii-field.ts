/*
 * Pure helpers for the homepage ASCII field. Glyphs come from a deterministic
 * integer hash of (cell, tick) instead of Math.random, so a cell keeps its
 * character between frames and only changes when its own tick advances.
 */

export const ASCII_GLYPHS = "01<>/\\{}[]()=+-*:;._#$%&@~^|";

/* Glyphs ordered by ink coverage, lightest first, so a continuous intensity
   (a wave crest, a glow) reads as density the way ASCII art shades. */
export const DENSITY_RAMP = ".:-=+*%#@";

/* Picks the glyph that draws a trace through a cell from its slope on screen
   (dy/dx, y pointing down): flat runs, rising and falling strokes, and the
   near-vertical walls of a spike. */
export function traceGlyphFor(slope: number): string {
  const steepness = Math.abs(slope);

  if (steepness < 0.35) {
    return "-";
  }

  if (steepness > 2.2) {
    return "|";
  }

  return slope < 0 ? "/" : "\\";
}

/*
 * The height of a splash at a point `behind` the wave front (positive inside
 * the ring, negative still ahead of it): a short wave packet whose crests fade
 * toward the center, like rings on water. `wavelength`, `decay` (how fast the
 * rings fade behind the front) and `packet` (where they stop) share one unit.
 */
export function rippleProfile(behind: number, wavelength: number, decay: number, packet: number): number {
  if (behind > packet || behind < -wavelength / 2) {
    return 0;
  }

  const envelope = behind < 0 ? Math.exp(-((behind / (wavelength / 4)) ** 2)) : Math.exp(-behind / decay);

  return envelope * Math.cos((behind / wavelength) * Math.PI * 2);
}

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

/*
 * One heartbeat in the shape of the headline's PulseTrace (P wave, QRS, T
 * wave), as [position across the beat, height] pairs. Height 1 is the R peak;
 * negative heights dip below the baseline.
 */
const ECG_BEAT: ReadonlyArray<readonly [number, number]> = [
  [0, 0],
  [0.064, 0.13],
  [0.131, 0],
  [0.246, 0],
  [0.311, -0.15],
  [0.41, 1],
  [0.508, -0.19],
  [0.574, 0.31],
  [0.639, 0],
  [0.82, 0],
  [0.91, 0.17],
  [1, 0],
];

/* Height of the beat at `position` (0 to 1 across the beat), flat outside it. */
export function ecgHeight(position: number): number {
  if (position <= 0 || position >= 1) {
    return 0;
  }

  for (let index = 1; index < ECG_BEAT.length; index++) {
    const [endX, endY] = ECG_BEAT[index];

    if (position <= endX) {
      const [startX, startY] = ECG_BEAT[index - 1];
      return startY + ((position - startX) / (endX - startX)) * (endY - startY);
    }
  }

  return 0;
}

/*
 * Backing-store scale for a canvas: the device ratio, capped at `maxRatio`
 * and lowered further so width x height x ratio² stays within `maxPixels`.
 * Never drops below 1 unless the device itself is below 1.
 */
export function fieldPixelRatio(
  deviceRatio: number,
  cssWidth: number,
  cssHeight: number,
  maxRatio: number,
  maxPixels: number,
): number {
  const budgetRatio = Math.sqrt(maxPixels / Math.max(1, cssWidth * cssHeight));

  return Math.max(Math.min(1, deviceRatio), Math.min(maxRatio, deviceRatio, budgetRatio));
}
