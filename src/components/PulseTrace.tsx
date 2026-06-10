import { cn } from "@/lib/utils";

/*
 * The heartbeat behind "Software with a pulse": a single ECG trace that
 * continues the headline's baseline out of the final word. pathLength=100
 * lets the CSS draw-in animation use a fixed dashoffset sweep regardless of
 * the real path length (see .pulse-trace in globals.css).
 */
export default function PulseTrace({ className }: { className?: string }) {
  return (
    <svg className={cn("pulse-trace", className)} viewBox="0 0 240 72" aria-hidden="true" focusable="false">
      <path
        className="pulse-trace-path"
        pathLength={100}
        d="M4 60 H56 Q63 46 72 60 H86 L94 68 L106 8 L118 70 L126 44 L134 60 H156 Q166 42 178 60 H236"
      />
    </svg>
  );
}
