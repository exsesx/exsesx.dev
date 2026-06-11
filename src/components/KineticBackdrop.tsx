/*
 * Three ECG rows across the field, each mostly flatline with a heartbeat at
 * staggered positions — the background carries the site's pulse motif instead
 * of decorative streaks. preserveAspectRatio="none" stretches the rows to any
 * viewport while non-scaling strokes keep them hairline-thin.
 */
function SignalTraces() {
  return (
    <svg
      aria-hidden="true"
      className="signal-traces absolute inset-0 h-full w-full"
      viewBox="0 0 1440 900"
      preserveAspectRatio="none"
      fill="none"
    >
      <path
        d="M0 150H320l7-4 5 5 7-34 8 50 7-26 5 9h760l7-4 5 5 7-34 8 50 7-26 5 9H1440"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        opacity="0.55"
      />
      <path
        d="M0 480H810l7-4 5 5 7-34 8 50 7-26 5 9H1440"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        opacity="0.4"
      />
      <path
        d="M0 790H210l7-4 5 5 7-34 8 50 7-26 5 9h800l7-4 5 5 7-34 8 50 7-26 5 9H1440"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        opacity="0.5"
      />
    </svg>
  );
}

export default function KineticBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background">
      <div className="absolute inset-0 technical-grid" />
      <SignalTraces />
      <div className="page-top-fade absolute inset-x-0 top-0 h-52" />
      <div className="absolute inset-0 background-vignette" />
    </div>
  );
}
