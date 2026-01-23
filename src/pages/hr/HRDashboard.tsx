import { Link } from "react-router-dom";
import {
  Users,
  Clock,
  Calendar,
  FileText,
  Wallet,
  AlertTriangle,
  TrendingUp,
  UserCheck,
  UserX,
  CalendarClock,
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { employees, attendanceRecords, leaveRequests, hrAlerts, payrollRecords } from "@/data/hrMockData";

const today = new Date().toISOString().split("T")[0];

export default function HRDashboard() {
  const todayAttendance = attendanceRecords.filter((r) => r.date === "2024-01-22");
  const presentCount = todayAttendance.filter((r) => r.status === "present").length;
  const lateCount = todayAttendance.filter((r) => r.status === "late").length;
  const absentCount = todayAttendance.filter((r) => r.status === "absent").length;
  
  const pendingLeaves = leaveRequests.filter((l) => l.status === "pending");
  const unreadAlerts = hrAlerts.filter((a) => !a.isRead);
  const pendingPayroll = payrollRecords.filter((p) => p.status === "pending");
  const totalPendingSalaries = pendingPayroll.reduce((acc, p) => acc + p.netSalary, 0);

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
      stats: `${presentCount} حاضر اليوم`,
    },
    {
      title: "الإجازات",
      description: "إدارة طلبات الإجازات والموافقات",
      icon: Calendar,
      href: "/hr/leaves",
      color: "bg-warning/10 text-warning",
      stats: `${pendingLeaves.length} طلب معلق`,
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
      stats: `${pendingPayroll.length} كشف معلق`,
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

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="animate-slide-right">
          <h1 className="text-3xl font-bold text-foreground">إدارة الموارد البشرية</h1>
          <p className="text-muted-foreground mt-1">
            لوحة تحكم HR الشاملة
          </p>
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
                <p className="text-2xl font-bold text-success">{presentCount}</p>
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
                <p className="text-2xl font-bold text-warning">{lateCount}</p>
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
                <p className="text-2xl font-bold text-destructive">{absentCount}</p>
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
                <p className="text-2xl font-bold">{pendingLeaves.length}</p>
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
                  <p className="text-sm text-muted-foreground mt-1">
                    {module.description}
                  </p>
                  <Badge variant="secondary" className="mt-3">
                    {module.stats}
                  </Badge>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Alerts Section */}
        {unreadAlerts.length > 0 && (
          <div className="rounded-xl border bg-card shadow-card animate-slide-up">
            <div className="border-b p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  تنبيهات HR
                  <Badge variant="destructive">{unreadAlerts.length}</Badge>
                </h3>
                <Button variant="ghost" size="sm">
                  عرض الكل
                </Button>
              </div>
            </div>
            <div className="divide-y">
              {unreadAlerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className="flex items-center gap-4 p-4 hover:bg-muted/50">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    alert.type === "late" ? "bg-warning/10 text-warning" :
                    alert.type === "absent" ? "bg-destructive/10 text-destructive" :
                    alert.type === "contract-expiry" ? "bg-primary/10 text-primary" :
                    "bg-success/10 text-success"
                  }`}>
                    {alert.type === "late" && <Clock className="h-5 w-5" />}
                    {alert.type === "absent" && <UserX className="h-5 w-5" />}
                    {alert.type === "contract-expiry" && <FileText className="h-5 w-5" />}
                    {alert.type === "leave-request" && <Calendar className="h-5 w-5" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{alert.employeeName}</p>
                    <p className="text-sm text-muted-foreground">{alert.message}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{alert.date}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pending Payroll Summary */}
        <div className="rounded-xl border bg-gradient-to-br from-primary/5 to-primary/10 p-6 shadow-card animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">الرواتب المعلقة</h3>
              <p className="text-muted-foreground text-sm">
                {pendingPayroll.length} كشف راتب في انتظار الصرف
              </p>
            </div>
            <div className="text-left">
              <p className="text-sm text-muted-foreground">الإجمالي</p>
              <p className="text-3xl font-bold text-primary">
                {totalPendingSalaries.toLocaleString()} ج.م
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
      </div>
    </MainLayout>
  );
}
