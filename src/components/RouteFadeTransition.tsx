import { type ReactNode, ViewTransition } from "react";

/*
 * Page-level transition boundary. Directional types (nav-forward/nav-back)
 * slide+fade for hierarchical navigation (project list → detail). Lateral
 * header tabs intentionally leave the page still and use the active pill.
 */
export default function RouteFadeTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition
      enter={{ "nav-forward": "nav-forward", "nav-back": "nav-back", default: "none" }}
      exit={{ "nav-forward": "nav-forward", "nav-back": "nav-back", default: "none" }}
      default="none"
    >
      {children}
    </ViewTransition>
  );
}
