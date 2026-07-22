import { describe, expect, test } from "bun:test";
import {
  BLOG_FOCUS_HOTKEY_ACTION,
  getHotkeyDecision,
  getNavbarHotkeyRoute,
  type HotkeyDecisionInput,
  type HotkeyState,
} from "./hotkeys";

type TestAction = "home" | "projects" | "blog" | "theme-toggle" | "github";

const shortcuts = [
  { sequence: ["g", "h"], action: "home" },
  { sequence: ["g", "p"], action: "projects" },
  { sequence: ["g", "b"], action: "blog" },
  { sequence: ["g", "t"], action: "theme-toggle" },
  { sequence: ["g", "g"], action: "github" },
] as const;
const repeatableActions = new Set<TestAction>(["home", "projects", "blog", "theme-toggle"]);

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
      isBlogFocusShortcutEnabled: true,
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

  test("moves right from projects to Blog", () => {
    expect(getNavbarHotkeyRoute("/projects", "right")).toBe("/blog/en");
  });

  test("wraps left from home to Blog", () => {
    expect(getNavbarHotkeyRoute("/", "left")).toBe("/blog/en");
  });

  test("wraps right from a localized Blog route to home", () => {
    expect(getNavbarHotkeyRoute("/blog/uk/codex-agents-v2", "right")).toBe("/");
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
    expect(decide({ key: "l", shiftKey: true, pathname: "/projects" })).toMatchObject({
      action: "blog",
      preventDefault: true,
    });
  });

  test("claims Escape when the hotkeys UI or a pending chord has precedence", () => {
    expect(decide({ isBlogFocusActive: true, key: "Escape" }, state({ isModalOpen: true }))).toEqual({
      nextState: state(),
      preventDefault: true,
    });
    expect(decide({ isBlogFocusActive: true, key: "Escape" }, state({ pendingSequence: ["g"] }))).toEqual({
      nextState: state(),
      preventDefault: true,
    });
  });

  test("exits Blog focus with Escape only after dialog and chord state are clear", () => {
    expect(decide({ isBlogFocusActive: true, key: "Escape" })).toEqual({
      action: BLOG_FOCUS_HOTKEY_ACTION,
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

  test("matches and repeats the Blog chord", () => {
    const pending = decide({ key: "g" });

    expect(decide({ key: "b" }, pending.nextState)).toEqual({
      action: "blog",
      nextState: state({ lastRepeatableAction: "blog" }),
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

  test("opens help globally with Command or Control plus slash", () => {
    expect(decide({ key: "/", metaKey: true, pathname: "/projects" })).toEqual({
      nextState: state({ isModalOpen: true }),
      preventDefault: true,
    });
    expect(decide({ ctrlKey: true, key: "/", pathname: "/blog/en" })).toEqual({
      nextState: state({ isModalOpen: true }),
      preventDefault: true,
    });
    expect(decide({ key: "?", metaKey: true, pathname: "/projects", shiftKey: true })).toEqual({
      nextState: state({ isModalOpen: true }),
      preventDefault: true,
    });
  });

  test("toggles Blog focus with Command or Control plus period on desktop article routes", () => {
    expect(decide({ key: ".", metaKey: true, pathname: "/blog/en/codex-agents-v2" })).toEqual({
      action: BLOG_FOCUS_HOTKEY_ACTION,
      nextState: state(),
      preventDefault: true,
    });
    expect(decide({ ctrlKey: true, key: ".", pathname: "/blog/uk/codex-agents-v2" })).toEqual({
      action: BLOG_FOCUS_HOTKEY_ACTION,
      nextState: state(),
      preventDefault: true,
    });
  });

  test("leaves the Blog focus shortcut alone when the desktop capability is unavailable", () => {
    expect(
      decide({
        isBlogFocusShortcutEnabled: false,
        key: ".",
        metaKey: true,
        pathname: "/blog/en/codex-agents-v2",
      }),
    ).toEqual({
      nextState: state(),
      preventDefault: false,
    });
  });

  test("leaves modified period alone outside Blog article routes", () => {
    expect(decide({ key: ".", metaKey: true, pathname: "/blog/en" })).toEqual({
      nextState: state(),
      preventDefault: false,
    });
    expect(decide({ ctrlKey: true, key: ".", pathname: "/projects" })).toEqual({
      nextState: state(),
      preventDefault: false,
    });
  });

  test("closes dialog and pending chord state while toggling Blog focus", () => {
    expect(
      decide(
        { key: ".", metaKey: true, pathname: "/blog/en/codex-agents-v2" },
        state({ isModalOpen: true, pendingSequence: ["g"] }),
      ),
    ).toEqual({
      action: BLOG_FOCUS_HOTKEY_ACTION,
      nextState: state(),
      preventDefault: true,
    });
  });

  test("ignores editable targets and already prevented events before interpreting shortcuts", () => {
    expect(decide({ isEditableTarget: true, key: ".", metaKey: true, pathname: "/blog/en/codex-agents-v2" })).toEqual({
      nextState: state(),
      preventDefault: false,
    });
    expect(decide({ defaultPrevented: true, key: "/", metaKey: true })).toEqual({
      nextState: state(),
      preventDefault: false,
    });
  });
});
