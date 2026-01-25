import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Clock,
  Calendar,
  FileText,
  Wallet,
  AlertTriangle,
  UserCheck,
  UserX,
  CalendarClock,
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useEmployees } from "@/hooks/queries/useProfiles";
import { useAttendance } from "@/hooks/queries/useAttendance";
import { useLeaves } from "@/hooks/queries/useLeaves";
import { usePayroll } from "@/hooks/queries/usePayroll";

export default function HRDashboard() {
  const today = new Date().toISOString().split("T")[0];

  // Fetch data
  const { data: employees = [], isLoading: loadingEmployees } = useEmployees();
  const { data: allAttendance = [], isLoading: loadingAttendance } = useAttendance({
    startDate: today,
    endDate: today,
  });
  const { data: allLeaves = [], isLoading: loadingLeaves } = useLeaves();
  const { data: allPayroll = [], isLoading: loadingPayroll } = usePayroll();

  // Calculate stats
  const stats = useMemo(() => {
    const todayAttendance = allAttendance.filter((r) => r.date === today);
    const presentCount = todayAttendance.filter((r) => r.status === "present").length;
    const lateCount = todayAttendance.filter((r) => r.status === "late").length;
    const absentCount = todayAttendance.filter((r) => r.status === "absent").length;

    const pendingLeaves = allLeaves.filter((l) => l.status === "pending");
    const pendingPayroll = allPayroll.filter((p) => p.status === "draft" || p.status === "approved");
    const totalPendingSalaries = pendingPayroll.reduce(
      (acc, p) => acc + Number(p.total_salary),
      0
    );

    return {
      presentCount,
      lateCount,
      absentCount,
      pendingLeavesCount: pendingLeaves.length,
      pendingPayrollCount: pendingPayroll.length,
      totalPendingSalaries,
    };
  }, [allAttendance, allLeaves, allPayroll, today]);

  const hrModules = [
    {
      title: "ملفات الموظفين",
      description: "إدارة بيانات الموظفين والملفات الشخصية",
      icon: Users,
      href: "/hr/employees",
      color: "bg-primary/10 text-primary",
      stats: `${employees.length} موظف`,
    },
    {
      title: "الحضور والانصراف",
      description: "تسجيل ومتابعة الحضور والتأخير",
      icon: Clock,
      href: "/hr/attendance",
      color: "bg-success/10 text-success",
      stats: `${stats.presentCount} حاضر اليوم`,
    },
    {
      title: "الإجازات",
      description: "إدارة طلبات الإجازات والموافقات",
      icon: Calendar,
      href: "/hr/leaves",
      color: "bg-warning/10 text-warning",
      stats: `${stats.pendingLeavesCount} طلب معلق`,
    },
    {
      title: "العقود والمستندات",
      description: "رفع وإدارة مستندات الموظفين",
      icon: FileText,
      href: "/hr/documents",
      color: "bg-secondary/10 text-secondary",
      stats: "إدارة المستندات",
    },
    {
      title: "الرواتب",
      description: "كشوف المرتبات والعمولات",
      icon: Wallet,
      href: "/hr/payroll",
      color: "bg-accent/10 text-accent-foreground",
      stats: `${stats.pendingPayrollCount} كشف معلق`,
    },
    {
      title: "الجزاءات",
      description: "الإنذارات والخصومات والملاحظات",
      icon: AlertTriangle,
      href: "/hr/penalties",
      color: "bg-destructive/10 text-destructive",
      stats: "السجل الإداري",
    },
  ];

  const isLoading = loadingEmployees || loadingAttendance || loadingLeaves || loadingPayroll;

  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">إدارة الموارد البشرية</h1>
            <p className="text-muted-foreground mt-1">لوحة تحكم HR الشاملة</p>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="animate-slide-right">
          <h1 className="text-3xl font-bold text-foreground">إدارة الموارد البشرية</h1>
          <p className="text-muted-foreground mt-1">لوحة تحكم HR الشاملة</p>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4 animate-slide-up">
          <div className="rounded-xl border bg-card p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10 text-success">
                <UserCheck className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">الحضور اليوم</p>
                <p className="text-2xl font-bold text-success">{stats.presentCount}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10 text-warning">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">متأخرين</p>
                <p className="text-2xl font-bold text-warning">{stats.lateCount}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                <UserX className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">غائبين</p>
                <p className="text-2xl font-bold text-destructive">{stats.absentCount}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <CalendarClock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">طلبات إجازة</p>
                <p className="text-2xl font-bold">{stats.pendingLeavesCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* HR Modules Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 animate-fade-in">
          {hrModules.map((module) => (
            <Link
              key={module.href}
              to={module.href}
              className="group rounded-xl border bg-card p-6 shadow-card transition-all hover:shadow-lg hover:-translate-y-1"
            >
              <div className="flex items-start gap-4">
                <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${module.color}`}>
                  <module.icon className="h-7 w-7" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {module.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">{module.description}</p>
                  <Badge variant="secondary" className="mt-3">
                    {module.stats}
                  </Badge>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Pending Payroll Summary */}
        {stats.pendingPayrollCount > 0 && (
          <div className="rounded-xl border bg-gradient-to-br from-primary/5 to-primary/10 p-6 shadow-card animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">الرواتب المعلقة</h3>
                <p className="text-muted-foreground text-sm">
                  {stats.pendingPayrollCount} كشف راتب في انتظار الصرف
                </p>
              </div>
              <div className="text-left">
                <p className="text-sm text-muted-foreground">الإجمالي</p>
                <p className="text-3xl font-bold text-primary">
                  {stats.totalPendingSalaries.toLocaleString('ar-EG', {maximumFractionDigits: 0})} ج.م
                </p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Link to="/hr/payroll">
                <Button className="gradient-primary">
                  <Wallet className="ml-2 h-4 w-4" />
                  إدارة الرواتب
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
