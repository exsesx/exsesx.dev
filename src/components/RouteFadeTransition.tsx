import { type ReactNode, ViewTransition } from "react";
import { ROUTE_TRANSITION_TYPES } from "@/lib/motion-contract";

/*
 * Page-level transition boundary. Directional types (nav-forward/nav-back)
 * slide+fade for hierarchical navigation (project list → detail). Lateral
 * header tabs intentionally leave the page still and use the active pill.
 */
export default function RouteFadeTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition
      enter={{
        [ROUTE_TRANSITION_TYPES.navForward]: ROUTE_TRANSITION_TYPES.navForward,
        [ROUTE_TRANSITION_TYPES.navBack]: ROUTE_TRANSITION_TYPES.navBack,
        default: "none",
      }}
      exit={{
        [ROUTE_TRANSITION_TYPES.navForward]: ROUTE_TRANSITION_TYPES.navForward,
        [ROUTE_TRANSITION_TYPES.navBack]: ROUTE_TRANSITION_TYPES.navBack,
        default: "none",
      }}
      default="none"
    >
      {children}
    </ViewTransition>
  );
}
