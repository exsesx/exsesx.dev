import { NAV_EXPAND_BELOW } from "./nav-condense";

export const BLOG_HEADER_HIDE_START = 96;
export const BLOG_HEADER_HIDE_DISTANCE = 24;
export const BLOG_HEADER_HIDE_AFTER = BLOG_HEADER_HIDE_START + BLOG_HEADER_HIDE_DISTANCE;
export const BLOG_HEADER_REVEAL_DISTANCE = 48;
export const BLOG_HEADER_TOUCH_HIDE_DISTANCE = 80;
export const BLOG_HEADER_TOUCH_REVEAL_DISTANCE = 64;
export const BLOG_HEADER_TOUCH_DIRECTION_CHANGE_DEADBAND = 8;

export type PassiveBlogHeaderState = {
  accumulatedDistance: number;
  direction: "down" | "up" | null;
  hidden: boolean;
  lastScrollY: number;
};

type PassiveBlogHeaderScroll = {
  allowHide?: boolean;
  directionChangeDeadband?: number;
  hasHeaderFocus?: boolean;
  hasUserScrollIntent: boolean;
  hideDistance?: number;
  revealDistance?: number;
  shouldHideWithoutIntent?: boolean;
  scrollY: number;
};

export function createPassiveBlogHeaderState(scrollY = 0, hidden = false): PassiveBlogHeaderState {
  return {
    accumulatedDistance: 0,
    direction: null,
    hidden,
    lastScrollY: Math.max(0, scrollY),
  };
}

export function updatePassiveBlogHeader(
  state: PassiveBlogHeaderState,
  {
    allowHide = true,
    directionChangeDeadband = 0,
    hasHeaderFocus = false,
    hasUserScrollIntent,
    hideDistance = BLOG_HEADER_HIDE_DISTANCE,
    revealDistance = BLOG_HEADER_REVEAL_DISTANCE,
    shouldHideWithoutIntent = state.hidden,
    scrollY,
  }: PassiveBlogHeaderScroll,
): PassiveBlogHeaderState {
  const nextScrollY = Math.max(0, scrollY);

  if (hasHeaderFocus || nextScrollY <= NAV_EXPAND_BELOW) {
    return revealPassiveBlogHeader(state, nextScrollY);
  }

  if (!hasUserScrollIntent) {
    return createPassiveBlogHeaderState(nextScrollY, shouldHideWithoutIntent);
  }

  const delta = nextScrollY - state.lastScrollY;

  if (delta === 0) {
    return state;
  }

  const direction = delta > 0 ? "down" : "up";
  const movementDistance =
    direction === "down" && !state.hidden
      ? Math.max(0, nextScrollY - Math.max(state.lastScrollY, BLOG_HEADER_HIDE_START))
      : Math.abs(delta);
  const directionChanged = state.direction !== null && state.direction !== direction;
  const effectiveMovementDistance = directionChanged
    ? Math.max(0, movementDistance - directionChangeDeadband)
    : movementDistance;
  const accumulatedDistance =
    direction === "down" && !allowHide
      ? 0
      : state.direction === direction
        ? state.accumulatedDistance + effectiveMovementDistance
        : effectiveMovementDistance;
  const shouldHide = allowHide && !state.hidden && direction === "down" && accumulatedDistance >= hideDistance;
  const shouldReveal = state.hidden && direction === "up" && accumulatedDistance >= revealDistance;

  return {
    accumulatedDistance: shouldHide || shouldReveal ? 0 : accumulatedDistance,
    direction,
    hidden: shouldHide ? true : shouldReveal ? false : state.hidden,
    lastScrollY: nextScrollY,
  };
}

export function revealPassiveBlogHeader(state: PassiveBlogHeaderState, scrollY = state.lastScrollY) {
  return {
    ...state,
    accumulatedDistance: 0,
    direction: null,
    hidden: false,
    lastScrollY: Math.max(0, scrollY),
  };
}
