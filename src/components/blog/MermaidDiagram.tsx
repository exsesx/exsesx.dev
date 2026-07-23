"use client";

import { Minus, Plus } from "lucide-react";
import type { RenderResult } from "mermaid";
import { useEffect, useId, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { BLOG_UI } from "@/lib/blog";
import { MAX_MERMAID_ZOOM, MIN_MERMAID_ZOOM } from "@/lib/mermaid-camera";
import {
  createMermaidPalette,
  getMermaidAccessibleDescription,
  getMermaidAccessibleLabel,
  getMermaidConfig,
  readMermaidThemeTokens,
} from "@/lib/mermaid-theme";
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
  reactId: string;
  resolvedTheme: "light" | "dark";
  source: string;
  state: MermaidState;
};

type MermaidUi = (typeof BLOG_UI)[keyof typeof BLOG_UI]["mermaid"];
type MermaidCamera = ReturnType<typeof useMermaidCamera>;

type MermaidToolbarProps = {
  camera: MermaidCamera;
  isReady: boolean;
  ui: MermaidUi;
};

const ZOOM_BUTTON_STEP = 0.25;

let mermaidRenderQueue: Promise<void> = Promise.resolve();
let mermaidRenderAttempt = 0;

async function renderMermaid(source: string, id: string, resolvedTheme: "light" | "dark"): Promise<RenderResult> {
  const attempt = ++mermaidRenderAttempt;
  const renderTask = mermaidRenderQueue.then(async () => {
    const { default: mermaid } = await import("mermaid");
    const palette = createMermaidPalette(readMermaidThemeTokens());
    const primaryFontFamily = palette.fontFamily.split(",")[0]?.trim();

    if (primaryFontFamily) {
      await document.fonts.load(`700 1em ${primaryFontFamily}`);
    }

    mermaid.initialize(getMermaidConfig(palette));

    return mermaid.render(`${id}-${resolvedTheme}-${attempt}`, source);
  });

  mermaidRenderQueue = renderTask.then(
    () => undefined,
    () => undefined,
  );

  return renderTask;
}

function hideInjectedSvgSemantics(svg: string) {
  return svg.replace("<svg ", '<svg aria-hidden="true" focusable="false" ');
}

export function MermaidDiagramView(props: MermaidDiagramViewProps) {
  return <MermaidDiagramViewForSource key={props.source} {...props} />;
}

function MermaidDiagramViewForSource({
  accessibleDescription,
  accessibleLabel,
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
  const isBusy = isRendering || (!isReady && !isCurrentError);
  const labelId = `${reactId}-label`;
  const descriptionId = `${reactId}-description`;
  const keyboardId = `${reactId}-keyboard`;
  const visualState = isReady && isRendering ? "updating" : isReady ? "ready" : isCurrentError ? "error" : "loading";

  return (
    <figure
      className="blog-mermaid"
      aria-busy={isBusy}
      data-state={visualState}
      data-theme={resolvedTheme}
      data-zoom={camera.zoomPercent}
    >
      <figcaption id={labelId} className={isCurrentError ? undefined : "sr-only"} lang={locale}>
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
          <div
            ref={camera.visualRef}
            className="blog-mermaid-visual blog-mermaid-svg"
            aria-describedby={`${accessibleDescription ? `${descriptionId} ` : ""}${keyboardId}`}
            aria-labelledby={labelId}
            data-panning={camera.isPanning ? "true" : "false"}
            data-testid="mermaid-viewport"
            data-zoomed={camera.isZoomed ? "true" : "false"}
            onKeyDown={camera.handleKeyDown}
            onLostPointerCapture={camera.handlePointerEnd}
            onPointerCancel={camera.handlePointerEnd}
            onPointerDown={camera.handlePointerDown}
            onPointerMove={camera.handlePointerMove}
            onPointerUp={camera.handlePointerEnd}
            role="img"
            //biome-ignore lint/a11y/noNoninteractiveTabindex: The SVG camera is keyboard-operable while this labelled image viewport is focused.
            tabIndex={0}
            //biome-ignore lint/security/noDangerouslySetInnerHtml: Mermaid renders trusted local MDX with strict security enabled.
            dangerouslySetInnerHTML={{ __html: state.svg }}
          />

          <MermaidToolbar camera={camera} isReady={isReady} ui={ui} />
        </>
      ) : isCurrentError ? (
        <pre className="blog-mermaid-visual blog-mermaid-source">
          <code>{source}</code>
        </pre>
      ) : (
        <div className="blog-mermaid-visual blog-mermaid-skeleton" aria-hidden="true" />
      )}

      <div className="sr-only" aria-atomic="true" role="status">
        {camera.zoomAnnouncement}
      </div>
    </figure>
  );
}

function MermaidToolbar({ camera, isReady, ui }: MermaidToolbarProps) {
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
        disabled={!isReady || camera.zoomPercent <= MIN_MERMAID_ZOOM * 100}
        onClick={() => camera.zoomBy(-ZOOM_BUTTON_STEP)}
      >
        <Minus strokeWidth={2.4} />
      </Button>
      <Button
        type="button"
        variant="glass"
        className="blog-mermaid-control blog-mermaid-reset"
        aria-label={`${ui.resetZoom}, ${camera.zoomPercent}%`}
        data-mermaid-control="reset"
        disabled={!isReady || !camera.isZoomed}
        onClick={camera.resetCamera}
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
        disabled={!isReady || camera.zoomPercent >= MAX_MERMAID_ZOOM * 100}
        onClick={() => camera.zoomBy(ZOOM_BUTTON_STEP)}
      >
        <Plus strokeWidth={2.4} />
      </Button>
    </div>
  );
}

export default function MermaidDiagram({ source }: MermaidDiagramProps) {
  const reactId = useId();
  const themeSnapshot = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, getServerThemeSnapshot);
  const { resolvedTheme } = parseThemeSnapshot(themeSnapshot);
  const accessibleLabel = getMermaidAccessibleLabel(source);
  const accessibleDescription = getMermaidAccessibleDescription(source);
  const [state, setState] = useState<MermaidState>({ status: "loading" });
  const [isRendering, setIsRendering] = useState(true);

  useEffect(() => {
    let cancelled = false;

    setIsRendering(true);

    async function renderDiagram() {
      try {
        const id = `mermaid-${reactId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
        const { svg } = await renderMermaid(source, id, resolvedTheme);

        if (!cancelled) {
          setState({ status: "ready", renderedSource: source, svg: hideInjectedSvgSemantics(svg) });
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
  }, [reactId, resolvedTheme, source]);

  return (
    <MermaidDiagramView
      accessibleDescription={accessibleDescription}
      accessibleLabel={accessibleLabel}
      isRendering={isRendering}
      reactId={reactId}
      resolvedTheme={resolvedTheme}
      source={source}
      state={state}
    />
  );
}
