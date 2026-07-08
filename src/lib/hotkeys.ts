import { getAdjacentPrimaryNavHref, type NavbarHotkeyDirection } from "./routes";

export interface HotkeyShortcut<TAction extends string = string> {
  sequence: readonly string[];
  action: TAction;
}

export type HotkeyPressResult<TAction extends string = string> =
  | { state: "idle" }
  | { state: "pending" }
  | { state: "matched"; action: TAction };

export interface HotkeyInputCapabilities {
  hasHover: boolean;
  hasCoarsePointer: boolean;
}

export type HotkeyRouteAction = "home" | "projects";

export type { NavbarHotkeyDirection };

export type HotkeyState<TAction extends string = string> = {
  isModalOpen: boolean;
  lastRepeatableAction: TAction | null;
  pendingSequence: string[];
};

export type HotkeyDecisionInput = {
  altKey?: boolean;
  ctrlKey?: boolean;
  defaultPrevented?: boolean;
  isEditableTarget?: boolean;
  key: string;
  metaKey?: boolean;
  pathname: string;
  shiftKey?: boolean;
};

export type HotkeyDecision<TAction extends string = string> = {
  action?: TAction;
  nextState: HotkeyState<TAction>;
  preventDefault: boolean;
};

type HotkeyDecisionOptions<TAction extends string> = {
  input: HotkeyDecisionInput;
  repeatableActions: ReadonlySet<TAction>;
  shortcuts: readonly HotkeyShortcut<TAction>[];
  state: HotkeyState<TAction>;
};

export function shouldEnableHotkeys(capabilities: HotkeyInputCapabilities) {
  return capabilities.hasHover || !capabilities.hasCoarsePointer;
}

export function getNavbarHotkeyRoute(pathname: string, direction: NavbarHotkeyDirection) {
  return getAdjacentPrimaryNavHref(pathname, direction);
}

export function getHotkeyDecision<TAction extends string>({
  input,
  repeatableActions,
  shortcuts,
  state,
}: HotkeyDecisionOptions<TAction>): HotkeyDecision<TAction> {
  if (input.defaultPrevented || input.isEditableTarget) {
    return keepState(state);
  }

  if (input.key === "Escape") {
    if (state.isModalOpen || state.pendingSequence.length > 0) {
      return {
        nextState: resetInteractionState(state),
        preventDefault: true,
      };
    }

    return keepState(state);
  }

  if (isHelpShortcut(input)) {
    return {
      nextState: {
        ...state,
        isModalOpen: !state.isModalOpen,
        pendingSequence: [],
      },
      preventDefault: true,
    };
  }

  if (input.metaKey || input.ctrlKey || input.altKey) {
    return keepState(state);
  }

  if (input.shiftKey) {
    const navbarDirection = getNavbarHotkeyDirection(input.key);

    if (navbarDirection) {
      return {
        action:
          getNavbarHotkeyRoute(input.pathname, navbarDirection) === "/" ? ("home" as TAction) : ("projects" as TAction),
        nextState: resetInteractionState(state),
        preventDefault: true,
      };
    }
  }

  const normalizedKey = normalizeSequenceKey(input.key);

  if (!normalizedKey) {
    return keepState(state);
  }

  if (normalizedKey === "." && state.pendingSequence.length === 0) {
    if (state.lastRepeatableAction === null) {
      return keepState(state);
    }

    return {
      action: state.lastRepeatableAction,
      nextState: resetInteractionState(state),
      preventDefault: true,
    };
  }

  const result = pressHotkeySequence(shortcuts, state.pendingSequence, normalizedKey);

  if (result.state === "idle") {
    return {
      nextState: {
        ...state,
        pendingSequence: [],
      },
      preventDefault: false,
    };
  }

  if (result.state === "pending") {
    return {
      nextState: {
        ...state,
        pendingSequence: result.sequence,
      },
      preventDefault: true,
    };
  }

  return {
    action: result.action,
    nextState: {
      ...resetInteractionState(state),
      lastRepeatableAction: repeatableActions.has(result.action) ? result.action : state.lastRepeatableAction,
    },
    preventDefault: true,
  };
}

export function getHotkeySequenceKey(action: string, key: string, index: number) {
  return `${action}-${index}-${key}`;
}

export function createHotkeySequencer<TAction extends string>(shortcuts: readonly HotkeyShortcut<TAction>[]) {
  let buffer: string[] = [];

  function reset(): HotkeyPressResult<TAction> {
    buffer = [];
    return { state: "idle" };
  }

  return {
    press(key: string): HotkeyPressResult<TAction> {
      buffer = [...buffer, key];

      const match = shortcuts.find(shortcut => isSameSequence(shortcut.sequence, buffer));

      if (match) {
        buffer = [];
        return { state: "matched", action: match.action };
      }

      const hasPotentialMatch = shortcuts.some(shortcut => isSequencePrefix(shortcut.sequence, buffer));

      if (hasPotentialMatch) {
        return { state: "pending" };
      }

      return reset();
    },

    reset,
  };
}

function keepState<TAction extends string>(state: HotkeyState<TAction>): HotkeyDecision<TAction> {
  return {
    nextState: state,
    preventDefault: false,
  };
}

function resetInteractionState<TAction extends string>(state: HotkeyState<TAction>) {
  return {
    ...state,
    isModalOpen: false,
    pendingSequence: [],
  };
}

function isHelpShortcut(input: HotkeyDecisionInput) {
  return input.metaKey && (input.key === "." || input.key === "?" || (input.key === "/" && input.shiftKey));
}

function normalizeSequenceKey(key: string) {
  return key.length === 1 ? key : undefined;
}

function getNavbarHotkeyDirection(key: string): NavbarHotkeyDirection | null {
  const normalizedKey = key.toLowerCase();

  if (normalizedKey === "h") {
    return "left";
  }

  if (normalizedKey === "l") {
    return "right";
  }

  return null;
}

function pressHotkeySequence<TAction extends string>(
  shortcuts: readonly HotkeyShortcut<TAction>[],
  pendingSequence: readonly string[],
  key: string,
): { state: "idle" } | { state: "pending"; sequence: string[] } | { state: "matched"; action: TAction } {
  const buffer = [...pendingSequence, key];
  const match = shortcuts.find(shortcut => isSameSequence(shortcut.sequence, buffer));

  if (match) {
    return { state: "matched", action: match.action };
  }

  const hasPotentialMatch = shortcuts.some(shortcut => isSequencePrefix(shortcut.sequence, buffer));

  if (hasPotentialMatch) {
    return { state: "pending", sequence: buffer };
  }

  return { state: "idle" };
}

function isSameSequence(sequence: readonly string[], buffer: readonly string[]) {
  return sequence.length === buffer.length && isSequencePrefix(sequence, buffer);
}

function isSequencePrefix(sequence: readonly string[], buffer: readonly string[]) {
  if (buffer.length > sequence.length) {
    return false;
  }

  return buffer.every((key, index) => sequence[index] === key);
}
