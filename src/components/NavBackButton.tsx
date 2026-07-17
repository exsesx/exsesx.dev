"use client";

import { ArrowLeft } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useEffect, useEffectEvent } from "react";
import { MOTION_ATTRIBUTES } from "@/lib/motion-contract";
import { getBackNavigationIntent } from "@/lib/route-intent";
import { Button } from "./ui/button";

type NavBackButtonProps = {
  active: boolean;
};

function isEditableTarget(target: EventTarget | null) {
  return (
    target instanceof Element && target.closest("input, textarea, select, [contenteditable='true'], [role='textbox']")
  );
}

export default function NavBackButton({ active }: NavBackButtonProps) {
  const router = useRouter();

  function navigateBack() {
    const intent = getBackNavigationIntent();

    router.push(intent.href as Route, {
      scroll: intent.scroll,
      transitionTypes: intent.transitionTypes,
    });
  }

  const handleEscapeKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (event.defaultPrevented || event.key !== "Escape" || isEditableTarget(event.target)) {
      return;
    }

    event.preventDefault();
    navigateBack();
  });

  useEffect(() => {
    if (!active) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      handleEscapeKeyDown(event);
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [active]);

  return (
    <Button
      type="button"
      variant="glass"
      size="icon"
      aria-label="Back"
      aria-hidden={active ? undefined : "true"}
      disabled={!active}
      {...{ [MOTION_ATTRIBUTES.activeBackButton]: active ? "true" : "false" }}
      className="nav-back-button cursor-pointer"
      onClick={navigateBack}
    >
      <ArrowLeft strokeWidth={2.4} />
    </Button>
  );
}
