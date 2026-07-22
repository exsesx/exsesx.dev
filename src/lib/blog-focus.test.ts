import { describe, expect, test } from "bun:test";
import {
  BLOG_HEADER_HIDE_DISTANCE,
  BLOG_HEADER_REVEAL_DISTANCE,
  createPassiveBlogHeaderState,
  revealPassiveBlogHeader,
  updatePassiveBlogHeader,
} from "./blog-focus";

describe("passive blog header", () => {
  test("starts visible at the top and can initialize hidden inside restored article content", () => {
    expect(createPassiveBlogHeaderState()).toEqual({
      accumulatedDistance: 0,
      direction: null,
      hidden: false,
      lastScrollY: 0,
    });

    expect(createPassiveBlogHeaderState(640, true)).toEqual({
      accumulatedDistance: 0,
      direction: null,
      hidden: true,
      lastScrollY: 640,
    });
  });

  test("does not hide before the article body begins and resets the baseline", () => {
    const state = updatePassiveBlogHeader(createPassiveBlogHeaderState(80), {
      hasUserScrollIntent: true,
      isPastArticleStart: false,
      scrollY: 240,
    });

    expect(state).toEqual({
      accumulatedDistance: 0,
      direction: null,
      hidden: false,
      lastScrollY: 240,
    });

    expect(
      updatePassiveBlogHeader(state, {
        hasUserScrollIntent: true,
        isPastArticleStart: true,
        scrollY: 240 + BLOG_HEADER_HIDE_DISTANCE - 1,
      }).hidden,
    ).toBe(false);
  });

  test("hides only after cumulative downward intent crosses the threshold", () => {
    const initial = createPassiveBlogHeaderState(200);
    const firstMove = updatePassiveBlogHeader(initial, {
      hasUserScrollIntent: true,
      isPastArticleStart: true,
      scrollY: 207,
    });
    const secondMove = updatePassiveBlogHeader(firstMove, {
      hasUserScrollIntent: true,
      isPastArticleStart: true,
      scrollY: 217,
    });
    const hidden = updatePassiveBlogHeader(secondMove, {
      hasUserScrollIntent: true,
      isPastArticleStart: true,
      scrollY: 218,
    });

    expect(firstMove).toMatchObject({ accumulatedDistance: 7, direction: "down", hidden: false });
    expect(secondMove).toMatchObject({ accumulatedDistance: 17, direction: "down", hidden: false });
    expect(hidden).toMatchObject({ accumulatedDistance: 0, direction: "down", hidden: true });
  });

  test("reveals only after cumulative upward intent crosses its threshold", () => {
    const hidden = {
      ...createPassiveBlogHeaderState(300),
      hidden: true,
    };
    const firstMove = updatePassiveBlogHeader(hidden, {
      hasUserScrollIntent: true,
      isPastArticleStart: true,
      scrollY: 294,
    });
    const revealed = updatePassiveBlogHeader(firstMove, {
      hasUserScrollIntent: true,
      isPastArticleStart: true,
      scrollY: 300 - BLOG_HEADER_REVEAL_DISTANCE,
    });

    expect(firstMove).toMatchObject({ accumulatedDistance: 6, direction: "up", hidden: true });
    expect(revealed).toMatchObject({ accumulatedDistance: 0, direction: "up", hidden: false });
  });

  test("ignores stationary jitter and restarts accumulation when direction changes", () => {
    const down = updatePassiveBlogHeader(createPassiveBlogHeaderState(100), {
      hasUserScrollIntent: true,
      isPastArticleStart: true,
      scrollY: 110,
    });
    const stationary = updatePassiveBlogHeader(down, {
      hasUserScrollIntent: true,
      isPastArticleStart: true,
      scrollY: 110,
    });
    const reversed = updatePassiveBlogHeader(stationary, {
      hasUserScrollIntent: true,
      isPastArticleStart: true,
      scrollY: 108,
    });
    const downAgain = updatePassiveBlogHeader(reversed, {
      hasUserScrollIntent: true,
      isPastArticleStart: true,
      scrollY: 111,
    });

    expect(stationary).toBe(down);
    expect(reversed).toMatchObject({ accumulatedDistance: 2, direction: "up", hidden: false });
    expect(downAgain).toMatchObject({ accumulatedDistance: 3, direction: "down", hidden: false });
  });

  test("reveals immediately while focus is inside the header", () => {
    const hidden = {
      accumulatedDistance: 4,
      direction: "down" as const,
      hidden: true,
      lastScrollY: 320,
    };

    expect(
      updatePassiveBlogHeader(hidden, {
        hasHeaderFocus: true,
        hasUserScrollIntent: true,
        isPastArticleStart: true,
        scrollY: 324,
      }),
    ).toEqual({
      accumulatedDistance: 0,
      direction: null,
      hidden: false,
      lastScrollY: 324,
    });
  });

  test("reset makes the header visible and rearms downward hiding from the new position", () => {
    const hidden = {
      ...createPassiveBlogHeaderState(500),
      hidden: true,
    };
    const reset = revealPassiveBlogHeader(hidden, 520);
    const rearmed = updatePassiveBlogHeader(reset, {
      hasUserScrollIntent: true,
      isPastArticleStart: true,
      scrollY: 520 + BLOG_HEADER_HIDE_DISTANCE,
    });

    expect(reset).toEqual({
      accumulatedDistance: 0,
      direction: null,
      hidden: false,
      lastScrollY: 520,
    });
    expect(rearmed).toMatchObject({ accumulatedDistance: 0, direction: "down", hidden: true });
  });

  test("keeps delayed restoration hidden until upward reading intent arrives", () => {
    const firstRestoration = updatePassiveBlogHeader(createPassiveBlogHeaderState(), {
      hasUserScrollIntent: false,
      isPastArticleStart: true,
      scrollY: 640,
    });
    const delayedRestoration = updatePassiveBlogHeader(firstRestoration, {
      hasUserScrollIntent: false,
      isPastArticleStart: true,
      scrollY: 960,
    });
    const continuedReading = updatePassiveBlogHeader(delayedRestoration, {
      hasUserScrollIntent: true,
      isPastArticleStart: true,
      scrollY: 960 + BLOG_HEADER_HIDE_DISTANCE,
    });
    const upwardReading = updatePassiveBlogHeader(continuedReading, {
      hasUserScrollIntent: true,
      isPastArticleStart: true,
      scrollY: 960 + BLOG_HEADER_HIDE_DISTANCE - BLOG_HEADER_REVEAL_DISTANCE,
    });

    expect(delayedRestoration).toEqual({
      accumulatedDistance: 0,
      direction: null,
      hidden: true,
      lastScrollY: 960,
    });
    expect(continuedReading).toMatchObject({ direction: "down", hidden: true });
    expect(upwardReading).toMatchObject({ accumulatedDistance: 0, direction: "up", hidden: false });
  });
});
