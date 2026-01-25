import { useMemo } from "react";
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  Users,
  Wallet,
  BarChart3,
  PieChart,
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardStats, useMonthlyPerformance } from "@/hooks/queries/useDashboard";
import { useCommissionStats } from "@/hooks/queries/useCommissions";

export default function Reports() {
  const { data: dashboardStats } = useDashboardStats();
  const { data: monthlyPerformance } = useMonthlyPerformance();
  const { data: commissionStats } = useCommissionStats();

  const monthLabel = useMemo(
    () => format(new Date(), "MMMM yyyy", { locale: ar }),
    []
  );
  const lastUpdatedLabel = useMemo(
    () => new Date().toLocaleDateString("ar-EG"),
    []
  );

  const reportTypes = useMemo(() => {
    const totalClients = dashboardStats?.totalClients ?? 0;
    const totalEmployees = dashboardStats?.totalEmployees ?? 0;
    const totalInvestments = dashboardStats?.totalInvestments ?? 0;
    const profitsPaid = monthlyPerformance?.profitsPaid ?? 0;
    const totalCommissionsPaid = commissionStats?.total_paid_amount ?? 0;

    return [
      {
        id: "employees",
        title: "تقرير أداء الموظفين",
        description: "تحليل شامل لأداء كل موظف وإنجازاته الشهرية",
        icon: Users,
        color: "bg-primary/10 text-primary",
        stats: { label: "آخر تحديث", value: lastUpdatedLabel },
        value: totalEmployees,
      },
      {
        id: "clients",
        title: "تقرير العملاء",
        description: "إحصائيات العملاء والاستثمارات والحالات المختلفة",
        icon: TrendingUp,
        color: "bg-success/10 text-success",
        stats: { label: "إجمالي العملاء", value: totalClients.toLocaleString("ar-EG") },
        value: totalClients,
      },
      {
        id: "profits",
        title: "تقرير الأرباح",
        description: "تفاصيل الأرباح المصروفة والمتوقعة لكل عميل",
        icon: BarChart3,
        color: "bg-secondary/10 text-secondary",
        stats: { label: "أرباح الشهر", value: profitsPaid.toLocaleString("ar-EG") },
        value: profitsPaid,
      },
      {
        id: "commissions",
        title: "تقرير العمولات",
        description: "ملخص عمولات الموظفين المستحقة والمصروفة",
        icon: Wallet,
        color: "bg-warning/10 text-warning",
        stats: { label: "إجمالي العمولات المصروفة", value: totalCommissionsPaid.toLocaleString("ar-EG") },
        value: totalCommissionsPaid,
      },
      {
        id: "financial",
        title: "التقرير المالي الشامل",
        description: "نظرة عامة على جميع العمليات المالية والإحصائيات",
        icon: PieChart,
        color: "bg-destructive/10 text-destructive",
        stats: { label: "إجمالي الاستثمارات", value: totalInvestments.toLocaleString("ar-EG") },
        value: totalInvestments,
      },
      {
        id: "monthly",
        title: "التقرير الشهري",
        description: "ملخص شامل لجميع الأنشطة خلال الشهر",
        icon: Calendar,
        color: "bg-accent/10 text-accent",
        stats: { label: "الشهر", value: monthLabel },
        value: monthLabel,
      },
    ];
  }, [commissionStats?.total_paid_amount, dashboardStats?.totalClients, dashboardStats?.totalEmployees, dashboardStats?.totalInvestments, lastUpdatedLabel, monthLabel, monthlyPerformance?.profitsPaid]);

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between animate-slide-right">
          <div>
            <h1 className="text-3xl font-bold text-foreground">التقارير</h1>
            <p className="text-muted-foreground mt-1">
              إنشاء وتصدير التقارير الإدارية والمالية
            </p>
          </div>
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{monthLabel}</span>
            </div>
          </div>
        </div>

        {/* Report Types Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 animate-slide-up">
          {reportTypes.map((report) => {
            const Icon = report.icon;
            return (
              <Card
                key={report.id}
                className="group cursor-pointer transition-all duration-300 hover:shadow-card-hover"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl ${report.color} transition-transform group-hover:scale-110`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs text-muted-foreground">{report.stats.label}</p>
                      <p className="font-semibold">{report.stats.value}</p>
                    </div>
                  </div>
                  <CardTitle className="mt-4">{report.title}</CardTitle>
                  <CardDescription>{report.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button className="flex-1 gradient-primary">
                      <FileText className="ml-2 h-4 w-4" />
                      PDF
                    </Button>
                    <Button variant="outline" className="flex-1">
                      <Download className="ml-2 h-4 w-4" />
                      Excel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Recent Reports */}
        <div className="rounded-xl border bg-card p-6 shadow-card animate-slide-up">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold">التقارير الأخيرة</h3>
              <p className="text-sm text-muted-foreground">
                سيتم عرض التقارير التي تم إنشاؤها هنا
              </p>
            </div>
          </div>
          <div className="text-center py-8 text-muted-foreground">
            لا توجد تقارير محفوظة حتى الآن
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
