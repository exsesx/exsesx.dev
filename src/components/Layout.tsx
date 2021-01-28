import { ReactNode } from "react";
import Header from "./Header";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="bg-white dark:bg-gray-800 h-full flex flex-col overflow-auto">
      <Header />
      {children}
    </div>
  );
}
