import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import type * as React from "react";
import { cn } from "@/lib/utils";

const dropdownMenuItemClass =
  "dropdown-menu-item min-h-12 rounded-xl text-foreground transition-[background-color,color,transform] duration-150 ease-[var(--ease-weight)] outline-none select-none active:scale-[0.97] data-highlighted:bg-muted data-highlighted:text-foreground";
const dropdownMenuRadioItemClass =
  "dropdown-menu-radio-item grid cursor-pointer grid-cols-[1.25rem_1fr_1.25rem] items-center gap-3 px-3 text-left";

function DropdownMenu({ modal = false, ...props }: MenuPrimitive.Root.Props) {
  return <MenuPrimitive.Root data-slot="dropdown-menu-root" modal={modal} {...props} />;
}

function DropdownMenuTrigger({ ...props }: MenuPrimitive.Trigger.Props) {
  return <MenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props} />;
}

function DropdownMenuContent({
  align = "start",
  alignOffset = 0,
  side = "bottom",
  sideOffset = 8,
  className,
  ...props
}: MenuPrimitive.Popup.Props & Pick<MenuPrimitive.Positioner.Props, "align" | "alignOffset" | "side" | "sideOffset">) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        className="isolate z-50 outline-none"
        side={side}
        sideOffset={sideOffset}
      >
        <MenuPrimitive.Popup
          data-slot="dropdown-menu"
          className={cn(
            "dropdown-menu liquid-glass max-h-(--available-height) overflow-x-hidden overflow-y-auto rounded-2xl p-1.5 text-sm font-bold text-foreground shadow-menu outline-none",
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
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLinkItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
};
