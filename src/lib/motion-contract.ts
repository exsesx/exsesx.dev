export const MOTION_ATTRIBUTES = {
  activeBackButton: "data-active",
  activeNav: "data-active-nav",
  condensedHeader: "data-condensed",
  suppressEntryMotion: "data-suppress-entry-motion",
  viewTransitionNavigated: "data-view-transition-navigated",
} as const;

export const MOTION_DATASET_KEYS = {
  condensedHeader: "condensed",
  // html[data-motion="off"]: the visitor turned Motion off. globals.css reads
  // it in the reduced-motion / full-motion variants.
  motion: "motion",
  smoothScroll: "smoothScroll",
  viewTransitionNavigated: "viewTransitionNavigated",
} as const;

export const MOTION_OFF = "off";

export const ROUTE_TRANSITION_TYPES = {
  morph: "morph",
  navBack: "nav-back",
  navForward: "nav-forward",
} as const;

export const suppressEntryMotionProps = {
  [MOTION_ATTRIBUTES.suppressEntryMotion]: "",
} as const;

export function getProjectRouteTransitionTypes(
  direction: typeof ROUTE_TRANSITION_TYPES.navBack | typeof ROUTE_TRANSITION_TYPES.navForward,
  projectTransitionType: string,
) {
  return [direction, projectTransitionType];
}
