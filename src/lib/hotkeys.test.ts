import { describe, expect, test } from "bun:test";
import { getNavbarHotkeyRoute } from "./hotkeys";

describe("getNavbarHotkeyRoute", () => {
  test("moves right from home to projects", () => {
    expect(getNavbarHotkeyRoute("/", "right")).toBe("/projects");
  });

  test("moves left from projects to home", () => {
    expect(getNavbarHotkeyRoute("/projects", "left")).toBe("/");
  });

  test("wraps left from home to projects", () => {
    expect(getNavbarHotkeyRoute("/", "left")).toBe("/projects");
  });

  test("wraps right from projects to home", () => {
    expect(getNavbarHotkeyRoute("/projects", "right")).toBe("/");
  });

  test("treats project detail pages as the projects nav item", () => {
    expect(getNavbarHotkeyRoute("/project/flowkit", "left")).toBe("/");
  });
});
