"use client";

import {
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  formatViewBox,
  getViewBoxZoom,
  MIN_MERMAID_ZOOM,
  type NudgeDirection,
  nudgeViewBox,
  type Point,
  panViewBox,
  parseViewBox,
  type ViewBox,
  type Viewport,
  zoomViewBoxAtClientPoint,
} from "@/lib/mermaid-camera";

type PanGesture = {
  lastPoint: Point;
  pointerId: number;
};

type PinchGesture = {
  startCamera: ViewBox;
  startDistance: number;
  startMidpoint: Point;
  startZoom: number;
  viewport: Viewport;
};

type PendingCamera = {
  announceZoom: boolean;
  viewBox: ViewBox;
};

type UseMermaidCameraOptions = {
  isReady: boolean;
  renderedSvg: string | null;
  zoomStatus: string;
};

const ZOOM_BUTTON_STEP = 0.25;
const ZOOM_WHEEL_SENSITIVITY = 0.0022;
const PAN_INPUT_GAIN = 1.08;
const PINCH_ZOOM_EXPONENT = 1.12;

function midpoint(first: Point, second: Point): Point {
  return {
    x: (first.x + second.x) / 2,
    y: (first.y + second.y) / 2,
  };
}

function distance(first: Point, second: Point) {
  return Math.hypot(second.x - first.x, second.y - first.y);
}

function getViewport(element: HTMLElement): Viewport {
  const { height, left, top, width } = element.getBoundingClientRect();

  return { height, left, top, width };
}

function getClientScale(viewBox: ViewBox, viewport: Viewport) {
  return Math.min(viewport.width / viewBox.width, viewport.height / viewBox.height);
}

function rebaseViewBox(previousBase: ViewBox, previousCamera: ViewBox, nextBase: ViewBox): ViewBox {
  const zoom = getViewBoxZoom(previousBase, previousCamera);
  const centerX = previousCamera.x + previousCamera.width / 2;
  const centerY = previousCamera.y + previousCamera.height / 2;
  const centerRatioX = (centerX - previousBase.x) / previousBase.width;
  const centerRatioY = (centerY - previousBase.y) / previousBase.height;
  const width = nextBase.width / zoom;
  const height = nextBase.height / zoom;
  const candidate = {
    height,
    width,
    x: nextBase.x + nextBase.width * centerRatioX - width / 2,
    y: nextBase.y + nextBase.height * centerRatioY - height / 2,
  };

  return panViewBox(nextBase, candidate, { x: 0, y: 0 });
}

function getTouchPoints(pointers: ReadonlyMap<number, Point>) {
  return Array.from(pointers.values()).slice(0, 2);
}

