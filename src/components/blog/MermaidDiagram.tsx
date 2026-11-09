"use client";

import { Minus, Plus } from "lucide-react";
import {
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type Ref,
  useCallback,
  useEffect,
  useId,
  useState,
  useSyncExternalStore,
} from "react";
import { Button } from "@/components/ui/button";
import { BLOG_UI } from "@/lib/blog";
import { playInteractionSound } from "@/lib/interaction-sounds";
import { MAX_MERMAID_ZOOM, MIN_MERMAID_ZOOM, parseViewBox } from "@/lib/mermaid-camera";
import { getMermaidAccessibleDescription, getMermaidAccessibleLabel } from "@/lib/mermaid-theme";
import { getServerThemeSnapshot, getThemeSnapshot, parseThemeSnapshot, subscribeToTheme } from "@/lib/theme";
import { useBlogLocale } from "./BlogLocaleContext";
import { useMermaidCamera } from "./useMermaidCamera";

type MermaidDiagramProps = {
  source: string;
};

type MermaidState =
  | { status: "loading" }
  | { status: "ready"; renderedSource: string; svg: string }
  | { status: "error"; message: string; renderedSource: string };

type MermaidDiagramViewProps = {
  accessibleDescription: string | null;
  accessibleLabel: string;
  isRendering: boolean;
  containerRef?: Ref<HTMLElement>;
  reactId: string;
  resolvedTheme: "light" | "dark";
  source: string;
  state: MermaidState;
};

type MermaidUi = (typeof BLOG_UI)[keyof typeof BLOG_UI]["mermaid"];
type MermaidCamera = ReturnType<typeof useMermaidCamera>;

type MermaidToolbarProps = {
  camera: MermaidCamera;
  ui: MermaidUi;
};

const ZOOM_BUTTON_STEP = 0.25;
// Diagrams start drawing about a screen before they scroll in, so the renderer and the code face's bold and italic
// cuts stay off the network for readers who never reach them.
const RENDER_AHEAD_MARGIN = "100% 0px";
const SVG_VIEW_BOX = /<svg\b[^>]*\bviewBox="([^"]+)"/;
const SVG_ITALIC = /font-style(?:="|:\s*)italic/;

// The canvas takes the drawing's own proportions (globals.css caps the height), so a short tree gets a short frame
// and a tall flow keeps its labels near body size instead of shrinking into a fixed box.
function getDrawingStyle(svg: string): CSSProperties | undefined {
  const viewBox = parseViewBox(SVG_VIEW_BOX.exec(svg)?.[1] ?? "");

  if (!viewBox) {
    return undefined;
  }

  return {
    "--blog-mermaid-ratio": `${viewBox.width} / ${viewBox.height}`,
    "--blog-mermaid-height": `${viewBox.height}px`,
  } as CSSProperties;
}

function loadDiagramFonts(source: string, styles: readonly string[]) {
  return Promise.all(styles.map(style => document.fonts.load(`${style} 16px MonoLisaCode`, source)));
}

function subscribeToNothing() {
  return () => {};
}

// False in the server markup and true once React owns the page, so a page without scripts never claims it is loading.
function useIsHydrated() {
  return useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );
}

function runCameraCommand(command: () => void) {
  playInteractionSound("tap");
  command();
}

export function MermaidDiagramView(props: MermaidDiagramViewProps) {
  return <MermaidDiagramViewForSource key={props.source} {...props} />;
}

