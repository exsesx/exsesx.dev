export type HeadingViewportPosition = {
  id: string;
  top: number;
};

export function resolveActiveHeadingId(
  headings: readonly HeadingViewportPosition[],
  activationOffset: number,
  isAtDocumentEnd = false,
) {
  if (headings.length === 0) {
    return null;
  }

  if (isAtDocumentEnd) {
    return headings.at(-1)?.id ?? null;
  }

  let activeHeadingId: string | null = null;

  for (const heading of headings) {
    if (heading.top > activationOffset) {
      break;
    }

    activeHeadingId = heading.id;
  }

  return activeHeadingId;
}
