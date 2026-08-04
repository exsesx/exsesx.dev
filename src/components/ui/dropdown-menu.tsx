import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import { cn } from "@/lib/utils";

const dropdownMenuItemClass =
  "dropdown-menu-item min-h-12 rounded-xl text-foreground transition-[background-color,color,transform] duration-150 ease-[var(--ease-weight)] outline-none select-none active:scale-[0.97] data-highlighted:bg-muted data-highlighted:text-foreground";
const dropdownMenuRadioItemClass =
  "dropdown-menu-radio-item grid cursor-pointer grid-cols-[1.25rem_1fr_1.25rem] items-center gap-3 px-3 text-left";

function DropdownMenu(props: Omit<MenuPrimitive.Root.Props, "modal">) {
  return <MenuPrimitive.Root {...props} data-slot="dropdown-menu-root" modal={false} />;
}

function DropdownMenuTrigger({ ...props }: MenuPrimitive.Trigger.Props) {
  return <MenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props} />;
}

function DropdownMenuContent({ className, ...props }: MenuPrimitive.Popup.Props) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Positioner align="end" className="isolate z-50 outline-none" sideOffset={8}>
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

function DropdownMenuLinkItem({ className, ...props }: Omit<MenuPrimitive.LinkItem.Props, "closeOnClick">) {
  return (
    <MenuPrimitive.LinkItem
      closeOnClick
      data-slot="dropdown-menu-item"
      className={cn(dropdownMenuItemClass, "flex items-center gap-2 px-3 py-3", className)}
      {...props}
    />
  );
}

function DropdownMenuItem({ closeOnClick = true, ...props }: Omit<MenuPrimitive.Item.Props, "className">) {
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

function DropdownMenuRadioItem(props: Omit<MenuPrimitive.RadioItem.Props, "className" | "closeOnClick">) {
  return (
    <MenuPrimitive.RadioItem
      closeOnClick
      data-slot="dropdown-menu-item"
      className={cn(dropdownMenuItemClass, dropdownMenuRadioItemClass, "w-full")}
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
