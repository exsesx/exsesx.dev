"use client";

import { Drawer as DrawerPrimitive } from "@base-ui/react/drawer";
import type * as React from "react";

import { cn } from "@/lib/utils";

type DrawerProps = Omit<DrawerPrimitive.Root.Props, "modal" | "snapPoints" | "swipeDirection">;

function Drawer(props: DrawerProps) {
  return <DrawerPrimitive.Root {...props} data-slot="drawer" modal swipeDirection="down" />;
}

function DrawerTrigger(props: DrawerPrimitive.Trigger.Props) {
  return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />;
}

function DrawerClose(props: DrawerPrimitive.Close.Props) {
  return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />;
}

function DrawerContent({
  className,
  children,
  ...props
}: Omit<DrawerPrimitive.Popup.Props, "className"> & {
  className?: string;
}) {
  return (
    <DrawerPrimitive.Portal data-slot="drawer-portal">
      <DrawerPrimitive.Backdrop
        data-slot="drawer-overlay"
        className="dialog-backdrop fixed inset-0 z-[90] min-h-dvh opacity-[calc(1-var(--drawer-swipe-progress))] transition-opacity duration-450 ease-[var(--ease-drawer)] select-none data-ending-style:pointer-events-none data-ending-style:opacity-0 data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)] data-starting-style:opacity-0 data-swiping:duration-0 supports-[-webkit-touch-callout:none]:absolute"
      />
      <DrawerPrimitive.Viewport className="pointer-events-auto fixed inset-0 z-[90] select-none">
        <DrawerPrimitive.Popup
          data-slot="drawer-popup"
          className={cn(
            "group/drawer-popup pointer-events-auto fixed inset-x-0 bottom-0 z-[90] m-(--drawer-inset,0px) flex h-(--drawer-content-height) max-h-[calc(100dvh-6rem)] min-h-0 w-(--drawer-content-width,auto) origin-bottom transform-[translate3d(0,var(--drawer-swipe-movement-y),0)] flex-col rounded-t-[1.75rem] bg-background text-foreground shadow-panel ring-1 ring-foreground/10 transition-transform duration-450 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform outline-none select-none [--bleed:3rem] [--drawer-content-height:var(--drawer-height,auto)] [--closed-transform:translate3d(0,calc(100%+var(--drawer-inset,0px)+2px),0)] after:pointer-events-none after:absolute after:inset-x-0 after:top-full after:h-(--bleed) after:bg-(--drawer-bleed-background,var(--color-background)) data-ending-style:transform-(--closed-transform) data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)] data-starting-style:transform-(--closed-transform) data-swiping:duration-0",
            className,
          )}
          {...props}
        >
          <div
            data-slot="drawer-swipe-handle"
            aria-hidden="true"
            className="relative z-10 mx-auto my-3 h-1.5 w-12 shrink-0 cursor-grab rounded-full bg-muted-foreground/35 active:cursor-grabbing"
          />
          <DrawerPrimitive.Content className="flex min-h-0 flex-1 flex-col overflow-hidden overscroll-contain rounded-[inherit] select-text group-data-swiping/drawer-popup:select-none">
            {children}
          </DrawerPrimitive.Content>
        </DrawerPrimitive.Popup>
      </DrawerPrimitive.Viewport>
    </DrawerPrimitive.Portal>
  );
}

function DrawerHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-header"
      className={cn("flex shrink-0 flex-col gap-1.5 px-4 pt-2 pb-4 text-center sm:text-left", className)}
      {...props}
    />
  );
}

function DrawerTitle({
  className,
  ...props
}: Omit<DrawerPrimitive.Title.Props, "className"> & {
  className?: string;
}) {
  return (
    <DrawerPrimitive.Title
      data-slot="drawer-title"
      className={cn("text-lg leading-none font-semibold tracking-tight", className)}
      {...props}
    />
  );
}

function DrawerDescription({
  className,
  ...props
}: Omit<DrawerPrimitive.Description.Props, "className"> & {
  className?: string;
}) {
  return (
    <DrawerPrimitive.Description
      data-slot="drawer-description"
      className={cn("text-sm text-balance text-muted-foreground", className)}
      {...props}
    />
  );
}

export { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger };
