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

export function shouldEnableHotkeys(capabilities: HotkeyInputCapabilities) {
  return capabilities.hasHover || !capabilities.hasCoarsePointer;
}

export function getHotkeySequenceKey(action: string, key: string, index: number) {
  return `${action}-${index}-${key}`;
}

export function getHotkeySequenceOptions<TAction extends string>(
  shortcuts: readonly HotkeyShortcut<TAction>[],
  prefix: readonly string[],
) {
  return shortcuts
    .filter(shortcut => prefix.length < shortcut.sequence.length && isSequencePrefix(shortcut.sequence, prefix))
    .map(shortcut => ({
      key: shortcut.sequence[prefix.length],
      action: shortcut.action,
    }));
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

function isSameSequence(sequence: readonly string[], buffer: readonly string[]) {
  return sequence.length === buffer.length && isSequencePrefix(sequence, buffer);
}

function isSequencePrefix(sequence: readonly string[], buffer: readonly string[]) {
  return buffer.every((key, index) => sequence[index] === key);
}
