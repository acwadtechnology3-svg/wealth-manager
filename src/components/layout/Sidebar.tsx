import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  UserCircle,
  Wallet,
  Calendar,
  MessageSquare,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Briefcase,
  Shield,
  Phone,
  Target,
  UserCog,
  Menu,
  X,
  Key,
  CreditCard,
  CheckSquare,
  ListTodo,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import fisLogo from "@/assets/fis-logo.jpg";

import { usePermissions } from "@/hooks/usePermissions";
import { Badge } from "@/components/ui/badge";
import type { AppRole } from "@/types/database";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
  requireAdmin?: boolean;
  requireHR?: boolean;
  requiredPermissions?: string[];
  requiredRoles?: AppRole[];
}

const roleLabels: Record<string, string> = {
  super_admin: "سوبر أدمن",
  admin: "أدمن",
  hr_manager: "مدير HR",
  hr_officer: "موظف HR",
  tele_sales: "تيلي سيلز",
  accountant: "محاسب",
  support: "دعم فني",
};

const roleColors: Record<string, string> = {
  super_admin: "bg-red-500 text-white",
  admin: "bg-orange-500 text-white",
  hr_manager: "bg-blue-500 text-white",
  hr_officer: "bg-blue-400 text-white",
  tele_sales: "bg-green-500 text-white",
  accountant: "bg-purple-500 text-white",
  support: "bg-gray-500 text-white",
};

// Main navigation items
const mainNavItems: NavItem[] = [
  { title: "لوحة التحكم", href: "/", icon: LayoutDashboard, requiredPermissions: ["view_dashboard"] },
  { title: "مكالمات العملاء", href: "/admin/calls", icon: Phone, requiredPermissions: ["view_clients"] },
  {
    title: "أرقام الهواتف",
    href: "/admin/phone-numbers",
    icon: Phone,
    requiredRoles: ["super_admin", "admin", "tele_sales", "support"],
  },
  { title: "تارجت الموظفين", href: "/admin/targets", icon: Target, requireAdmin: true },
  { title: "شات الفريق", href: "/admin/team-chat", icon: MessageSquare, requireAdmin: true },
  { title: "الموظفين", href: "/employees", icon: Users, requiredPermissions: ["view_employees"] },
  { title: "العملاء", href: "/clients", icon: UserCircle, requiredPermissions: ["view_clients"] },
  { title: "العمولات", href: "/commissions", icon: Wallet, requiredPermissions: ["view_commissions"] },
  { title: "التقويم المالي", href: "/calendar", icon: Calendar, requiredPermissions: ["view_calendar"] },
  { title: "مهامي", href: "/my-tasks", icon: CheckSquare },
  { title: "الموارد البشرية", href: "/hr", icon: Briefcase, requireHR: true, requiredPermissions: ["view_hr"] },
  { title: "الشات", href: "/chat", icon: MessageSquare, badge: 3, requiredPermissions: ["view_chat"] },
  { title: "التقارير", href: "/reports", icon: FileText, requiredPermissions: ["view_reports"] },
  { title: "الإعدادات", href: "/settings", icon: Settings, requiredPermissions: ["view_settings"] },
];

