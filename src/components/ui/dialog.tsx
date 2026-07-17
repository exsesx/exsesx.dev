"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { cn } from "@/lib/utils";

function Dialog(props: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="dialog-root" {...props} />;
}

function DialogTrigger(props: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogContent({
  backdropClassName,
  className,
  viewportClassName,
  ...props
}: Omit<DialogPrimitive.Popup.Props, "className"> & {
  backdropClassName?: string;
  className?: string;
  viewportClassName?: string;
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Backdrop
        data-slot="dialog-backdrop"
        className={cn("dialog-backdrop fixed inset-0 z-[90]", backdropClassName)}
      />
      <DialogPrimitive.Viewport
        data-slot="dialog-viewport"
        className={cn("fixed inset-0 z-[90] grid place-items-center overflow-y-auto p-4 sm:p-6", viewportClassName)}
      >
        <DialogPrimitive.Popup data-slot="dialog-content" className={cn("w-full outline-none", className)} {...props} />
      </DialogPrimitive.Viewport>
    </DialogPrimitive.Portal>
  );
}

function DialogTitle(props: DialogPrimitive.Title.Props) {
  return <DialogPrimitive.Title data-slot="dialog-title" {...props} />;
}

function DialogDescription(props: DialogPrimitive.Description.Props) {
  return <DialogPrimitive.Description data-slot="dialog-description" {...props} />;
}

function DialogClose(props: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

export { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger };
