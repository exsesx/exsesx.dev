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

  if (state.status === "ready") {
    return (
      <figure
        className="blog-mermaid"
        aria-busy={isRendering}
        aria-labelledby={`${reactId}-label`}
        data-state={isRendering ? "updating" : "ready"}
        data-theme={resolvedTheme}
        role="img"
      >
        <figcaption id={`${reactId}-label`} className="sr-only" lang="en">
          {accessibleLabel}
        </figcaption>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: Mermaid renders trusted local MDX with strict security enabled. */}
        <div className="blog-mermaid-svg" dangerouslySetInnerHTML={{ __html: state.svg }} />
      </figure>
    );
  }

  return (
    <figure
      className="blog-mermaid"
      aria-busy={state.status === "loading"}
      data-state={state.status}
      data-theme={resolvedTheme}
    >
      <figcaption className={state.status === "error" ? undefined : "sr-only"} lang="en">
        {state.status === "error" ? `Diagram unavailable: ${state.message}` : accessibleLabel}
      </figcaption>
      <pre className="blog-mermaid-source">
        <code>{source}</code>
      </pre>
    </figure>
  );
}