// Admin section items (shown at bottom)
const adminNavItems: NavItem[] = [
  { title: "الأدمن", href: "/admin", icon: Shield, requireAdmin: true },
  { title: "إدارة المستخدمين", href: "/admin/users", icon: UserCog, requireAdmin: true },
  { title: "إدارة الصلاحيات", href: "/admin/permissions", icon: Key, requireAdmin: true },
  { title: "إدارة المهام", href: "/admin/tasks", icon: ListTodo, requireAdmin: true },
  { title: "طرق الدفع", href: "/admin/payment-methods", icon: CreditCard, requireAdmin: true },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut, isAdmin, isHR, roles } = useAuth();
  const { hasAnyPermission } = usePermissions();
  const isMobile = useIsMobile();
  const prevPathRef = useRef(location.pathname);

  // Close sidebar only when route actually changes on mobile
  useEffect(() => {
    if (isMobile && onClose && prevPathRef.current !== location.pathname) {
      onClose();
    }
    prevPathRef.current = location.pathname;
  }, [location.pathname, isMobile, onClose]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth/login");
  };

  const filterItems = (items: NavItem[]) => items.filter((item) => {
    // Admin-only items
    if (item.requireAdmin && !isAdmin()) return false;
    // HR-only items
    if (item.requireHR && !isHR()) return false;
    // Role-based items
    if (item.requiredRoles && item.requiredRoles.length > 0) {
      const hasRequiredRole = item.requiredRoles.some((role) => roles.includes(role));
      if (!hasRequiredRole) return false;
    }
    // Permission-based items (admins bypass this check)
    if (item.requiredPermissions && !isAdmin()) {
      if (!hasAnyPermission(item.requiredPermissions)) return false;
    }
    return true;
  });

  const filteredMainItems = filterItems(mainNavItems);
  const filteredAdminItems = filterItems(adminNavItems);

  const renderNavItem = (item: NavItem, collapsed: boolean = false) => {
    const isActive = location.pathname === item.href;
    return (
      <Link
        key={item.href}
        to={item.href}
        className={cn(
          "flex items-center gap-3 rounded-lg px-4 py-2.5 transition-all duration-200",
          "hover:bg-sidebar-accent group",
          isActive
            ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
            : "text-sidebar-foreground/80 hover:text-sidebar-foreground"
        )}
      >
        <item.icon
          className={cn(
            "h-5 w-5 shrink-0 transition-transform duration-200",
            "group-hover:scale-110"
          )}
        />
        {!collapsed && (
          <span className="flex-1 text-sm font-medium">{item.title}</span>
        )}
        {!collapsed && item.badge && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground">
            {item.badge}
          </span>
        )}
      </Link>
    );
  };

  // Mobile overlay sidebar
  if (isMobile) {
    return (
      <>
        {/* Overlay backdrop */}
        {isOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={onClose}
          />
        )}

        {/* Mobile sidebar */}
        <aside
          className={cn(
            "fixed right-0 top-0 z-50 h-screen w-72 transition-transform duration-300 ease-in-out",
            "bg-sidebar border-l border-sidebar-border",
            isOpen ? "translate-x-0" : "translate-x-full"
          )}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute left-4 top-4 rounded-lg p-2 text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Logo Section */}
          <div className="flex h-20 items-center justify-center border-b border-sidebar-border px-4">
            <Link to="/" className="flex items-center gap-3">
              <img
                src={fisLogo}
                alt="FiS Logo"
                className="h-12 w-12 rounded-lg"
              />
              <div>
                <h1 className="text-lg font-bold text-sidebar-foreground">
                  FiS Management
                </h1>
                <p className="text-xs text-sidebar-foreground/70">
                  نظام إدارة الاستثمارات
                </p>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4 max-h-[calc(100vh-200px)] overflow-y-auto">
            {filteredMainItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-4 py-2.5 transition-all duration-200",
                    "hover:bg-sidebar-accent group",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                      : "text-sidebar-foreground/80 hover:text-sidebar-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span className="flex-1 text-sm font-medium">{item.title}</span>
                  {item.badge && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
            
            {/* Admin Section */}
            {filteredAdminItems.length > 0 && (
              <div className="pt-4 mt-4 border-t border-sidebar-border">
                {filteredAdminItems.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-4 py-2.5 transition-all duration-200",
                        "hover:bg-sidebar-accent group",
                        isActive
                          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                          : "text-sidebar-foreground/80 hover:text-sidebar-foreground"
                      )}
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      <span className="flex-1 text-sm font-medium">{item.title}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </nav>

          {/* User Section */}
          <div className="absolute bottom-0 left-0 right-0 border-t border-sidebar-border p-4 bg-sidebar">
            <div className="flex items-center gap-3 rounded-lg px-3 py-2">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground">
                <UserCircle className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-sidebar-foreground truncate">
                  {profile ? `${profile.first_name} ${profile.last_name}` : "مستخدم"}
                </p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {roles && roles.length > 0 ? (
                    roles.slice(0, 2).map((role) => (
                      <Badge 
                        key={role} 
                        className={cn("text-[10px] px-1.5 py-0", roleColors[role] || "bg-gray-500 text-white")}
                      >
                        {roleLabels[role] || role}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-sidebar-foreground/70">
                      {profile?.department === "admin" ? "الإدارة" : 
                       profile?.department === "hr" ? "الموارد البشرية" :
                       profile?.department === "tele_sales" ? "المبيعات" :
                       profile?.department === "finance" ? "المالية" : "الدعم الفني"}
                    </span>
                  )}
                </div>
              </div>
              <button 
                onClick={handleSignOut}
                className="rounded-lg p-2 text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </aside>
      </>
    );
  }

  // Desktop sidebar
  return (
    <aside
      className={cn(
        "fixed right-0 top-0 z-40 h-screen transition-all duration-300",
        "bg-sidebar border-l border-sidebar-border",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo Section */}
      <div className="flex h-20 items-center justify-center border-b border-sidebar-border px-4">
        <Link to="/" className="flex items-center gap-3">
          <img
            src={fisLogo}
            alt="FiS Logo"
            className={cn(
              "rounded-lg transition-all duration-300",
              collapsed ? "h-10 w-10" : "h-12 w-12"
            )}
          />
          {!collapsed && (
            <div className="animate-fade-in">
              <h1 className="text-lg font-bold text-sidebar-foreground">
                FiS Management
              </h1>
              <p className="text-xs text-sidebar-foreground/70">
                نظام إدارة الاستثمارات
              </p>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4 max-h-[calc(100vh-200px)] overflow-y-auto">
        {filteredMainItems.map((item) => renderNavItem(item, collapsed))}
        
        {/* Admin Section */}
        {filteredAdminItems.length > 0 && (
          <div className="pt-4 mt-4 border-t border-sidebar-border">
            {filteredAdminItems.map((item) => renderNavItem(item, collapsed))}
          </div>
        )}
      </nav>

      {/* Collapse Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={cn(
          "absolute -left-3 top-24 flex h-6 w-6 items-center justify-center",
          "rounded-full bg-sidebar-primary text-sidebar-primary-foreground",
          "shadow-lg transition-transform duration-200 hover:scale-110"
        )}
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </button>

      {/* User Section */}
      <div className="border-t border-sidebar-border p-4">
        <div
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2",
            collapsed && "justify-center"
          )}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground">
            <UserCircle className="h-6 w-6" />
          </div>
          {!collapsed && (
            <div className="flex-1 animate-fade-in min-w-0">
              <p className="text-sm font-semibold text-sidebar-foreground truncate">
                {profile ? `${profile.first_name} ${profile.last_name}` : "مستخدم"}
              </p>
              <div className="flex flex-wrap gap-1 mt-1">
                {roles && roles.length > 0 ? (
                  roles.slice(0, 2).map((role) => (
                    <Badge 
                      key={role} 
                      className={cn("text-[10px] px-1.5 py-0", roleColors[role] || "bg-gray-500 text-white")}
                    >
                      {roleLabels[role] || role}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-sidebar-foreground/70">
                    {profile?.department === "admin" ? "الإدارة" : 
                     profile?.department === "hr" ? "الموارد البشرية" :
                     profile?.department === "tele_sales" ? "المبيعات" :
                     profile?.department === "finance" ? "المالية" : "الدعم الفني"}
                  </span>
                )}
              </div>
            </div>
          )}
          {!collapsed && (
            <button 
              onClick={handleSignOut}
              className="rounded-lg p-2 text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}

// Mobile menu trigger button component
export function MobileMenuTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed right-4 top-4 z-30 flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg md:hidden"
    >
      <Menu className="h-5 w-5" />
    </button>
  );
}
