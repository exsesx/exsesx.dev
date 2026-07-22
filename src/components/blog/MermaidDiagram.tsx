"use client";

import type { RenderResult } from "mermaid";
import { useEffect, useId, useState, useSyncExternalStore } from "react";
import {
  createMermaidPalette,
  getMermaidAccessibleLabel,
  getMermaidConfig,
  readMermaidThemeTokens,
} from "@/lib/mermaid-theme";
import { getServerThemeSnapshot, getThemeSnapshot, parseThemeSnapshot, subscribeToTheme } from "@/lib/theme";

type MermaidDiagramProps = {
  source: string;
};

type MermaidState = { status: "loading" } | { status: "ready"; svg: string } | { status: "error"; message: string };

type MermaidDiagramViewProps = {
  accessibleLabel: string;
  isRendering: boolean;
  reactId: string;
  resolvedTheme: "light" | "dark";
  source: string;
  state: MermaidState;
};

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

export function MermaidDiagramView({
  accessibleLabel,
  isRendering,
  reactId,
  resolvedTheme,
  source,
  state,
}: MermaidDiagramViewProps) {
  const isBusy = state.status === "loading" || (state.status === "ready" && isRendering);
  const labelId = `${reactId}-label`;
  const visualState = state.status === "ready" && isRendering ? "updating" : state.status;

  return (
    <figure
      className="blog-mermaid"
      aria-busy={isBusy}
      aria-labelledby={labelId}
      data-state={visualState}
      data-theme={resolvedTheme}
      role={state.status === "error" ? undefined : "img"}
    >
      <figcaption id={labelId} className={state.status === "error" ? undefined : "sr-only"} lang="en">
        {state.status === "error" ? `Diagram unavailable: ${state.message}` : accessibleLabel}
      </figcaption>
      {state.status === "ready" ? (
        <div
          className="blog-mermaid-visual blog-mermaid-svg"
          aria-hidden="true"
          //biome-ignore lint/security/noDangerouslySetInnerHtml: Mermaid renders trusted local MDX with strict security enabled.
          dangerouslySetInnerHTML={{ __html: state.svg }}
        />
      ) : state.status === "loading" ? (
        <div className="blog-mermaid-visual blog-mermaid-skeleton" aria-hidden="true" />
      ) : (
        <pre className="blog-mermaid-visual blog-mermaid-source">
          <code>{source}</code>
        </pre>
      )}
    </figure>
  );
}

export default function MermaidDiagram({ source }: MermaidDiagramProps) {
  const reactId = useId();
  const themeSnapshot = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, getServerThemeSnapshot);
  const { resolvedTheme } = parseThemeSnapshot(themeSnapshot);
  const accessibleLabel = getMermaidAccessibleLabel(source);
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
          setState({ status: "ready", svg });
          setIsRendering(false);
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            status: "error",
            message: error instanceof Error ? error.message : "The diagram could not be rendered.",
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
      accessibleLabel={accessibleLabel}
      isRendering={isRendering}
      reactId={reactId}
      resolvedTheme={resolvedTheme}
      source={source}
      state={state}
    />
  );
}
