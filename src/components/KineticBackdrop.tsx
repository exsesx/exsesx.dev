/*
 * The fixed page backdrop: plain paper. Texture lives with the content, in
 * each page's ASCII field masthead, so nothing here paints or animates.
 */
export default function KineticBackdrop() {
  return <div className="kinetic-backdrop pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background" />;
}
