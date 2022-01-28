import { ReactNode } from "react";
import Header from "../components/Header";
import VersionTag from "../components/VersionTag";

interface LayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: LayoutProps) {
  return (
    <div className="bg-white dark:bg-gray-800 transition-colors duration-200 w-full h-full flex flex-col overflow-auto">
      <Header />
      {children}
      <VersionTag />
    </div>
  );
}
