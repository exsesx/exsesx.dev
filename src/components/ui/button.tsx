"use client";

import { Button as ButtonPrimitive } from "@base-ui/react/button";

import { buttonVariants, type ButtonSize, type ButtonVariant } from "./button-variants";
import { cn } from "@/lib/utils";

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <ButtonPrimitive data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button };
export type { ButtonSize, ButtonVariant };
