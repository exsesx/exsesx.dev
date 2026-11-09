import { register, render, type TextMeasurer } from "pele/core";
import flowchart from "pele/diagrams/flowchart";
import { DIAGRAM_LAYOUT_WIDTHS, type DiagramFrame, type DiagramLayout } from "./mermaid-camera";

export const PELE_FONT_FAMILY = "MonoLisaCode, ui-monospace, monospace";
/** Labels read at the body's medium weight; bold markup, cluster titles and the focus node step up to 700. */
export const PELE_FONT_WEIGHTS = { regular: 500, bold: 700 } as const;
/** globals.css tightens diagram labels by the same amount. */
const LABEL_LETTER_SPACING_EM = -0.01;
/** MonoLisa sets every glyph the diagrams use, Latin and Cyrillic, on a 0.64em advance in all four cuts. */
const MONOLISA_ADVANCE_EM = 0.64;

type PeleDiagramOptions = {
  idPrefix: string;
  maxWidth: number;
  measurer?: TextMeasurer;
};

register(flowchart);

export function createPeleTextMeasurer(): TextMeasurer {
  const context = document.createElement("canvas").getContext("2d");

  if (!context) {
    throw new Error("The browser could not measure diagram text.");
  }

  return {
    width(text, size, style) {
      const weight = style & 1 ? PELE_FONT_WEIGHTS.bold : PELE_FONT_WEIGHTS.regular;
      const italic = style & 2 ? "italic " : "";
      const letterSpacing = LABEL_LETTER_SPACING_EM * size;

      context.font = `${italic}${weight} ${size}px ${PELE_FONT_FAMILY}`;

      const supportsLetterSpacing = "letterSpacing" in context;

      if (supportsLetterSpacing) {
        context.letterSpacing = `${letterSpacing}px`;
      }

      const width = context.measureText(text).width;

      return supportsLetterSpacing ? width : width + Array.from(text).length * letterSpacing;
    },
  };
}

/** The canvas measurer's answer without a canvas: exact for MonoLisa glyphs, so the server lays out what the client draws. */
export function createMonospaceTextMeasurer(): TextMeasurer {
  return {
    width(text, size) {
      return Array.from(text).length * (MONOLISA_ADVANCE_EM + LABEL_LETTER_SPACING_EM) * size;
    },
  };
}

function renderPele(source: string, options: PeleDiagramOptions) {
  return render(source, {
    ...options,
    fontFamily: PELE_FONT_FAMILY,
    fontFamilyMono: PELE_FONT_FAMILY,
    fontSize: 16,
    images: false,
    links: false,
    responsive: false,
  });
}

export function renderPeleDiagram(source: string, options: PeleDiagramOptions) {
  const { svg } = renderPele(source, options);

  return svg.replace("<svg ", '<svg aria-hidden="true" focusable="false" ');
}

/**
 * The drawing's size in both page layouts, measured where there is no DOM so the page can reserve its frame before the
 * renderer loads. Null when the source does not parse: the client then shows the source in an unsized canvas.
 */
export function measureDiagramFrame(source: string): DiagramFrame | null {
  const measurer = createMonospaceTextMeasurer();
  const measure = (layout: DiagramLayout) => {
    const { width, height } = renderPele(source, {
      idPrefix: "frame",
      maxWidth: DIAGRAM_LAYOUT_WIDTHS[layout],
      measurer,
    });

    return { width, height };
  };

  try {
    return { compact: measure("compact"), wide: measure("wide") };
  } catch {
    return null;
  }
}
