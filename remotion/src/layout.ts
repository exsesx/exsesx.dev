import { useVideoConfig } from "remotion";

export type Shape = "wide" | "tall" | "square";

export function useShape(): Shape {
  const { width, height } = useVideoConfig();
  const r = width / height;
  if (r > 1.2) return "wide";
  if (r < 0.8) return "tall";
  return "square";
}

// Pick a value by shape with a fallback chain.
export function byShape<T>(shape: Shape, opts: { wide: T; tall: T; square: T }): T {
  return opts[shape];
}
