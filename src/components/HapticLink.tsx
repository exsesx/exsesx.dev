"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { type HapticKind, triggerHaptic } from "@/lib/haptics";

type HapticProps = {
  haptics?: HapticKind | false;
};

type HapticAnchorProps = ComponentProps<"a"> & HapticProps;
type HapticRouteLinkProps = ComponentProps<typeof Link> & HapticProps;

function handlePointerHaptic(button: number, haptics: HapticKind | false | undefined) {
  if (button === 0 && haptics !== false) {
    triggerHaptic(haptics ?? "tap");
  }
}

function HapticAnchor({ haptics, onPointerDown, ...props }: HapticAnchorProps) {
  return (
    <a
      onPointerDown={event => {
        handlePointerHaptic(event.button, haptics);
        onPointerDown?.(event);
      }}
      {...props}
    />
  );
}

function HapticRouteLink({ haptics, onPointerDown, ...props }: HapticRouteLinkProps) {
  return (
    <Link
      onPointerDown={event => {
        handlePointerHaptic(event.button, haptics);
        onPointerDown?.(event);
      }}
      {...props}
    />
  );
}

export { HapticAnchor, HapticRouteLink };
