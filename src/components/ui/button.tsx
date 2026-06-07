"use client";

import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { triggerHaptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";
import { type ButtonSize, type ButtonVariant, buttonVariants } from "./button-variants";

function Button({
  className,
  disabled,
  onPointerDown,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & { variant?: ButtonVariant; size?: ButtonSize }) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled}
      onPointerDown={event => {
        if (!disabled && event.button === 0) {
          triggerHaptic("tap");
        }

        onPointerDown?.(event);
      }}
      {...props}
    />
  );
}

export type { ButtonSize, ButtonVariant };
export { Button };