export function useMermaidCamera({ isReady, renderedSvg, zoomStatus }: UseMermaidCameraOptions) {
  const visualRef = useRef<HTMLDivElement>(null);
  const baseViewBoxRef = useRef<ViewBox | null>(null);
  const cameraRef = useRef<ViewBox | null>(null);
  const pointersRef = useRef(new Map<number, Point>());
  const panGestureRef = useRef<PanGesture | null>(null);
  const pinchGestureRef = useRef<PinchGesture | null>(null);
  const pendingCameraRef = useRef<PendingCamera | null>(null);
  const cameraFrameRef = useRef(0);
  const announcementTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [zoomAnnouncement, setZoomAnnouncement] = useState("");
  const [zoomPercent, setZoomPercent] = useState(100);
  const isZoomed = zoomPercent > 100;

  const scheduleZoomAnnouncement = useCallback(
    (percent: number) => {
      if (announcementTimerRef.current) {
        clearTimeout(announcementTimerRef.current);
      }

      announcementTimerRef.current = setTimeout(() => {
        setZoomAnnouncement(`${zoomStatus}: ${percent}%`);
      }, 240);
    },
    [zoomStatus],
  );

  const commitCamera = useCallback(
    (nextViewBox: ViewBox, announceZoom: boolean) => {
      const baseViewBox = baseViewBoxRef.current;

      if (!baseViewBox) {
        return;
      }

      cameraRef.current = nextViewBox;
      visualRef.current?.querySelector("svg")?.setAttribute("viewBox", formatViewBox(nextViewBox));

      const nextZoomPercent = Math.round(getViewBoxZoom(baseViewBox, nextViewBox) * 100);

      setZoomPercent(nextZoomPercent);

      if (announceZoom) {
        scheduleZoomAnnouncement(nextZoomPercent);
      }
    },
    [scheduleZoomAnnouncement],
  );

  const queueCamera = useCallback(
    (nextViewBox: ViewBox, announceZoom: boolean) => {
      cameraRef.current = nextViewBox;
      pendingCameraRef.current = {
        announceZoom: pendingCameraRef.current?.announceZoom === true || announceZoom,
        viewBox: nextViewBox,
      };

      if (cameraFrameRef.current !== 0) {
        return;
      }

      cameraFrameRef.current = requestAnimationFrame(() => {
        cameraFrameRef.current = 0;
        const pendingCamera = pendingCameraRef.current;
        pendingCameraRef.current = null;

        if (pendingCamera) {
          commitCamera(pendingCamera.viewBox, pendingCamera.announceZoom);
        }
      });
    },
    [commitCamera],
  );

  const cancelQueuedCamera = useCallback(() => {
    if (cameraFrameRef.current !== 0) {
      cancelAnimationFrame(cameraFrameRef.current);
      cameraFrameRef.current = 0;
    }

    pendingCameraRef.current = null;
  }, []);

  const resetCamera = useCallback(() => {
    const baseViewBox = baseViewBoxRef.current;

    if (!baseViewBox) {
      return;
    }

    cancelQueuedCamera();
    commitCamera(baseViewBox, true);
  }, [cancelQueuedCamera, commitCamera]);

  const zoomTo = useCallback(
    (nextZoom: number, clientPoint?: Point) => {
      const baseViewBox = baseViewBoxRef.current;
      const currentViewBox = cameraRef.current;
      const visual = visualRef.current;

      if (!baseViewBox || !currentViewBox || !visual) {
        return;
      }

      const viewport = getViewport(visual);
      const focalPoint = clientPoint ?? {
        x: viewport.left + viewport.width / 2,
        y: viewport.top + viewport.height / 2,
      };
      const nextViewBox = zoomViewBoxAtClientPoint({
        base: baseViewBox,
        clientPoint: focalPoint,
        current: currentViewBox,
        viewport,
        zoom: nextZoom,
      });

      commitCamera(nextViewBox, true);
    },
    [commitCamera],
  );

  const zoomBy = useCallback(
    (amount: number) => {
      const baseViewBox = baseViewBoxRef.current;
      const currentViewBox = cameraRef.current;

      if (baseViewBox && currentViewBox) {
        zoomTo(getViewBoxZoom(baseViewBox, currentViewBox) + amount);
      }
    },
    [zoomTo],
  );

  const nudge = useCallback(
    (direction: NudgeDirection) => {
      const baseViewBox = baseViewBoxRef.current;
      const currentViewBox = cameraRef.current;

      if (!baseViewBox || !currentViewBox || getViewBoxZoom(baseViewBox, currentViewBox) <= MIN_MERMAID_ZOOM) {
        return;
      }

      commitCamera(nudgeViewBox(baseViewBox, currentViewBox, direction), false);
    },
    [commitCamera],
  );

  const startPinchGesture = useCallback(() => {
    const currentViewBox = cameraRef.current;
    const baseViewBox = baseViewBoxRef.current;
    const visual = visualRef.current;
    const [firstPoint, secondPoint] = getTouchPoints(pointersRef.current);

    if (!currentViewBox || !baseViewBox || !visual || !firstPoint || !secondPoint) {
      pinchGestureRef.current = null;
      return;
    }

    pinchGestureRef.current = {
      startCamera: currentViewBox,
      startDistance: Math.max(distance(firstPoint, secondPoint), 1),
      startMidpoint: midpoint(firstPoint, secondPoint),
      startZoom: getViewBoxZoom(baseViewBox, currentViewBox),
      viewport: getViewport(visual),
    };
    panGestureRef.current = null;
    setIsPanning(true);
  }, []);

  const endPointerGesture = useCallback((pointerId: number) => {
    pointersRef.current.delete(pointerId);

    if (panGestureRef.current?.pointerId === pointerId) {
      panGestureRef.current = null;
    }

    if (pointersRef.current.size === 2) {
      const currentViewBox = cameraRef.current;
      const baseViewBox = baseViewBoxRef.current;
      const visual = visualRef.current;
      const [firstPoint, secondPoint] = getTouchPoints(pointersRef.current);

      if (currentViewBox && baseViewBox && visual && firstPoint && secondPoint) {
        pinchGestureRef.current = {
          startCamera: currentViewBox,
          startDistance: Math.max(distance(firstPoint, secondPoint), 1),
          startMidpoint: midpoint(firstPoint, secondPoint),
          startZoom: getViewBoxZoom(baseViewBox, currentViewBox),
          viewport: getViewport(visual),
        };
      }
    } else {
      pinchGestureRef.current = null;
    }

    if (pointersRef.current.size === 0) {
      setIsPanning(false);
    }
  }, []);

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!isReady || (event.pointerType === "mouse" && event.button !== 0)) {
        return;
      }

      const point = { x: event.clientX, y: event.clientY };

      if (event.pointerType === "touch") {
        pointersRef.current.set(event.pointerId, point);

        if (pointersRef.current.size === 2) {
          event.preventDefault();
          startPinchGesture();
        } else if (pointersRef.current.size > 2) {
          pinchGestureRef.current = null;
          panGestureRef.current = null;
        } else if (isZoomed) {
          panGestureRef.current = { lastPoint: point, pointerId: event.pointerId };
          setIsPanning(true);
        }

        return;
      }

      if (!isZoomed) {
        return;
      }

      event.currentTarget.setPointerCapture(event.pointerId);
      panGestureRef.current = { lastPoint: point, pointerId: event.pointerId };
      setIsPanning(true);
    },
    [isReady, isZoomed, startPinchGesture],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const currentViewBox = cameraRef.current;
      const baseViewBox = baseViewBoxRef.current;
      const visual = visualRef.current;

      if (!currentViewBox || !baseViewBox || !visual) {
        return;
      }

      const nextPoint = { x: event.clientX, y: event.clientY };

      if (event.pointerType === "touch") {
        if (!pointersRef.current.has(event.pointerId)) {
          return;
        }

        pointersRef.current.set(event.pointerId, nextPoint);

        if (pointersRef.current.size === 2 && pinchGestureRef.current) {
          event.preventDefault();
          const [firstPoint, secondPoint] = getTouchPoints(pointersRef.current);

          if (!firstPoint || !secondPoint) {
            return;
          }

          const pinch = pinchGestureRef.current;
          const nextMidpoint = midpoint(firstPoint, secondPoint);
          const distanceRatio = distance(firstPoint, secondPoint) / pinch.startDistance;
          const nextZoom = pinch.startZoom * distanceRatio ** PINCH_ZOOM_EXPONENT;
          const zoomedViewBox = zoomViewBoxAtClientPoint({
            base: baseViewBox,
            clientPoint: pinch.startMidpoint,
            current: pinch.startCamera,
            viewport: pinch.viewport,
            zoom: nextZoom,
          });
          const clientScale = getClientScale(zoomedViewBox, pinch.viewport);
          const translatedViewBox = panViewBox(baseViewBox, zoomedViewBox, {
            x: (-(nextMidpoint.x - pinch.startMidpoint.x) * PAN_INPUT_GAIN) / clientScale,
            y: (-(nextMidpoint.y - pinch.startMidpoint.y) * PAN_INPUT_GAIN) / clientScale,
          });

          queueCamera(translatedViewBox, true);
          return;
        }
      }

      const panGesture = panGestureRef.current;

      if (!panGesture || panGesture.pointerId !== event.pointerId) {
        return;
      }

      event.preventDefault();
      const viewport = getViewport(visual);
      const clientScale = getClientScale(currentViewBox, viewport);
      const nextViewBox = panViewBox(baseViewBox, currentViewBox, {
        x: (-(nextPoint.x - panGesture.lastPoint.x) * PAN_INPUT_GAIN) / clientScale,
        y: (-(nextPoint.y - panGesture.lastPoint.y) * PAN_INPUT_GAIN) / clientScale,
      });

      panGesture.lastPoint = nextPoint;
      queueCamera(nextViewBox, false);
    },
    [queueCamera],
  );

  const handlePointerEnd = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      endPointerGesture(event.pointerId);
    },
    [endPointerGesture],
  );

  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (event.altKey || event.ctrlKey || event.metaKey) {
        return;
      }

      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        zoomBy(ZOOM_BUTTON_STEP);
        return;
      }

      if (event.key === "-") {
        event.preventDefault();
        zoomBy(-ZOOM_BUTTON_STEP);
        return;
      }

      if (event.key === "Home") {
        event.preventDefault();
        resetCamera();
        return;
      }

      const directionByKey: Partial<Record<string, NudgeDirection>> = {
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right",
        ArrowUp: "up",
      };
      const direction = directionByKey[event.key];

      if (direction && isZoomed) {
        event.preventDefault();
        nudge(direction);
      }
    },
    [isZoomed, nudge, resetCamera, zoomBy],
  );

  useEffect(() => {
    if (!renderedSvg) {
      return;
    }

    const svg = visualRef.current?.querySelector("svg");
    const parsedViewBox = parseViewBox(svg?.getAttribute("viewBox") ?? "");

    if (!svg || !parsedViewBox) {
      baseViewBoxRef.current = null;
      cameraRef.current = null;
      return;
    }

    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");

    const previousBase = baseViewBoxRef.current;
    const previousCamera = cameraRef.current;
    const nextCamera =
      previousBase && previousCamera ? rebaseViewBox(previousBase, previousCamera, parsedViewBox) : parsedViewBox;

    baseViewBoxRef.current = parsedViewBox;
    cameraRef.current = nextCamera;
    svg.setAttribute("viewBox", formatViewBox(nextCamera));
  }, [renderedSvg]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    const visual = visualRef.current;

    if (!visual) {
      return;
    }

    const handleWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) {
        return;
      }

      const baseViewBox = baseViewBoxRef.current;
      const currentViewBox = cameraRef.current;

      if (!baseViewBox || !currentViewBox) {
        return;
      }

      event.preventDefault();
      const nextZoom = getViewBoxZoom(baseViewBox, currentViewBox) * Math.exp(-event.deltaY * ZOOM_WHEEL_SENSITIVITY);
      const nextViewBox = zoomViewBoxAtClientPoint({
        base: baseViewBox,
        clientPoint: { x: event.clientX, y: event.clientY },
        current: currentViewBox,
        viewport: getViewport(visual),
        zoom: nextZoom,
      });

      queueCamera(nextViewBox, true);
    };

    visual.addEventListener("wheel", handleWheel, { passive: false });

    return () => visual.removeEventListener("wheel", handleWheel);
  }, [isReady, queueCamera]);

  useEffect(
    () => () => {
      cancelQueuedCamera();

      if (announcementTimerRef.current) {
        clearTimeout(announcementTimerRef.current);
      }
    },
    [cancelQueuedCamera],
  );

  return {
    handleKeyDown,
    handlePointerDown,
    handlePointerEnd,
    handlePointerMove,
    isPanning,
    isZoomed,
    resetCamera,
    visualRef,
    zoomAnnouncement,
    zoomBy,
    zoomPercent,
  };
}
