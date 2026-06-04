import { type SVGProps, useId, useSyncExternalStore } from "react";

const logoPath = "M84 84 168 96 256 334 344 96 428 84 298 430c-4 10-12 16-23 16h-38c-11 0-19-6-23-16Z";
const reducedMotionQuery = "(prefers-reduced-motion: reduce)";

function getLogoVariantSnapshot() {
  const isPrideSeason = document.documentElement.dataset.season === "pride";
  const reduceMotion = window.matchMedia(reducedMotionQuery).matches;

  return `${isPrideSeason ? "pride" : "regular"}:${reduceMotion ? "reduce" : "motion"}`;
}

function getServerLogoVariantSnapshot() {
  return "regular:motion";
}

function subscribeToLogoVariant(callback: () => void) {
  const mediaQuery = window.matchMedia(reducedMotionQuery);
  const seasonObserver = new MutationObserver(callback);

  mediaQuery.addEventListener("change", callback);
  seasonObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-season"],
  });

  return () => {
    seasonObserver.disconnect();
    mediaQuery.removeEventListener("change", callback);
  };
}

export default function LogoMark({ className, ...props }: SVGProps<SVGSVGElement>) {
  const gradientId = useId().replace(/:/g, "");
  const prideFlowId = `${gradientId}-logo-pride-flow`;
  const logoVariant = useSyncExternalStore(
    subscribeToLogoVariant,
    getLogoVariantSnapshot,
    getServerLogoVariantSnapshot,
  );
  const shouldAnimatePride = logoVariant === "pride:motion";

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 512 512"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <defs>
        <linearGradient
          id={prideFlowId}
          x1="0"
          y1="0"
          x2="0"
          y2="512"
          gradientUnits="userSpaceOnUse"
          spreadMethod="repeat"
        >
          <stop offset="0" stopColor="#FF4FA3" />
          <stop offset=".105" stopColor="#FF4FA3" />
          <stop offset=".125" stopColor="#F43F3F" />
          <stop offset=".23" stopColor="#F43F3F" />
          <stop offset=".25" stopColor="#FF8A00" />
          <stop offset=".355" stopColor="#FF8A00" />
          <stop offset=".375" stopColor="#FFE500" />
          <stop offset=".48" stopColor="#FFE500" />
          <stop offset=".5" stopColor="#31C95E" />
          <stop offset=".605" stopColor="#31C95E" />
          <stop offset=".625" stopColor="#16B8D8" />
          <stop offset=".73" stopColor="#16B8D8" />
          <stop offset=".75" stopColor="#3457FF" />
          <stop offset=".855" stopColor="#3457FF" />
          <stop offset=".875" stopColor="#8E44FF" />
          <stop offset=".98" stopColor="#8E44FF" />
          <stop offset="1" stopColor="#FF4FA3" />
          {shouldAnimatePride && (
            <animateTransform
              attributeName="gradientTransform"
              type="translate"
              values="0 0;0 -512"
              dur="6.4s"
              calcMode="linear"
              repeatCount="indefinite"
            />
          )}
        </linearGradient>
      </defs>
      <path className="logo-mark-main" d={logoPath} fill="var(--logo-foreground, currentColor)" />
      <path className="logo-mark-pride" d={logoPath} fill={`url(#${prideFlowId})`} />
    </svg>
  );
}
