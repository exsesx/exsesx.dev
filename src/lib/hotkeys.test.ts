import { describe, expect, test } from "bun:test";
import { getHotkeyDecision, getNavbarHotkeyRoute, type HotkeyDecisionInput, type HotkeyState } from "./hotkeys";

type TestAction = "home" | "projects" | "theme-toggle" | "github";

const shortcuts = [
  { sequence: ["g", "h"], action: "home" },
  { sequence: ["g", "p"], action: "projects" },
  { sequence: ["g", "t"], action: "theme-toggle" },
  { sequence: ["g", "g"], action: "github" },
] as const;
const repeatableActions = new Set<TestAction>(["home", "projects", "theme-toggle"]);

function state(overrides: Partial<HotkeyState<TestAction>> = {}): HotkeyState<TestAction> {
  return {
    isModalOpen: false,
    lastRepeatableAction: null,
    pendingSequence: [],
    ...overrides,
  };
}

function decide(
  input: Pick<HotkeyDecisionInput, "key"> & Partial<Omit<HotkeyDecisionInput, "key">>,
  currentState: HotkeyState<TestAction> = state(),
) {
  return getHotkeyDecision({
    input: {
      pathname: "/",
      ...input,
    },
    repeatableActions,
    shortcuts,
    state: currentState,
  });
}

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

  test("treats nested projects pages as the projects nav item", () => {
    expect(getNavbarHotkeyRoute("/projects/archive", "left")).toBe("/");
  });
});

describe("getHotkeyDecision", () => {
  test("returns route actions for navbar chords from explicit pathname context", () => {
    expect(decide({ key: "l", shiftKey: true, pathname: "/" })).toMatchObject({
      action: "projects",
      preventDefault: true,
    });
    expect(decide({ key: "h", shiftKey: true, pathname: "/project/quicklizard" })).toMatchObject({
      action: "home",
      preventDefault: true,
    });
  });

  test("claims Escape when the hotkeys UI or a pending chord has precedence", () => {
    expect(decide({ key: "Escape" }, state({ isModalOpen: true }))).toEqual({
      nextState: state(),
      preventDefault: true,
    });
    expect(decide({ key: "Escape" }, state({ pendingSequence: ["g"] }))).toEqual({
      nextState: state(),
      preventDefault: true,
    });
  });

  test("leaves Escape alone when hotkeys are idle", () => {
    expect(decide({ key: "Escape" })).toEqual({
      nextState: state(),
      preventDefault: false,
    });
  });

  test("tracks pending chords and emits matched actions", () => {
    const pending = decide({ key: "g" });

    expect(pending).toEqual({
      nextState: state({ pendingSequence: ["g"] }),
      preventDefault: true,
    });

    expect(decide({ key: "p" }, pending.nextState)).toEqual({
      action: "projects",
      nextState: state({ lastRepeatableAction: "projects" }),
      preventDefault: true,
    });
  });

  test("repeats the last repeatable action with period", () => {
    expect(decide({ key: "." }, state({ lastRepeatableAction: "projects" }))).toEqual({
      action: "projects",
      nextState: state({ lastRepeatableAction: "projects" }),
      preventDefault: true,
    });
  });

  test("ignores editable targets before interpreting shortcuts", () => {
    expect(decide({ isEditableTarget: true, key: "g" })).toEqual({
      nextState: state(),
      preventDefault: false,
    });
  });
});
