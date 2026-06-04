import { type SVGProps, useId, useSyncExternalStore } from "react";

const logoPath = "M84 84 168 96 256 334 344 96 428 84 298 430c-4 10-12 16-23 16h-38c-11 0-19-6-23-16Z";
const reducedMotionQuery = "(prefers-reduced-motion: reduce)";
const prideStripePeriods = ["first", "second"] as const;
const prideStripeBands = [
  { id: "pink", color: "#FF4FA3" },
  { id: "red", color: "#F43F3F" },
  { id: "orange", color: "#FF8A00" },
  { id: "yellow", color: "#FFE500" },
  { id: "green", color: "#31C95E" },
  { id: "cyan", color: "#16B8D8" },
  { id: "blue", color: "#3457FF" },
  { id: "violet", color: "#8E44FF" },
] as const;

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
  const clipPathId = `${useId().replace(/:/g, "")}-logo-pride-clip`;
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
        <clipPath id={clipPathId}>
          <path d={logoPath} />
        </clipPath>
      </defs>
      <path className="logo-mark-main" d={logoPath} fill="var(--logo-foreground, currentColor)" />
      <g className="logo-mark-pride" clipPath={`url(#${clipPathId})`}>
        <g>
          {prideStripePeriods.map((periodId, periodIndex) =>
            prideStripeBands.map((band, bandIndex) => (
              <rect
                key={`${periodId}-${band.id}`}
                x="0"
                y={periodIndex * 512 + bandIndex * 64}
                width="512"
                height="64"
                fill={band.color}
              />
            )),
          )}
          {shouldAnimatePride && (
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0 0;0 -512"
              dur="6.4s"
              calcMode="linear"
              repeatCount="indefinite"
            />
          )}
        </g>
      </g>
    </svg>
  );
}
