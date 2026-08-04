"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { cn } from "@/lib/utils";

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogTitle = DialogPrimitive.Title;
const DialogClose = DialogPrimitive.Close;

function DialogContent({
  className,
  ...props
}: Omit<DialogPrimitive.Popup.Props, "className"> & { className?: string }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Backdrop className="dialog-backdrop fixed inset-0 z-[90]" />
      <DialogPrimitive.Viewport className="fixed inset-0 z-[90] grid place-items-center overflow-y-auto p-4 sm:p-6">
        <DialogPrimitive.Popup data-slot="dialog-content" className={cn("w-full outline-none", className)} {...props} />
      </DialogPrimitive.Viewport>
    </DialogPrimitive.Portal>
  );
}

export { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger };
