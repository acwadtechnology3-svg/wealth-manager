import { useState } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import fisLogo from "@/assets/fis-logo.jpg";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
  requireAdmin?: boolean;
  requireHR?: boolean;
}

const navItems: NavItem[] = [
  { title: "لوحة التحكم", href: "/", icon: LayoutDashboard },
  { title: "الأدمن", href: "/admin", icon: Shield, requireAdmin: true },
  { title: "إدارة المستخدمين", href: "/admin/users", icon: UserCog, requireAdmin: true },
  { title: "مكالمات العملاء", href: "/admin/calls", icon: Phone },
  { title: "تارجت الموظفين", href: "/admin/targets", icon: Target, requireAdmin: true },
  { title: "شات الفريق", href: "/admin/team-chat", icon: MessageSquare, requireAdmin: true },
  { title: "الموظفين", href: "/employees", icon: Users },
  { title: "العملاء", href: "/clients", icon: UserCircle },
  { title: "العمولات", href: "/commissions", icon: Wallet },
  { title: "التقويم المالي", href: "/calendar", icon: Calendar },
  { title: "الموارد البشرية", href: "/hr", icon: Briefcase, requireHR: true },
  { title: "الشات", href: "/chat", icon: MessageSquare, badge: 3 },
  { title: "التقارير", href: "/reports", icon: FileText },
  { title: "الإعدادات", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut, isAdmin, isHR } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth/login");
  };

  const filteredNavItems = navItems.filter((item) => {
    if (item.requireAdmin && !isAdmin()) return false;
    if (item.requireHR && !isHR()) return false;
    return true;
  });

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
        {filteredNavItems.map((item) => {
          const isActive = location.pathname === item.href || 
            (item.href !== "/" && location.pathname.startsWith(item.href));
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
        })}
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
            <div className="flex-1 animate-fade-in">
              <p className="text-sm font-semibold text-sidebar-foreground">
                {profile ? `${profile.first_name} ${profile.last_name}` : "مستخدم"}
              </p>
              <p className="text-xs text-sidebar-foreground/70">
                {profile?.department === "admin" ? "الإدارة" : 
                 profile?.department === "hr" ? "الموارد البشرية" :
                 profile?.department === "tele_sales" ? "المبيعات" :
                 profile?.department === "finance" ? "المالية" : "الدعم الفني"}
              </p>
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