import { type ReactNode, ViewTransition } from "react";

/*
 * Page-level transition boundary. Directional types (nav-forward/nav-back)
 * slide+fade for hierarchical navigation (list → detail); nav-fade is a plain
 * cross-fade for lateral navigation (Home ↔ Projects tabs, hotkeys) where a
 * directional slide would falsely imply depth.
 */
export default function RouteFadeTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition
      enter={{ "nav-forward": "nav-forward", "nav-back": "nav-back", "nav-fade": "page-enter", default: "none" }}
      exit={{ "nav-forward": "nav-forward", "nav-back": "nav-back", "nav-fade": "page-exit", default: "none" }}
      default="none"
    >
      {children}
    </ViewTransition>
  );
}
