export const BLOG_HEADER_HIDE_DISTANCE = 18;
export const BLOG_HEADER_REVEAL_DISTANCE = 10;
export const BLOG_ARTICLE_START_OFFSET = 112;

export type PassiveBlogHeaderState = {
  accumulatedDistance: number;
  direction: "down" | "up" | null;
  hidden: boolean;
  lastScrollY: number;
};

type PassiveBlogHeaderScroll = {
  hasHeaderFocus?: boolean;
  hasUserScrollIntent: boolean;
  isPastArticleStart: boolean;
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
  { hasHeaderFocus = false, hasUserScrollIntent, isPastArticleStart, scrollY }: PassiveBlogHeaderScroll,
): PassiveBlogHeaderState {
  const nextScrollY = Math.max(0, scrollY);

  if (!isPastArticleStart || hasHeaderFocus) {
    return revealPassiveBlogHeader(state, nextScrollY);
  }

  if (!hasUserScrollIntent) {
    return createPassiveBlogHeaderState(nextScrollY, true);
  }

  const delta = nextScrollY - state.lastScrollY;

  if (delta === 0) {
    return state;
  }

  const direction = delta > 0 ? "down" : "up";
  const accumulatedDistance =
    state.direction === direction ? state.accumulatedDistance + Math.abs(delta) : Math.abs(delta);
  const shouldHide = !state.hidden && direction === "down" && accumulatedDistance >= BLOG_HEADER_HIDE_DISTANCE;
  const shouldReveal = state.hidden && direction === "up" && accumulatedDistance >= BLOG_HEADER_REVEAL_DISTANCE;

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
