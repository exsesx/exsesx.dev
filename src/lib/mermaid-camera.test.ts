import { describe, expect, test } from "bun:test";
import {
  formatViewBox,
  getViewBoxZoom,
  nudgeViewBox,
  panViewBox,
  parseViewBox,
  zoomViewBoxAtClientPoint,
} from "./mermaid-camera";

describe("Mermaid viewBox camera", () => {
  test("parses comma and whitespace separated SVG viewBox values", () => {
    expect(parseViewBox(" 10, 20  300,150 ")).toEqual({
      x: 10,
      y: 20,
      width: 300,
      height: 150,
    });
  });

  test("formats a viewBox for the SVG attribute", () => {
    expect(formatViewBox({ x: -12.5, y: 4, width: 320, height: 180 })).toBe("-12.5 4 320 180");
  });

  test("rejects a viewBox with non-finite coordinates", () => {
    expect(parseViewBox("0 0 nope 100")).toBeNull();
  });

  test("rejects a viewBox without a drawable area", () => {
    expect(parseViewBox("0 0 0 100")).toBeNull();
  });

  test("zooms around the SVG point beneath a client-space focal point", () => {
    expect(
      zoomViewBoxAtClientPoint({
        base: { x: 100, y: 50, width: 800, height: 400 },
        current: { x: 100, y: 50, width: 800, height: 400 },
        zoom: 2,
        clientPoint: { x: 120, y: 60 },
        viewport: { left: 20, top: 10, width: 400, height: 200 },
      }),
    ).toEqual({ x: 200, y: 100, width: 400, height: 200 });
  });

  test("maps and clamps focal points through a portrait SVG's letterboxed client rect", () => {
    const base = { x: 0, y: 0, width: 400, height: 800 };
    const viewport = { left: 0, top: 0, width: 800, height: 400 };

    expect({
      content: zoomViewBoxAtClientPoint({
        base,
        current: base,
        zoom: 2,
        clientPoint: { x: 350, y: 100 },
        viewport,
      }),
      gutter: zoomViewBoxAtClientPoint({
        base,
        current: base,
        zoom: 2,
        clientPoint: { x: 100, y: 100 },
        viewport,
      }),
    }).toEqual({
      content: { x: 50, y: 100, width: 200, height: 400 },
      gutter: { x: 0, y: 100, width: 200, height: 400 },
    });
  });

  test("clamps zoom between 100 and 400 percent", () => {
    const base = { x: 0, y: 0, width: 800, height: 400 };
    const viewport = { left: 0, top: 0, width: 400, height: 200 };
    const clientPoint = { x: 200, y: 100 };

    expect({
      minimum: zoomViewBoxAtClientPoint({ base, current: base, zoom: 0.25, clientPoint, viewport }),
      maximum: zoomViewBoxAtClientPoint({ base, current: base, zoom: 10, clientPoint, viewport }),
    }).toEqual({
      minimum: base,
      maximum: { x: 300, y: 150, width: 200, height: 100 },
    });
  });

  test("keeps a zoomed view inside the base viewBox", () => {
    expect(
      zoomViewBoxAtClientPoint({
        base: { x: 0, y: 0, width: 800, height: 400 },
        current: { x: 400, y: 200, width: 400, height: 200 },
        zoom: 1,
        clientPoint: { x: 0, y: 0 },
        viewport: { left: 0, top: 0, width: 400, height: 200 },
      }),
    ).toEqual({ x: 0, y: 0, width: 800, height: 400 });
  });

  test("clamps panning at every base viewBox edge", () => {
    expect(
      panViewBox(
        { x: -100, y: -50, width: 800, height: 400 },
        { x: 100, y: 50, width: 400, height: 200 },
        { x: -500, y: 500 },
      ),
    ).toEqual({ x: -100, y: 150, width: 400, height: 200 });
  });

  test("nudges by twelve percent of the visible width or height", () => {
    const base = { x: 0, y: 0, width: 1000, height: 500 };
    const current = { x: 300, y: 150, width: 400, height: 200 };

    expect({
      up: nudgeViewBox(base, current, "up"),
      right: nudgeViewBox(base, current, "right"),
      down: nudgeViewBox(base, current, "down"),
      left: nudgeViewBox(base, current, "left"),
    }).toEqual({
      up: { x: 300, y: 126, width: 400, height: 200 },
      right: { x: 348, y: 150, width: 400, height: 200 },
      down: { x: 300, y: 174, width: 400, height: 200 },
      left: { x: 252, y: 150, width: 400, height: 200 },
    });
  });

  test("reports zoom from the visible viewBox width", () => {
    expect(getViewBoxZoom({ x: 0, y: 0, width: 1000, height: 500 }, { x: 120, y: 80, width: 400, height: 200 })).toBe(
      2.5,
    );
  });
});
