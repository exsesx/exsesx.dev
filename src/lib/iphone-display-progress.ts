type CornerPoint = readonly [x: number, y: number];

type CornerProfile = "classic" | "island" | "modern";

type DisplaySpec = {
  cornerExtent: number;
  profile: CornerProfile;
};

type IPhoneLandscapeProgressInput = {
  devicePixelRatio: number;
  screenHeight: number;
  screenWidth: number;
  userAgent: string;
  viewportHeight: number;
  viewportWidth: number;
};

export type IPhoneLandscapeProgressPath = {
  cornerExtent: number;
  path: string;
  screenClass: string;
};

// Source: https://developer.apple.com/accessories/dimensional-drawings/
// Normalized from the active-display outlines in Apple's dimensional drawings.
// The browser exposes safe-area insets, but not the physical display corner path.
const CORNER_PROFILES: Record<CornerProfile, readonly CornerPoint[]> = {
  classic: [
    [1, 0],
    [0.8411, 0.00101],
    [0.76178, 0.00329],
    [0.70907, 0.00634],
    [0.63001, 0.01394],
    [0.57805, 0.02179],
    [0.52661, 0.03244],
    [0.47592, 0.04612],
    [0.41967, 0.06564],
    [0.37709, 0.08439],
    [0.33046, 0.10897],
    [0.28611, 0.13735],
    [0.26457, 0.15307],
    [0.22884, 0.18272],
    [0.20502, 0.20552],
    [0.18677, 0.22453],
    [0.15307, 0.26483],
    [0.12291, 0.30765],
    [0.0963, 0.35302],
    [0.08439, 0.37684],
    [0.06361, 0.42549],
    [0.04638, 0.47516],
    [0.03269, 0.5261],
    [0.01774, 0.60416],
    [0.01115, 0.65661],
    [0.00634, 0.70933],
    [0.00329, 0.76204],
    [0.00101, 0.84136],
    [0, 1],
  ],
  island: [
    [1, 0],
    [0.80942, 0.00177],
    [0.69511, 0.00818],
    [0.63675, 0.01437],
    [0.5828, 0.02299],
    [0.52797, 0.03471],
    [0.47623, 0.0493],
    [0.42538, 0.06765],
    [0.3774, 0.0891],
    [0.33142, 0.1143],
    [0.28786, 0.1426],
    [0.24718, 0.17444],
    [0.20915, 0.20915],
    [0.17444, 0.24718],
    [0.1426, 0.28786],
    [0.11408, 0.33142],
    [0.0891, 0.3774],
    [0.06765, 0.42538],
    [0.0493, 0.47623],
    [0.03471, 0.52797],
    [0.02299, 0.5828],
    [0.01437, 0.63675],
    [0.00818, 0.69511],
    [0.00177, 0.80942],
    [0, 1],
  ],
  modern: [
    [1, 0],
    [0.78012, 0.00045],
    [0.65739, 0.00314],
    [0.57606, 0.00897],
    [0.4991, 0.01985],
    [0.42596, 0.03713],
    [0.35697, 0.06181],
    [0.29269, 0.094],
    [0.23357, 0.13371],
    [0.18039, 0.18048],
    [0.13361, 0.23354],
    [0.09401, 0.29265],
    [0.0617, 0.35693],
    [0.03713, 0.42591],
    [0.01974, 0.49916],
    [0.00886, 0.57611],
    [0.00303, 0.65743],
    [0.00034, 0.78015],
    [0, 1],
  ],
};

// CSS-point screen classes and active-display corner extents measured from
// Apple's iPhone 12, 12 Pro Max, 15 Pro, 15 Pro Max, 16 Pro, 16 Pro Max,
// iPhone Air, 17 Pro, and 17 Pro Max dimensional drawings.
const DISPLAY_SPECS: Record<string, DisplaySpec> = {
  "360x780": { cornerExtent: 60.94, profile: "classic" },
  "390x844": { cornerExtent: 67.47, profile: "classic" },
  "428x926": { cornerExtent: 75.16, profile: "classic" },
  "393x852": { cornerExtent: 77.16, profile: "island" },
  "430x932": { cornerExtent: 77.15, profile: "island" },
  "402x874": { cornerExtent: 101.37, profile: "modern" },
  "420x912": { cornerExtent: 101.39, profile: "modern" },
  "440x956": { cornerExtent: 101.87, profile: "modern" },
};

function formatCoordinate(value: number) {
  return Number(value.toFixed(2)).toString();
}

function buildFramePath(viewportWidth: number, cornerExtent: number, profile: readonly CornerPoint[]) {
  const leftCorner = profile.map(([x, y]) => [x * cornerExtent, y * cornerExtent] as const).reverse();
  const rightCorner = profile.map(([x, y]) => [viewportWidth - x * cornerExtent, y * cornerExtent] as const);
  const points = [...leftCorner, [viewportWidth - cornerExtent, 0] as const, ...rightCorner.slice(1)];

  return points
    .map(([x, y], index) => `${index === 0 ? "M" : "L"} ${formatCoordinate(x)} ${formatCoordinate(y)}`)
    .join(" ");
}

export function resolveIPhoneLandscapeProgress({
  devicePixelRatio,
  screenHeight,
  screenWidth,
  userAgent,
  viewportHeight,
  viewportWidth,
}: IPhoneLandscapeProgressInput): IPhoneLandscapeProgressPath | null {
  if (!/\biPhone\b/.test(userAgent) || Math.round(devicePixelRatio) !== 3 || viewportWidth <= viewportHeight) {
    return null;
  }

  const screenClass = `${Math.round(Math.min(screenWidth, screenHeight))}x${Math.round(
    Math.max(screenWidth, screenHeight),
  )}`;
  const displaySpec = DISPLAY_SPECS[screenClass];

  if (!displaySpec) {
    return null;
  }

  return {
    cornerExtent: displaySpec.cornerExtent,
    path: buildFramePath(viewportWidth, displaySpec.cornerExtent, CORNER_PROFILES[displaySpec.profile]),
    screenClass,
  };
}
