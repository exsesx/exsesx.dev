"use client";

import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import { startTransition, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const dropdownMenuItemClass =
  "dropdown-menu-item min-h-12 rounded-xl text-foreground transition-[background-color,color,transform] duration-150 ease-[var(--ease-weight)] outline-none select-none active:scale-[0.97] data-highlighted:bg-muted data-highlighted:text-foreground data-disabled:cursor-not-allowed data-disabled:opacity-50";
const dropdownMenuRadioItemClass =
  "dropdown-menu-radio-item grid cursor-pointer grid-cols-[1.25rem_1fr_1.25rem] items-center gap-3 px-3 text-left";

function DropdownMenu({
  actionsRef: suppliedActionsRef,
  modal = false,
  onOpenChange,
  ...props
}: MenuPrimitive.Root.Props) {
  const localActionsRef = useRef<MenuPrimitive.Root.Actions>(null);
  const actionsRef = suppliedActionsRef ?? localActionsRef;
  const [uncontrolledOpen, setUncontrolledOpen] = useState(props.defaultOpen ?? false);
  const isOpen = props.open ?? uncontrolledOpen;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function closeOnDocumentScroll() {
      actionsRef.current?.close();
    }

    document.addEventListener("scroll", closeOnDocumentScroll, { passive: true });

    return () => document.removeEventListener("scroll", closeOnDocumentScroll);
  }, [actionsRef, isOpen]);

  return (
    <MenuPrimitive.Root
      data-slot="dropdown-menu-root"
      actionsRef={actionsRef}
      modal={modal}
      onOpenChange={(open, eventDetails) => {
        onOpenChange?.(open, eventDetails);

        if (!eventDetails.isCanceled) {
          setUncontrolledOpen(open);
        }
      }}
      {...props}
    />
  );
}

function DropdownMenuTrigger({ ...props }: MenuPrimitive.Trigger.Props) {
  return <MenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props} />;
}

// After load, past the hero's entrance and the audio warm-up.
const PREWARM_IDLE_TIMEOUT_MS = 2000;

/*
 * A menu's first open used to pay for rendering its popup (and the icons in
 * it) inside the press. Prewarmed, the popup renders once while the page is
 * idle, hidden, as an interruptible transition, and every open only reveals it.
 */
function usePrewarmedPopup(enabled: boolean) {
  const [warm, setWarm] = useState(false);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    function mount() {
      startTransition(() => setWarm(true));
    }

    if (typeof window.requestIdleCallback !== "function") {
      const timeout = window.setTimeout(mount, PREWARM_IDLE_TIMEOUT_MS);

      return () => window.clearTimeout(timeout);
    }

    const handle = window.requestIdleCallback(mount, { timeout: PREWARM_IDLE_TIMEOUT_MS });

    return () => window.cancelIdleCallback(handle);
  }, [enabled]);

  return enabled && warm;
}

function DropdownMenuContent({
  align = "start",
  alignOffset = 0,
  side = "bottom",
  sideOffset = 8,
  prewarm = false,
  className,
  ...props
}: MenuPrimitive.Popup.Props &
  Pick<MenuPrimitive.Positioner.Props, "align" | "alignOffset" | "side" | "sideOffset"> & {
    /** Render the closed popup on idle so the first open costs no more than the next. */
    prewarm?: boolean;
  }) {
  const keepMounted = usePrewarmedPopup(prewarm);

  return (
    <MenuPrimitive.Portal keepMounted={keepMounted}>
      <MenuPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        className="isolate z-50 outline-none"
        positionMethod="fixed"
        side={side}
        sideOffset={sideOffset}
      >
        <MenuPrimitive.Popup
          data-slot="dropdown-menu"
          className={cn(
            "dropdown-menu liquid-glass max-h-(--available-height) overflow-x-hidden overflow-y-auto overscroll-contain rounded-2xl p-1.5 text-sm font-bold text-foreground shadow-menu outline-none",
            className,
          )}
          {...props}
        />
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  );
}

function DropdownMenuGroup({ ...props }: MenuPrimitive.Group.Props) {
  return <MenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />;
}

function DropdownMenuLinkItem({ className, closeOnClick = true, ...props }: MenuPrimitive.LinkItem.Props) {
  return (
    <MenuPrimitive.LinkItem
      closeOnClick={closeOnClick}
      data-slot="dropdown-menu-item"
      className={cn(dropdownMenuItemClass, "flex items-center gap-2 px-3 py-3", className)}
      {...props}
    />
  );
}

function DropdownMenuItem({ className, closeOnClick = true, ...props }: MenuPrimitive.Item.Props) {
  return (
    <MenuPrimitive.Item
      closeOnClick={closeOnClick}
      data-slot="dropdown-menu-item"
      className={cn(dropdownMenuItemClass, "flex w-full cursor-pointer items-center gap-2 px-3 py-3 text-left")}
      {...props}
    />
  );
}

function DropdownMenuCheckboxItem({ className, closeOnClick = true, ...props }: MenuPrimitive.CheckboxItem.Props) {
  return (
    <MenuPrimitive.CheckboxItem
      closeOnClick={closeOnClick}
      data-slot="dropdown-menu-checkbox-item"
      className={cn(
        dropdownMenuItemClass,
        "flex w-full cursor-pointer items-center gap-2 px-3 py-3 text-left",
        className,
      )}
      {...props}
    />
  );
}

function DropdownMenuSeparator({ className, ...props }: MenuPrimitive.Separator.Props) {
  return (
    <MenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn("my-1 h-px bg-border/80", className)}
      {...props}
    />
  );
}

function DropdownMenuRadioGroup({ ...props }: MenuPrimitive.RadioGroup.Props) {
  return <MenuPrimitive.RadioGroup data-slot="dropdown-menu-radio-group" {...props} />;
}

function DropdownMenuRadioItem({ className, closeOnClick = true, ...props }: MenuPrimitive.RadioItem.Props) {
  return (
    <MenuPrimitive.RadioItem
      closeOnClick={closeOnClick}
      data-slot="dropdown-menu-item"
      className={cn(dropdownMenuItemClass, dropdownMenuRadioItemClass, className)}
      {...props}
    />
  );
}

export {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLinkItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
};
