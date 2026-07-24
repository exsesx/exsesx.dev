import { describe, expect, test } from "bun:test";
import {
  BLOG_HEADER_HIDE_AFTER,
  BLOG_HEADER_HIDE_DISTANCE,
  BLOG_HEADER_HIDE_START,
  BLOG_HEADER_REVEAL_DISTANCE,
  BLOG_HEADER_TOUCH_DIRECTION_CHANGE_DEADBAND,
  BLOG_HEADER_TOUCH_HIDE_DISTANCE,
  BLOG_HEADER_TOUCH_REVEAL_DISTANCE,
  createPassiveBlogHeaderState,
  revealPassiveBlogHeader,
  updatePassiveBlogHeader,
} from "./blog-focus";

describe("passive blog header", () => {
  test("uses the confirmed hide and deliberate-reveal thresholds", () => {
    expect(BLOG_HEADER_HIDE_START).toBe(96);
    expect(BLOG_HEADER_HIDE_DISTANCE).toBe(24);
    expect(BLOG_HEADER_HIDE_AFTER).toBe(120);
    expect(BLOG_HEADER_HIDE_AFTER).toBe(BLOG_HEADER_HIDE_START + BLOG_HEADER_HIDE_DISTANCE);
    expect(BLOG_HEADER_REVEAL_DISTANCE).toBe(48);
    expect(BLOG_HEADER_TOUCH_HIDE_DISTANCE).toBe(80);
    expect(BLOG_HEADER_TOUCH_REVEAL_DISTANCE).toBe(64);
    expect(BLOG_HEADER_TOUCH_DIRECTION_CHANGE_DEADBAND).toBe(8);
  });

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

  test("stays visible through the 96px safe zone and hides at 120px", () => {
    const safeZone = updatePassiveBlogHeader(createPassiveBlogHeaderState(), {
      hasUserScrollIntent: true,
      scrollY: BLOG_HEADER_HIDE_START,
    });

    expect(safeZone).toEqual({
      accumulatedDistance: 0,
      direction: "down",
      hidden: false,
      lastScrollY: BLOG_HEADER_HIDE_START,
    });

    const beforeHide = updatePassiveBlogHeader(safeZone, {
      hasUserScrollIntent: true,
      scrollY: BLOG_HEADER_HIDE_AFTER - 1,
    });

    expect(beforeHide).toEqual({
      accumulatedDistance: BLOG_HEADER_HIDE_DISTANCE - 1,
      direction: "down",
      hidden: false,
      lastScrollY: BLOG_HEADER_HIDE_AFTER - 1,
    });

    const hidden = updatePassiveBlogHeader(beforeHide, {
      hasUserScrollIntent: true,
      scrollY: BLOG_HEADER_HIDE_AFTER,
    });

    expect(hidden).toMatchObject({ accumulatedDistance: 0, direction: "down", hidden: true });
  });

  test("hides only after cumulative downward intent crosses the threshold", () => {
    const initial = createPassiveBlogHeaderState(BLOG_HEADER_HIDE_START);
    const firstMove = updatePassiveBlogHeader(initial, {
      hasUserScrollIntent: true,
      scrollY: BLOG_HEADER_HIDE_START + 12,
    });
    const secondMove = updatePassiveBlogHeader(firstMove, {
      hasUserScrollIntent: true,
      scrollY: BLOG_HEADER_HIDE_AFTER - 1,
    });
    const hidden = updatePassiveBlogHeader(secondMove, {
      hasUserScrollIntent: true,
      scrollY: BLOG_HEADER_HIDE_AFTER,
    });

    expect(firstMove).toMatchObject({ accumulatedDistance: 12, direction: "down", hidden: false });
    expect(secondMove).toMatchObject({
      accumulatedDistance: BLOG_HEADER_HIDE_DISTANCE - 1,
      direction: "down",
      hidden: false,
    });
    expect(hidden).toMatchObject({ accumulatedDistance: 0, direction: "down", hidden: true });
  });

  test("reveals only after cumulative upward intent crosses its threshold", () => {
    const hidden = {
      ...createPassiveBlogHeaderState(300),
      hidden: true,
    };
    const firstMove = updatePassiveBlogHeader(hidden, {
      hasUserScrollIntent: true,
      scrollY: 300 - BLOG_HEADER_REVEAL_DISTANCE + 1,
    });
    const revealed = updatePassiveBlogHeader(firstMove, {
      hasUserScrollIntent: true,
      scrollY: 300 - BLOG_HEADER_REVEAL_DISTANCE,
    });

    expect(firstMove).toMatchObject({
      accumulatedDistance: BLOG_HEADER_REVEAL_DISTANCE - 1,
      direction: "up",
      hidden: true,
    });
    expect(revealed).toMatchObject({ accumulatedDistance: 0, direction: "up", hidden: false });
  });

  test("requires 64px of upward intent on coarse touch input", () => {
    const hidden = createPassiveBlogHeaderState(300, true);
    const almostRevealed = updatePassiveBlogHeader(hidden, {
      hasUserScrollIntent: true,
      revealDistance: BLOG_HEADER_TOUCH_REVEAL_DISTANCE,
      scrollY: 300 - BLOG_HEADER_TOUCH_REVEAL_DISTANCE + 1,
    });
    const revealed = updatePassiveBlogHeader(almostRevealed, {
      hasUserScrollIntent: true,
      revealDistance: BLOG_HEADER_TOUCH_REVEAL_DISTANCE,
      scrollY: 300 - BLOG_HEADER_TOUCH_REVEAL_DISTANCE,
    });

    expect(almostRevealed).toMatchObject({
      accumulatedDistance: BLOG_HEADER_TOUCH_REVEAL_DISTANCE - 1,
      direction: "up",
      hidden: true,
    });
    expect(revealed).toMatchObject({ accumulatedDistance: 0, direction: "up", hidden: false });
  });

  test("latches a coarse-touch reveal until a fresh 80px downward gesture", () => {
    const hidden = createPassiveBlogHeaderState(400, true);
    const revealed = updatePassiveBlogHeader(hidden, {
      hasUserScrollIntent: true,
      revealDistance: BLOG_HEADER_TOUCH_REVEAL_DISTANCE,
      scrollY: 400 - BLOG_HEADER_TOUCH_REVEAL_DISTANCE,
    });
    const reversedInSameGesture = updatePassiveBlogHeader(revealed, {
      allowHide: false,
      hasUserScrollIntent: true,
      hideDistance: BLOG_HEADER_TOUCH_HIDE_DISTANCE,
      directionChangeDeadband: BLOG_HEADER_TOUCH_DIRECTION_CHANGE_DEADBAND,
      scrollY: 400 - BLOG_HEADER_TOUCH_REVEAL_DISTANCE + BLOG_HEADER_TOUCH_HIDE_DISTANCE,
    });
    const freshGesture = createPassiveBlogHeaderState(reversedInSameGesture.lastScrollY);
    const almostHidden = updatePassiveBlogHeader(freshGesture, {
      hasUserScrollIntent: true,
      hideDistance: BLOG_HEADER_TOUCH_HIDE_DISTANCE,
      directionChangeDeadband: BLOG_HEADER_TOUCH_DIRECTION_CHANGE_DEADBAND,
      scrollY: freshGesture.lastScrollY + BLOG_HEADER_TOUCH_HIDE_DISTANCE - 1,
    });
    const hiddenAgain = updatePassiveBlogHeader(almostHidden, {
      hasUserScrollIntent: true,
      hideDistance: BLOG_HEADER_TOUCH_HIDE_DISTANCE,
      directionChangeDeadband: BLOG_HEADER_TOUCH_DIRECTION_CHANGE_DEADBAND,
      scrollY: freshGesture.lastScrollY + BLOG_HEADER_TOUCH_HIDE_DISTANCE,
    });

    expect(revealed).toMatchObject({ accumulatedDistance: 0, direction: "up", hidden: false });
    expect(reversedInSameGesture).toMatchObject({
      accumulatedDistance: 0,
      direction: "down",
      hidden: false,
    });
    expect(almostHidden).toMatchObject({
      accumulatedDistance: BLOG_HEADER_TOUCH_HIDE_DISTANCE - 1,
      direction: "down",
      hidden: false,
    });
    expect(hiddenAgain).toMatchObject({ accumulatedDistance: 0, direction: "down", hidden: true });
  });

  test("discards the first 8px after a coarse-touch direction reversal", () => {
    const upward = {
      accumulatedDistance: 24,
      direction: "up" as const,
      hidden: false,
      lastScrollY: 300,
    };
    const reversed = updatePassiveBlogHeader(upward, {
      directionChangeDeadband: BLOG_HEADER_TOUCH_DIRECTION_CHANGE_DEADBAND,
      hasUserScrollIntent: true,
      scrollY: 308,
    });
    const continued = updatePassiveBlogHeader(reversed, {
      directionChangeDeadband: BLOG_HEADER_TOUCH_DIRECTION_CHANGE_DEADBAND,
      hasUserScrollIntent: true,
      scrollY: 309,
    });

    expect(reversed).toMatchObject({ accumulatedDistance: 0, direction: "down", hidden: false });
    expect(continued).toMatchObject({ accumulatedDistance: 1, direction: "down", hidden: false });
  });

  test("reveals immediately at 32px even without the full upward threshold", () => {
    const hidden = createPassiveBlogHeaderState(40, true);
    const justAboveTopZone = updatePassiveBlogHeader(hidden, {
      hasUserScrollIntent: true,
      scrollY: 33,
    });

    expect(justAboveTopZone).toMatchObject({
      accumulatedDistance: 7,
      direction: "up",
      hidden: true,
    });

    expect(
      updatePassiveBlogHeader(justAboveTopZone, {
        hasUserScrollIntent: true,
        scrollY: 32,
      }),
    ).toEqual({
      accumulatedDistance: 0,
      direction: null,
      hidden: false,
      lastScrollY: 32,
    });
  });

  test("restarts intent after a direction reversal and re-hides after 24px down", () => {
    const hidden = createPassiveBlogHeaderState(300, true);
    const upward = updatePassiveBlogHeader(hidden, {
      hasUserScrollIntent: true,
      scrollY: 276,
    });
    const reversedDown = updatePassiveBlogHeader(upward, {
      hasUserScrollIntent: true,
      scrollY: 280,
    });
    const almostRevealed = updatePassiveBlogHeader(reversedDown, {
      hasUserScrollIntent: true,
      scrollY: 233,
    });
    const revealed = updatePassiveBlogHeader(almostRevealed, {
      hasUserScrollIntent: true,
      scrollY: 232,
    });
    const almostHidden = updatePassiveBlogHeader(revealed, {
      hasUserScrollIntent: true,
      scrollY: 255,
    });
    const hiddenAgain = updatePassiveBlogHeader(almostHidden, {
      hasUserScrollIntent: true,
      scrollY: 256,
    });

    expect(upward).toMatchObject({ accumulatedDistance: 24, direction: "up", hidden: true });
    expect(reversedDown).toMatchObject({ accumulatedDistance: 4, direction: "down", hidden: true });
    expect(almostRevealed).toMatchObject({
      accumulatedDistance: BLOG_HEADER_REVEAL_DISTANCE - 1,
      direction: "up",
      hidden: true,
    });
    expect(revealed).toMatchObject({ accumulatedDistance: 0, direction: "up", hidden: false });
    expect(almostHidden).toMatchObject({
      accumulatedDistance: BLOG_HEADER_HIDE_DISTANCE - 1,
      direction: "down",
      hidden: false,
    });
    expect(hiddenAgain).toMatchObject({ accumulatedDistance: 0, direction: "down", hidden: true });
  });

  test("ignores stationary jitter", () => {
    const down = updatePassiveBlogHeader(createPassiveBlogHeaderState(BLOG_HEADER_HIDE_START), {
      hasUserScrollIntent: true,
      scrollY: BLOG_HEADER_HIDE_START + 10,
    });
    const stationary = updatePassiveBlogHeader(down, {
      hasUserScrollIntent: true,
      scrollY: BLOG_HEADER_HIDE_START + 10,
    });

    expect(stationary).toBe(down);
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
      shouldHideWithoutIntent: true,
      scrollY: 640,
    });
    const delayedRestoration = updatePassiveBlogHeader(firstRestoration, {
      hasUserScrollIntent: false,
      scrollY: 960,
    });
    const continuedReading = updatePassiveBlogHeader(delayedRestoration, {
      hasUserScrollIntent: true,
      scrollY: 960 + BLOG_HEADER_HIDE_DISTANCE,
    });
    const upwardReading = updatePassiveBlogHeader(continuedReading, {
      hasUserScrollIntent: true,
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
