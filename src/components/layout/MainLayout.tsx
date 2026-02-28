import { useState } from "react";
import { Sidebar, MobileMenuTrigger } from "./Sidebar";
import { Header } from "./Header";
import { useIsMobile } from "@/hooks/use-mobile";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Menu Trigger */}
      {isMobile && (
        <MobileMenuTrigger onClick={() => setMobileMenuOpen(true)} />
      )}

      {/* Sidebar */}
      <Sidebar 
        isOpen={mobileMenuOpen} 
        onClose={() => setMobileMenuOpen(false)} 
      />

      {/* Header - hidden on mobile, shown on desktop */}
      {!isMobile && <Header sidebarCollapsed={sidebarCollapsed} />}

      {/* Main Content */}
      <main
        className={`transition-all duration-300 ${
          isMobile 
            ? "pt-16 px-4" 
            : `pt-16 ${sidebarCollapsed ? "mr-20" : "mr-64"}`
        }`}
      >
        <div className={isMobile ? "py-4" : "p-6"}>{children}</div>
      </main>
    </div>
  );
}
