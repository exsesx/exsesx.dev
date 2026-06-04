import { type ReactNode } from "react";
import { DesktopViewTransition } from "./DesktopViewTransition";

export default function RouteFadeTransition({ children }: { children: ReactNode }) {
  return (
    <DesktopViewTransition
      enter={{ "nav-forward": "nav-forward", "nav-back": "nav-back", default: "none" }}
      exit={{ "nav-forward": "nav-forward", "nav-back": "nav-back", default: "none" }}
      default="none"
    >
      {children}
    </DesktopViewTransition>
  );
}
