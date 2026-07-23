export type ViewBox = Readonly<{
  x: number;
  y: number;
  width: number;
  height: number;
}>;

export type Point = Readonly<{
  x: number;
  y: number;
}>;

export type Viewport = Readonly<{
  left: number;
  top: number;
  width: number;
  height: number;
}>;

export type NudgeDirection = "up" | "right" | "down" | "left";

type ZoomViewBoxOptions = Readonly<{
  base: ViewBox;
  current: ViewBox;
  zoom: number;
  clientPoint: Point;
  viewport: Viewport;
}>;

export const MIN_MERMAID_ZOOM = 1;
export const MAX_MERMAID_ZOOM = 4;
export const MERMAID_NUDGE_FRACTION = 0.12;

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

function getClientPointRatios(viewBox: ViewBox, clientPoint: Point, viewport: Viewport): Point {
  const scale = Math.min(viewport.width / viewBox.width, viewport.height / viewBox.height);
  const renderedWidth = viewBox.width * scale;
  const renderedHeight = viewBox.height * scale;
  const renderedLeft = viewport.left + (viewport.width - renderedWidth) / 2;
  const renderedTop = viewport.top + (viewport.height - renderedHeight) / 2;

  return {
    x: clamp((clientPoint.x - renderedLeft) / renderedWidth, 0, 1),
    y: clamp((clientPoint.y - renderedTop) / renderedHeight, 0, 1),
  };
}

export function parseViewBox(value: string): ViewBox | null {
  const parts = value
    .trim()
    .split(/[\s,]+/)
    .map(Number);

  if (parts.length !== 4) {
    return null;
  }

  const [x, y, width, height] = parts;

  if (x === undefined || y === undefined || width === undefined || height === undefined) {
    return null;
  }

  if (![x, y, width, height].every(Number.isFinite) || width <= 0 || height <= 0) {
    return null;
  }

  return { x, y, width, height };
}

export function formatViewBox({ x, y, width, height }: ViewBox): string {
  return `${x} ${y} ${width} ${height}`;
}

export function getViewBoxZoom(base: ViewBox, current: ViewBox): number {
  return clamp(base.width / current.width, MIN_MERMAID_ZOOM, MAX_MERMAID_ZOOM);
}

export function panViewBox(base: ViewBox, current: ViewBox, delta: Point): ViewBox {
  return {
    ...current,
    x: clamp(current.x + delta.x, base.x, base.x + base.width - current.width),
    y: clamp(current.y + delta.y, base.y, base.y + base.height - current.height),
  };
}

export function nudgeViewBox(base: ViewBox, current: ViewBox, direction: NudgeDirection): ViewBox {
  const horizontalDistance = current.width * MERMAID_NUDGE_FRACTION;
  const verticalDistance = current.height * MERMAID_NUDGE_FRACTION;
  const deltas: Record<NudgeDirection, Point> = {
    up: { x: 0, y: -verticalDistance },
    right: { x: horizontalDistance, y: 0 },
    down: { x: 0, y: verticalDistance },
    left: { x: -horizontalDistance, y: 0 },
  };

  return panViewBox(base, current, deltas[direction]);
}

export function zoomViewBoxAtClientPoint({ base, current, zoom, clientPoint, viewport }: ZoomViewBoxOptions): ViewBox {
  const { x: ratioX, y: ratioY } = getClientPointRatios(current, clientPoint, viewport);
  const focalX = current.x + current.width * ratioX;
  const focalY = current.y + current.height * ratioY;
  const clampedZoom = clamp(zoom, MIN_MERMAID_ZOOM, MAX_MERMAID_ZOOM);
  const width = base.width / clampedZoom;
  const height = base.height / clampedZoom;

  return {
    x: clamp(focalX - width * ratioX, base.x, base.x + base.width - width),
    y: clamp(focalY - height * ratioY, base.y, base.y + base.height - height),
    width,
    height,
  };
}