function MermaidDiagramViewForSource({
  accessibleDescription,
  accessibleLabel,
  containerRef,
  isRendering,
  reactId,
  resolvedTheme,
  source,
  state,
}: MermaidDiagramViewProps) {
  const locale = useBlogLocale();
  const ui = BLOG_UI[locale].mermaid;
  const isReady = state.status === "ready" && state.renderedSource === source;
  const isCurrentError = state.status === "error" && state.renderedSource === source;
  const renderedSvg = isReady ? state.svg : null;
  const camera = useMermaidCamera({ isReady, renderedSvg, zoomStatus: ui.zoomStatus });
  const isHydrated = useIsHydrated();
  const isLoading = isRendering || (!isReady && !isCurrentError);
  // The server-rendered skeleton waits on scripts that may never run, so only a hydrated or drawn diagram is busy.
  const isBusy = isLoading && (isHydrated || isReady);
  const labelId = `${reactId}-label`;
  const descriptionId = `${reactId}-description`;
  const keyboardId = `${reactId}-keyboard`;
  const visualState = isReady && isRendering ? "updating" : isReady ? "ready" : isCurrentError ? "error" : "loading";

  function handleCameraKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    const isModified = event.altKey || event.ctrlKey || event.metaKey;
    const isZoomIn = event.key === "+" || event.key === "=";
    const isZoomOut = event.key === "-";
    const isReset = event.key === "Home";
    const isEnabledCommand =
      !isModified &&
      ((isZoomIn && camera.zoomPercent < MAX_MERMAID_ZOOM * 100) ||
        (isZoomOut && camera.zoomPercent > MIN_MERMAID_ZOOM * 100) ||
        (isReset && camera.isZoomed));

    if (!event.repeat && isEnabledCommand) {
      playInteractionSound("tap");
    }

    camera.handleKeyDown(event);
  }

  return (
    <figure
      ref={containerRef}
      className="blog-mermaid"
      aria-busy={isBusy || undefined}
      data-state={visualState}
      data-theme={resolvedTheme}
      data-zoom={camera.zoomPercent}
    >
      <figcaption
        id={labelId}
        className="blog-mermaid-caption"
        data-error={isCurrentError ? "true" : undefined}
        lang={locale}
      >
        {isCurrentError ? `${ui.diagramUnavailable}: ${state.message}` : accessibleLabel}
      </figcaption>

      {accessibleDescription ? (
        <p id={descriptionId} className="sr-only" lang={locale}>
          {accessibleDescription}
        </p>
      ) : null}
      <p id={keyboardId} className="sr-only" lang={locale}>
        {ui.keyboardInstructions}
      </p>

      {isReady ? (
        <>
          <MermaidToolbar camera={camera} ui={ui} />

          <div
            ref={camera.visualRef}
            className="blog-mermaid-visual blog-mermaid-svg"
            aria-describedby={`${accessibleDescription ? `${descriptionId} ` : ""}${keyboardId}`}
            aria-labelledby={labelId}
            data-panning={camera.isPanning ? "true" : "false"}
            data-testid="mermaid-viewport"
            data-zoomed={camera.isZoomed ? "true" : "false"}
            style={getDrawingStyle(state.svg)}
            onKeyDown={handleCameraKeyDown}
            onLostPointerCapture={camera.handlePointerEnd}
            onPointerCancel={camera.handlePointerEnd}
            onPointerDown={camera.handlePointerDown}
            onPointerMove={camera.handlePointerMove}
            onPointerUp={camera.handlePointerEnd}
            role="img"
            //biome-ignore lint/a11y/noNoninteractiveTabindex: The SVG camera is keyboard-operable while this labelled image viewport is focused.
            tabIndex={0}
            //biome-ignore lint/security/noDangerouslySetInnerHtml: Pele escapes labels from trusted local MDX and disables links and images.
            dangerouslySetInnerHTML={{ __html: state.svg }}
          />
        </>
      ) : isCurrentError ? (
        <pre className="blog-mermaid-visual blog-mermaid-source">
          <code>{source}</code>
        </pre>
      ) : (
        <>
          {/* Without scripts the drawing never arrives, so the reserved canvas gives way to its description. The
              parsed fallback only exists when scripting is off, which is what the stylesheet keys on. */}
          {accessibleDescription ? (
            <noscript>
              <p className="blog-mermaid-visual blog-mermaid-fallback" aria-hidden="true" lang={locale}>
                {accessibleDescription}
              </p>
            </noscript>
          ) : null}
          <div className="blog-mermaid-visual blog-mermaid-skeleton" aria-hidden="true" />
        </>
      )}

      <div className="sr-only" aria-atomic="true" role="status">
        {camera.zoomAnnouncement}
      </div>
    </figure>
  );
}

