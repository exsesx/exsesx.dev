import { NAV_EXPAND_BELOW } from "./nav-condense";

export const BLOG_HEADER_HIDE_START = 96;
export const BLOG_HEADER_HIDE_DISTANCE = 24;
export const BLOG_HEADER_HIDE_AFTER = BLOG_HEADER_HIDE_START + BLOG_HEADER_HIDE_DISTANCE;
export const BLOG_HEADER_REVEAL_DISTANCE = 48;
export const BLOG_HEADER_TOUCH_HIDE_DISTANCE = 24;
export const BLOG_HEADER_TOUCH_REVEAL_DISTANCE = 16;
export const BLOG_HEADER_TOUCH_DIRECTION_CHANGE_DEADBAND = 4;

export type PassiveBlogHeaderState = {
  accumulatedDistance: number;
  direction: "down" | "up" | null;
  hidden: boolean;
  lastScrollY: number;
};

type PassiveBlogHeaderScroll = {
  directionChangeDeadband?: number;
  hasHeaderFocus?: boolean;
  hasUserScrollIntent: boolean;
  hideDistance?: number;
  maxScrollY?: number;
  revealDistance?: number;
  shouldHideWithoutIntent?: boolean;
  scrollY: number;
};

function clampScrollY(scrollY: number, maxScrollY = Number.POSITIVE_INFINITY) {
  return Math.min(Math.max(0, scrollY), Math.max(0, maxScrollY));
}

export function createPassiveBlogHeaderState(
  scrollY = 0,
  hidden = false,
  maxScrollY = Number.POSITIVE_INFINITY,
): PassiveBlogHeaderState {
  return {
    accumulatedDistance: 0,
    direction: null,
    hidden,
    lastScrollY: clampScrollY(scrollY, maxScrollY),
  };
}

export function updatePassiveBlogHeader(
  state: PassiveBlogHeaderState,
  {
    directionChangeDeadband = 0,
    hasHeaderFocus = false,
    hasUserScrollIntent,
    hideDistance = BLOG_HEADER_HIDE_DISTANCE,
    maxScrollY = Number.POSITIVE_INFINITY,
    revealDistance = BLOG_HEADER_REVEAL_DISTANCE,
    shouldHideWithoutIntent = state.hidden,
    scrollY,
  }: PassiveBlogHeaderScroll,
): PassiveBlogHeaderState {
  const nextScrollY = clampScrollY(scrollY, maxScrollY);

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
    state.direction === direction ? state.accumulatedDistance + effectiveMovementDistance : effectiveMovementDistance;
  const shouldHide = !state.hidden && direction === "down" && accumulatedDistance >= hideDistance;
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
