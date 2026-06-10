/*
 * SVG displacement filter that bends the backdrop at the edges of a glass
 * surface, like the rim of a convex lens — the missing piece between
 * "frosted blur" and Apple's Liquid Glass.
 *
 * The displacement map is a tiny inline SVG: red ramps 0→255 left-to-right
 * (X displacement), green ramps 0→255 top-to-bottom (Y displacement), and a
 * blurred neutral-gray plate (#808000 = zero displacement in both channels)
 * covers the middle so only a ring near the border refracts.
 *
 * Referenced from CSS as backdrop-filter: url(#liquid-lens). Only Chromium
 * renders SVG references inside backdrop-filter, so usage is gated behind the
 * html.glass-lens class set by the bootstrap script in layout.tsx.
 */

const DISPLACEMENT_MAP = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="128">
  <defs>
    <linearGradient id="x" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#000000"/>
      <stop offset="1" stop-color="#ff0000"/>
    </linearGradient>
    <linearGradient id="y" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#000000"/>
      <stop offset="1" stop-color="#00ff00"/>
    </linearGradient>
    <filter id="soften" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="10"/>
    </filter>
  </defs>
  <rect width="480" height="128" fill="url(#x)"/>
  <rect width="480" height="128" fill="url(#y)" style="mix-blend-mode:screen"/>
  <rect x="16" y="16" width="448" height="96" rx="48" fill="#808000" filter="url(#soften)"/>
</svg>`;

const displacementMapUri = `data:image/svg+xml;utf8,${encodeURIComponent(DISPLACEMENT_MAP)}`;

export default function LiquidGlassLens() {
  return (
    <svg aria-hidden="true" focusable="false" width="0" height="0" style={{ position: "absolute" }}>
      <filter
        id="liquid-lens"
        x="0%"
        y="0%"
        width="100%"
        height="100%"
        colorInterpolationFilters="sRGB"
        primitiveUnits="objectBoundingBox"
      >
        <feImage href={displacementMapUri} x="0" y="0" width="1" height="1" preserveAspectRatio="none" result="map" />
        <feDisplacementMap in="SourceGraphic" in2="map" scale="0.024" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>
  );
}