function MermaidToolbar({ camera, ui }: MermaidToolbarProps) {
  return (
    <div
      className="blog-mermaid-toolbar"
      aria-label={ui.toolbar}
      data-zoomed={camera.isZoomed ? "true" : "false"}
      role="toolbar"
    >
      <Button
        type="button"
        variant="glass"
        size="icon"
        className="blog-mermaid-control blog-mermaid-zoom-step"
        aria-label={ui.zoomOut}
        data-mermaid-control="zoom-out"
        disabled={camera.zoomPercent <= MIN_MERMAID_ZOOM * 100}
        onClick={() => runCameraCommand(() => camera.zoomBy(-ZOOM_BUTTON_STEP))}
      >
        <Minus strokeWidth={2.4} />
      </Button>
      <Button
        type="button"
        variant="glass"
        className="blog-mermaid-control blog-mermaid-reset"
        aria-label={`${ui.resetZoom}, ${camera.zoomPercent}%`}
        data-mermaid-control="reset"
        disabled={!camera.isZoomed}
        onClick={() => runCameraCommand(camera.resetCamera)}
      >
        <span className="blog-mermaid-reset-chip">{camera.zoomPercent}%</span>
      </Button>
      <Button
        type="button"
        variant="glass"
        size="icon"
        className="blog-mermaid-control blog-mermaid-zoom-step"
        aria-label={ui.zoomIn}
        data-mermaid-control="zoom-in"
        disabled={camera.zoomPercent >= MAX_MERMAID_ZOOM * 100}
        onClick={() => runCameraCommand(() => camera.zoomBy(ZOOM_BUTTON_STEP))}
      >
        <Plus strokeWidth={2.4} />
      </Button>
    </div>
  );
}

export default function MermaidDiagram({ source }: MermaidDiagramProps) {
  const reactId = useId();
  const [maxWidth, setMaxWidth] = useState<number | null>(null);
  const themeSnapshot = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, getServerThemeSnapshot);
  const { resolvedTheme } = parseThemeSnapshot(themeSnapshot);
  const accessibleLabel = getMermaidAccessibleLabel(source);
  const accessibleDescription = getMermaidAccessibleDescription(source);
  const [state, setState] = useState<MermaidState>({ status: "loading" });
  const [isRendering, setIsRendering] = useState(true);

  const [isNearViewport, setIsNearViewport] = useState(false);

  const containerRef = useCallback((container: HTMLElement | null) => {
    if (!container) {
      return;
    }

    const resizeObserver = new ResizeObserver(entries => {
      const width = entries[0]?.contentRect.width;

      if (width && width > 0) {
        setMaxWidth(Math.floor(width));
      }
    });
    const proximityObserver = new IntersectionObserver(
      entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          setIsNearViewport(true);
          proximityObserver.disconnect();
        }
      },
      { rootMargin: RENDER_AHEAD_MARGIN },
    );

    resizeObserver.observe(container);
    proximityObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      proximityObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    if (maxWidth === null || !isNearViewport) {
      return;
    }

    const layoutWidth = maxWidth;
    let cancelled = false;

    setIsRendering(true);

    async function renderDiagram() {
      try {
        const id = `mermaid-${reactId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
        const { createPeleTextMeasurer, PELE_FONT_WEIGHTS, renderPeleDiagram } = await import("@/lib/pele-renderer");
        const uprightStyles = Object.values(PELE_FONT_WEIGHTS).map(String);
        const render = () =>
          renderPeleDiagram(source, {
            idPrefix: id,
            maxWidth: layoutWidth,
            measurer: createPeleTextMeasurer(),
          });

        await loadDiagramFonts(source, uprightStyles);

        if (cancelled) {
          return;
        }

        let svg = render();

        // Only a label that asks for italics pays for the italic face; it is measured again once that face is in.
        if (SVG_ITALIC.test(svg)) {
          await loadDiagramFonts(
            source,
            uprightStyles.map(weight => `italic ${weight}`),
          );

          if (cancelled) {
            return;
          }

          svg = render();
        }

        if (!cancelled) {
          setState({ status: "ready", renderedSource: source, svg });
          setIsRendering(false);
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            status: "error",
            message: error instanceof Error ? error.message : "The diagram could not be rendered.",
            renderedSource: source,
          });
          setIsRendering(false);
        }
      }
    }

    void renderDiagram();

    return () => {
      cancelled = true;
    };
  }, [isNearViewport, maxWidth, reactId, source]);

  return (
    <MermaidDiagramView
      accessibleDescription={accessibleDescription}
      containerRef={containerRef}
      accessibleLabel={accessibleLabel}
      isRendering={isRendering}
      reactId={reactId}
      resolvedTheme={resolvedTheme}
      source={source}
      state={state}
    />
  );
}
