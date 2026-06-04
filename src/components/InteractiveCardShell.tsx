"use client";

import { type ComponentProps, type PointerEvent, useEffect, useRef } from "react";
import { Card as UiCard } from "./ui/card";

export function InteractiveCardShell({ onPointerLeave, onPointerMove, ...props }: ComponentProps<typeof UiCard>) {
  const frameRef = useRef<number | null>(null);
  const pointerRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    pointerRef.current = {
      x: event.clientX,
      y: event.clientY,
    };

    if (frameRef.current === null) {
      const target = event.currentTarget;

      frameRef.current = window.requestAnimationFrame(() => {
        const bounds = target.getBoundingClientRect();

        target.style.setProperty("--pointer-x", `${pointerRef.current.x - bounds.left}px`);
        target.style.setProperty("--pointer-y", `${pointerRef.current.y - bounds.top}px`);
        frameRef.current = null;
      });
    }

    onPointerMove?.(event);
  }

  function handlePointerLeave(event: PointerEvent<HTMLDivElement>) {
    if (frameRef.current !== null) {
      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    event.currentTarget.style.setProperty("--pointer-x", "50%");
    event.currentTarget.style.setProperty("--pointer-y", "50%");
    onPointerLeave?.(event);
  }

  return <UiCard onPointerLeave={handlePointerLeave} onPointerMove={handlePointerMove} {...props} />;
}
