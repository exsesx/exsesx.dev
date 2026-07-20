export const MOTION_ATTRIBUTES = {
  activeBackButton: "data-active",
  activeNav: "data-active-nav",
  backTransitionType: "data-back-transition-type",
  condensedHeader: "data-condensed",
  suppressEntryMotion: "data-suppress-entry-motion",
  viewTransitionNavigated: "data-view-transition-navigated",
} as const;

export const MOTION_DATASET_KEYS = {
  condensedHeader: "condensed",
  viewTransitionNavigated: "viewTransitionNavigated",
} as const;

export const ROUTE_TRANSITION_TYPES = {
  morph: "morph",
  navBack: "nav-back",
  navForward: "nav-forward",
} as const;

export function getBackTransitionTypeProps(transitionType: string) {
  return {
    [MOTION_ATTRIBUTES.backTransitionType]: transitionType,
  } as const;
}

export const suppressEntryMotionProps = {
  [MOTION_ATTRIBUTES.suppressEntryMotion]: "",
} as const;

export function getProjectRouteTransitionTypes(
  direction: typeof ROUTE_TRANSITION_TYPES.navBack | typeof ROUTE_TRANSITION_TYPES.navForward,
  projectTransitionType: string,
) {
  return [direction, projectTransitionType];
}
