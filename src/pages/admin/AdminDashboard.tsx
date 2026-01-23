import { useState } from "react";
import {
  Search,
  Users,
  UserCircle,
  Shield,
  Activity,
  Bell,
  Settings,
  FileText,
  TrendingUp,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { clientsFullData, adminNotifications, globalAuditLogs } from "@/data/adminMockData";
import { employees } from "@/data/hrMockData";

const statusConfig = {
  active: { label: "نشط", className: "bg-success/10 text-success border-success/20" },
  late: { label: "متأخر", className: "bg-destructive/10 text-destructive border-destructive/20" },
  suspended: { label: "موقوف", className: "bg-warning/10 text-warning border-warning/20" },
  inactive: { label: "غير نشط", className: "bg-muted text-muted-foreground" },
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<typeof clientsFullData>([]);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim().length >= 2) {
      const results = clientsFullData.filter(
        (client) =>
          client.name.includes(query) ||
          client.phone.includes(query) ||
          client.code.includes(query) ||
          client.deposits.some((d) => d.depositNumber.includes(query)) ||
          client.assignedEmployee.name.includes(query)
      );
      setSearchResults(results);
      setShowResults(true);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  };

  const unreadNotifications = adminNotifications.filter((n) => !n.isRead);
  const lateClients = clientsFullData.filter((c) => c.status === "late");
  const recentAuditLogs = globalAuditLogs
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  const adminModules = [
    {
      title: "إدارة المستخدمين",
      description: "إنشاء وإدارة حسابات المستخدمين",
      icon: Users,
      href: "/admin/users",
      color: "bg-primary/10 text-primary",
      stats: `${employees.length} مستخدم`,
    },
    {
      title: "الصلاحيات والأدوار",
      description: "إدارة المسميات الوظيفية والصلاحيات",
      icon: Shield,
      href: "/admin/roles",
      color: "bg-success/10 text-success",
      stats: "5 أدوار",
    },
    {
      title: "سجل العمليات",
      description: "متابعة جميع العمليات في النظام",
      icon: Activity,
      href: "/admin/audit-logs",
      color: "bg-warning/10 text-warning",
      stats: `${globalAuditLogs.length} عملية`,
    },
    {
      title: "التقارير الإدارية",
      description: "تقارير شاملة عن أداء النظام",
      icon: FileText,
      href: "/admin/reports",
      color: "bg-secondary/10 text-secondary-foreground",
      stats: "5 تقارير",
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between animate-slide-right">
          <div>
            <h1 className="text-3xl font-bold text-foreground">لوحة تحكم الأدمن</h1>
            <p className="text-muted-foreground mt-1">
              إدارة النظام والمستخدمين والصلاحيات
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="relative">
              <Bell className="h-4 w-4" />
              {unreadNotifications.length > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                  {unreadNotifications.length}
                </span>
              )}
            </Button>
            <Button variant="outline" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Global Search */}
        <Card className="animate-slide-up">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              البحث الشامل عن العملاء
            </CardTitle>
            <CardDescription>
              ابحث بالاسم، رقم الهاتف، كود العميل، رقم الإيداع، أو اسم الموظف
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="ابحث عن عميل..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pr-10 h-12 text-lg"
              />
              
              {/* Search Results Dropdown */}
              {showResults && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-card border rounded-lg shadow-lg z-50 max-h-96 overflow-auto">
                  {searchResults.map((client) => (
                    <div
                      key={client.id}
                      className="p-4 border-b last:border-b-0 hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => {
                        navigate(`/admin/client/${client.id}`);
                        setShowResults(false);
                        setSearchQuery("");
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <UserCircle className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{client.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {client.code} • {client.phone}
                            </p>
                          </div>
                        </div>
                        <div className="text-left">
                          <Badge className={statusConfig[client.status].className}>
                            {statusConfig[client.status].label}
                          </Badge>
                          <p className="text-sm text-muted-foreground mt-1">
                            {client.assignedEmployee.name}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {showResults && searchResults.length === 0 && searchQuery.length >= 2 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-card border rounded-lg shadow-lg z-50 p-4 text-center text-muted-foreground">
                  لا توجد نتائج للبحث
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-4 animate-slide-up">
          <Card className="shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <UserCircle className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي العملاء</p>
                  <p className="text-2xl font-bold">{clientsFullData.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي الاستثمارات</p>
                  <p className="text-2xl font-bold">
                    {clientsFullData.reduce((acc, c) => acc + c.totalInvestment, 0).toLocaleString()} ج.م
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">الموظفين النشطين</p>
                  <p className="text-2xl font-bold">
                    {employees.filter((e) => e.status === "active").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">عملاء متأخرين</p>
                  <p className="text-2xl font-bold">{lateClients.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Late Clients Alert */}
        {lateClients.length > 0 && (
          <div className="flex items-center gap-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4 animate-fade-in">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <p className="flex-1 text-sm">
              يوجد <span className="font-bold">{lateClients.length}</span> عملاء
              متأخرين عن موعد صرف الأرباح. يرجى المتابعة فوراً.
            </p>
            <Button variant="destructive" size="sm" onClick={() => navigate("/admin/client/" + lateClients[0]?.id)}>
              عرض المتأخرين
            </Button>
          </div>
        )}

        {/* Admin Modules Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 animate-slide-up">
          {adminModules.map((module) => (
            <Card
              key={module.title}
              className="cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02] group"
              onClick={() => navigate(module.href)}
            >
              <CardContent className="p-6">
                <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center mb-4", module.color)}>
                  <module.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                  {module.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-3">{module.description}</p>
                <Badge variant="secondary">{module.stats}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Audit Logs */}
          <Card className="animate-slide-up">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                آخر العمليات
              </CardTitle>
              <CardDescription>سجل آخر العمليات في النظام</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-4">
                  {recentAuditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30"
                    >
                      <div className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
                        log.action === "create" && "bg-success/10 text-success",
                        log.action === "update" && "bg-warning/10 text-warning",
                        log.action === "delete" && "bg-destructive/10 text-destructive",
                        log.action === "view" && "bg-primary/10 text-primary"
                      )}>
                        <Activity className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">
                          {log.action === "create" && "إنشاء"}
                          {log.action === "update" && "تعديل"}
                          {log.action === "delete" && "حذف"}
                          {log.action === "view" && "عرض"}
                          {" "}
                          {log.entityType === "client" && "عميل"}
                          {log.entityType === "employee" && "موظف"}
                          {log.entityType === "transaction" && "معاملة"}
                          {log.entityType === "system" && "إعدادات النظام"}
                        </p>
                        {log.field && (
                          <p className="text-xs text-muted-foreground">
                            {log.field}: {log.oldValue} ← {log.newValue}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {log.performedBy.name} • {new Date(log.timestamp).toLocaleDateString("ar-EG")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="animate-slide-up">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                التنبيهات
                {unreadNotifications.length > 0 && (
                  <Badge variant="destructive" className="mr-2">
                    {unreadNotifications.length} جديد
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>التنبيهات والإشعارات الهامة</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-3">
                  {adminNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        "p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors",
                        !notification.isRead && "bg-primary/5 border-primary/20"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {!notification.isRead && (
                          <span className="h-2 w-2 rounded-full bg-primary" />
                        )}
                        <p className="font-medium text-sm">{notification.title}</p>
                      </div>
                      <p className="text-sm text-muted-foreground">{notification.message}</p>
                      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(notification.createdAt).toLocaleDateString("ar-EG")}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
