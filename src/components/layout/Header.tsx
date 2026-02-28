import { Bell, Search, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";

interface HeaderProps {
  sidebarCollapsed?: boolean;
}

const notifications = [
  {
    id: 1,
    title: "تأخر صرف أرباح",
    description: "العميل أحمد علي - متأخر 3 أيام",
    type: "warning",
    time: "منذ 5 دقائق",
  },
  {
    id: 2,
    title: "موعد سحب قادم",
    description: "العميل محمد سعيد - غداً",
    type: "info",
    time: "منذ ساعة",
  },
  {
    id: 3,
    title: "عميل جديد",
    description: "تم إضافة عميل جديد بواسطة سارة",
    type: "success",
    time: "منذ 3 ساعات",
  },
];

export function Header({ sidebarCollapsed }: HeaderProps) {
  const isMobile = useIsMobile();

  // Don't render on mobile
  if (isMobile) return null;

  return (
    <header
      className={`fixed top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card/80 backdrop-blur-md transition-all duration-300 ${
        sidebarCollapsed ? "right-20" : "right-64"
      } left-0 px-6`}
    >
      {/* Search */}
      <div className="relative w-96">
        <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="بحث في النظام..."
          className="pr-10 bg-muted/50 border-0 focus-visible:ring-1"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -left-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground animate-pulse-soft">
                3
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>التنبيهات</span>
              <Button variant="ghost" size="sm" className="text-xs">
                تحديد الكل كمقروء
              </Button>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="flex flex-col items-start gap-1 p-3 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      notification.type === "warning"
                        ? "bg-warning"
                        : notification.type === "success"
                        ? "bg-success"
                        : "bg-secondary"
                    }`}
                  />
                  <span className="font-medium">{notification.title}</span>
                </div>
                <p className="text-sm text-muted-foreground pr-4">
                  {notification.description}
                </p>
                <span className="text-xs text-muted-foreground pr-4">
                  {notification.time}
                </span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-center text-primary">
              عرض جميع التنبيهات
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Settings */}
        <Button variant="ghost" size="icon">
          <Settings className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
