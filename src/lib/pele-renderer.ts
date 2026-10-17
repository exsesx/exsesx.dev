import { register, render, type TextMeasurer } from "pele/core";
import flowchart from "pele/diagrams/flowchart";

export const PELE_FONT_FAMILY = "MonoLisaCode, ui-monospace, monospace";

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
      const weight = style & 1 ? 800 : 700;
      const italic = style & 2 ? "italic " : "";
      const letterSpacing = -0.01 * size;

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

export function renderPeleDiagram(source: string, options: PeleDiagramOptions) {
  const { svg } = render(source, {
    ...options,
    fontFamily: PELE_FONT_FAMILY,
    fontFamilyMono: PELE_FONT_FAMILY,
    fontSize: 16,
    images: false,
    links: false,
    responsive: false,
  });

  return svg.replace("<svg ", '<svg aria-hidden="true" focusable="false" ');
}
