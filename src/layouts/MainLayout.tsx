import { ReactNode } from "react";
import Header from "../components/Header";
import KineticBackdrop from "../components/KineticBackdrop";
import VersionTag from "../components/VersionTag";

interface LayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: LayoutProps) {
  return (
    <div className="relative min-h-full w-full overflow-x-hidden text-foreground transition-colors duration-300">
      <KineticBackdrop />
      <Header />
      {children}
      <VersionTag />
    </div>
  );
}
