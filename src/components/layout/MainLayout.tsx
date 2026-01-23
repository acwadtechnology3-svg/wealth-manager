import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <Header sidebarCollapsed={sidebarCollapsed} />
      <main
        className={`transition-all duration-300 pt-16 ${
          sidebarCollapsed ? "mr-20" : "mr-64"
        }`}
      >
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
