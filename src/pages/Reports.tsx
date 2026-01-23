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
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const reportTypes = [
  {
    id: "employees",
    title: "تقرير أداء الموظفين",
    description: "تحليل شامل لأداء كل موظف وإنجازاته الشهرية",
    icon: Users,
    color: "bg-primary/10 text-primary",
    stats: { label: "آخر تحديث", value: "اليوم" },
  },
  {
    id: "clients",
    title: "تقرير العملاء",
    description: "إحصائيات العملاء والاستثمارات والحالات المختلفة",
    icon: TrendingUp,
    color: "bg-success/10 text-success",
    stats: { label: "إجمالي العملاء", value: "186" },
  },
  {
    id: "profits",
    title: "تقرير الأرباح",
    description: "تفاصيل الأرباح المصروفة والمتوقعة لكل عميل",
    icon: BarChart3,
    color: "bg-secondary/10 text-secondary",
    stats: { label: "أرباح الشهر", value: "504K" },
  },
  {
    id: "commissions",
    title: "تقرير العمولات",
    description: "ملخص عمولات الموظفين المستحقة والمصروفة",
    icon: Wallet,
    color: "bg-warning/10 text-warning",
    stats: { label: "إجمالي العمولات", value: "210K" },
  },
  {
    id: "financial",
    title: "التقرير المالي الشامل",
    description: "نظرة عامة على جميع العمليات المالية والإحصائيات",
    icon: PieChart,
    color: "bg-destructive/10 text-destructive",
    stats: { label: "إجمالي الاستثمارات", value: "4.2M" },
  },
  {
    id: "monthly",
    title: "التقرير الشهري",
    description: "ملخص شامل لجميع الأنشطة خلال الشهر",
    icon: Calendar,
    color: "bg-accent/10 text-accent",
    stats: { label: "الشهر", value: "يناير 2024" },
  },
];

const recentReports = [
  { name: "تقرير أداء الموظفين - يناير 2024", date: "2024-02-01", type: "PDF", size: "2.4 MB" },
  { name: "تقرير العملاء - يناير 2024", date: "2024-02-01", type: "Excel", size: "1.8 MB" },
  { name: "التقرير المالي - ديسمبر 2023", date: "2024-01-02", type: "PDF", size: "3.1 MB" },
  { name: "تقرير العمولات - ديسمبر 2023", date: "2024-01-02", type: "Excel", size: "1.2 MB" },
];

export default function Reports() {
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
            <Select defaultValue="january-2024">
              <SelectTrigger className="w-48">
                <Calendar className="ml-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="january-2024">يناير 2024</SelectItem>
                <SelectItem value="december-2023">ديسمبر 2023</SelectItem>
                <SelectItem value="november-2023">نوفمبر 2023</SelectItem>
              </SelectContent>
            </Select>
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
                آخر التقارير التي تم إنشاؤها
              </p>
            </div>
            <Button variant="outline" size="sm">
              عرض الكل
            </Button>
          </div>
          <div className="space-y-4">
            {recentReports.map((report, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">{report.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {report.date} • {report.size}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-muted px-3 py-1 text-sm font-medium">
                    {report.type}
                  </span>
                  <Button variant="ghost" size="icon">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
