export default function KineticBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background">
      <div className="absolute inset-0 technical-grid" />
      <div className="absolute inset-0 circuit-traces" />
      <div className="page-top-fade absolute inset-x-0 top-0 h-52" />
      <div className="absolute inset-0 background-vignette" />
    </div>
  );
}
