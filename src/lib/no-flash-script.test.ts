import { describe, expect, test } from "bun:test";
import { DrawerBackdropCssVariables, DrawerPopupCssVariables } from "@base-ui/react/drawer";
import { DRAWER_SWIPE_PROPERTIES } from "./no-flash-script";

describe("no-flash script", () => {
  test("pre-registers the swipe properties Base UI's Drawer registers on first open", () => {
    const names = DRAWER_SWIPE_PROPERTIES.map(property => property.name);

    expect(names.sort()).toEqual(
      [
        DrawerPopupCssVariables.swipeMovementX,
        DrawerPopupCssVariables.swipeMovementY,
        DrawerPopupCssVariables.snapPointOffset,
        DrawerBackdropCssVariables.swipeProgress,
        DrawerPopupCssVariables.swipeStrength,
      ].sort(),
    );
  });
});
