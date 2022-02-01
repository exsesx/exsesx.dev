import { ReactNode } from "react";
import Header from "../components/Header";
import VersionTag from "../components/VersionTag";

interface LayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: LayoutProps) {
  return (
    <div className="bg-slate-50 dark:bg-neutral-800 transition-colors duration-200 w-full h-full flex flex-col overflow-auto">
      <Header />
      {children}
      <VersionTag />
    </div>
  );
}
