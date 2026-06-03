import dynamic from "next/dynamic";
import { type ComponentPropsWithoutRef, type ReactNode, useSyncExternalStore } from "react";

import { buttonVariants, type ButtonSize, type ButtonVariant } from "./ui/button";
import { cn } from "@/lib/utils";

const LiquidGlass = dynamic(() => import("liquid-glass-react"), {
  ssr: false,
});

type LiquidGlassLinkProps = ComponentPropsWithoutRef<"a"> & {
  children: ReactNode;
  label: string;
  size?: ButtonSize;
  variant?: ButtonVariant;
};

function supportsLiquidGlass() {
  if (typeof window === "undefined" || typeof CSS === "undefined") {
    return false;
  }

  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canBlur = CSS.supports("backdrop-filter", "blur(1px)") || CSS.supports("-webkit-backdrop-filter", "blur(1px)");

  return canHover && !reducedMotion && canBlur;
}

function subscribeToLiquidGlassSupport(callback: () => void) {
  const queries = [
    window.matchMedia("(hover: hover) and (pointer: fine)"),
    window.matchMedia("(prefers-reduced-motion: reduce)"),
  ];

  queries.forEach(query => query.addEventListener("change", callback));

  return () => queries.forEach(query => query.removeEventListener("change", callback));
}

function getServerLiquidGlassSupport() {
  return false;
}

export default function LiquidGlassLink({
  children,
  className,
  label,
  size = "lg",
  variant = "glass",
  ...props
}: LiquidGlassLinkProps) {
  const isEnhanced = useSyncExternalStore(
    subscribeToLiquidGlassSupport,
    supportsLiquidGlass,
    getServerLiquidGlassSupport,
  );

  return (
    <a
      aria-label={label}
      className={cn(buttonVariants({ variant, size }), "liquid-button", className)}
      data-enhanced={isEnhanced ? "true" : undefined}
      {...props}
    >
      <span className="liquid-button-label">{children}</span>
      {isEnhanced ? (
        <span aria-hidden="true" className="liquid-button-effect">
          <LiquidGlass
            aberrationIntensity={1.45}
            blurAmount={0.045}
            cornerRadius={999}
            displacementScale={42}
            elasticity={0.22}
            mode="standard"
            onClick={() => undefined}
            padding={size === "lg" ? "12px 20px" : "10px 16px"}
            saturation={155}
            style={{ position: "absolute", left: "50%", top: "50%" }}
          >
            <span className="liquid-button-ghost">{children}</span>
          </LiquidGlass>
        </span>
      ) : null}
    </a>
  );
}
