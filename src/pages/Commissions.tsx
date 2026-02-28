import { useState, useMemo } from "react";
import {
  Wallet,
  TrendingUp,
  Calendar,
  Download,
  Filter,
  CheckCircle,
  Clock,
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useCommissions, useCommissionStats, useMarkCommissionAsPaid, useApproveCommission } from "@/hooks/queries/useCommissions";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const monthNames = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];

export default function Commissions() {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  // Fetch commissions for selected period
  const { data: commissions = [], isLoading: loadingCommissions } = useCommissions({
    periodMonth: selectedMonth,
    periodYear: selectedYear,
  });

  // Fetch commission statistics
  const { data: stats, isLoading: loadingStats } = useCommissionStats();

  // Mutations
  const markAsPaidMutation = useMarkCommissionAsPaid();
  const approveMutation = useApproveCommission();

  // Calculate stats for selected period
  const periodStats = useMemo(() => {
    const total = commissions.reduce((sum, c) => sum + Number(c.commission_amount), 0);
    const paid = commissions
      .filter(c => c.status === 'paid')
      .reduce((sum, c) => sum + Number(c.commission_amount), 0);
    const pending = commissions
      .filter(c => c.status === 'pending')
      .reduce((sum, c) => sum + Number(c.commission_amount), 0);

    const topPerformer = commissions.length > 0
      ? commissions.sort((a, b) => Number(b.commission_amount) - Number(a.commission_amount))[0]
      : null;

    return {
      totalCommissions: total,
      paidCommissions: paid,
      pendingCommissions: pending,
      topPerformer: topPerformer?.profiles?.full_name || "-",
      topPerformerAmount: topPerformer ? Number(topPerformer.commission_amount) : 0,
    };
  }, [commissions]);

  const paidPercentage = periodStats.totalCommissions > 0
    ? (periodStats.paidCommissions / periodStats.totalCommissions) * 100
    : 0;

  // Generate month options
  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: `${i + 1}-${selectedYear}`,
    label: `${monthNames[i]} ${selectedYear}`,
    month: i + 1,
    year: selectedYear,
  }));

  // Handle month change
  const handleMonthChange = (value: string) => {
    const [month, year] = value.split('-').map(Number);
    setSelectedMonth(month);
    setSelectedYear(year);
  };

  // Loading state
  if (loadingCommissions || loadingStats) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">العمولات</h1>
              <p className="text-muted-foreground mt-1">إدارة ومتابعة عمولات الموظفين الشهرية</p>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
          <Skeleton className="h-[400px] w-full" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between animate-slide-right">
          <div>
            <h1 className="text-3xl font-bold text-foreground">العمولات</h1>
            <p className="text-muted-foreground mt-1">
              إدارة ومتابعة عمولات الموظفين الشهرية
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={`${selectedMonth}-${selectedYear}`}
              onValueChange={handleMonthChange}
            >
              <SelectTrigger className="w-48">
                <Calendar className="ml-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" disabled>
              <Download className="ml-2 h-4 w-4" />
              تصدير التقرير
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 animate-slide-up">
          <div className="rounded-xl border bg-card p-6 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي العمولات</p>
                <p className="text-3xl font-bold mt-1">
                  {periodStats.totalCommissions.toLocaleString('ar-EG', {maximumFractionDigits: 0})}
                </p>
                <p className="text-sm text-muted-foreground">ج.م</p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Wallet className="h-7 w-7" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-6 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">تم صرفها</p>
                <p className="text-3xl font-bold mt-1 text-success">
                  {periodStats.paidCommissions.toLocaleString('ar-EG', {maximumFractionDigits: 0})}
                </p>
                <p className="text-sm text-muted-foreground">ج.م</p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-success/10 text-success">
                <CheckCircle className="h-7 w-7" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-6 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">في الانتظار</p>
                <p className="text-3xl font-bold mt-1 text-warning">
                  {periodStats.pendingCommissions.toLocaleString('ar-EG', {maximumFractionDigits: 0})}
                </p>
                <p className="text-sm text-muted-foreground">ج.م</p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-warning/10 text-warning">
                <Clock className="h-7 w-7" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-6 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">أعلى أداء</p>
                <p className="text-xl font-bold mt-1">
                  {periodStats.topPerformer}
                </p>
                <p className="text-sm text-success">
                  {periodStats.topPerformerAmount.toLocaleString('ar-EG', {maximumFractionDigits: 0})} ج.م
                </p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
                <TrendingUp className="h-7 w-7" />
              </div>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="rounded-xl border bg-card p-6 shadow-card animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">نسبة الصرف</h3>
              <p className="text-sm text-muted-foreground">
                تم صرف {paidPercentage.toFixed(0)}% من إجمالي العمولات
              </p>
            </div>
            <Badge variant="outline" className="text-lg font-bold">
              {paidPercentage.toFixed(0)}%
            </Badge>
          </div>
          <Progress value={paidPercentage} className="h-3" />
          <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
            <span>تم صرفها: {periodStats.paidCommissions.toLocaleString('ar-EG', {maximumFractionDigits: 0})} ج.م</span>
            <span>
              المتبقي: {periodStats.pendingCommissions.toLocaleString('ar-EG', {maximumFractionDigits: 0})} ج.م
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border bg-card shadow-card animate-slide-up">
          <div className="flex items-center justify-between border-b p-6">
            <div>
              <h3 className="text-lg font-semibold">تفاصيل العمولات</h3>
              <p className="text-sm text-muted-foreground">
                عمولات الموظفين لشهر {monthNames[selectedMonth - 1]} {selectedYear}
              </p>
            </div>
            <Button variant="outline" size="sm" disabled>
              <Filter className="ml-2 h-4 w-4" />
              تصفية
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">الموظف</TableHead>
                <TableHead className="text-right">الشهر</TableHead>
                <TableHead className="text-right">عدد العملاء</TableHead>
                <TableHead className="text-right">إجمالي الاستثمارات</TableHead>
                <TableHead className="text-right">نسبة العمولة</TableHead>
                <TableHead className="text-right">قيمة العمولة</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">تاريخ الصرف</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {commissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    لا توجد عمولات لهذه الفترة
                  </TableCell>
                </TableRow>
              ) : (
                commissions.map((commission) => (
                  <TableRow key={commission.id}>
                    <TableCell className="font-medium">
                      {commission.profiles?.full_name || commission.profiles?.email || "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {monthNames[commission.period_month - 1]} {commission.period_year}
                    </TableCell>
                    <TableCell>{commission.total_clients}</TableCell>
                    <TableCell>
                      {Number(commission.total_investments).toLocaleString('ar-EG', {maximumFractionDigits: 0})} ج.م
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{Number(commission.commission_rate).toFixed(1)}%</Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-success">
                      {Number(commission.commission_amount).toLocaleString('ar-EG', {maximumFractionDigits: 0})} ج.م
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          "font-medium",
                          commission.status === "paid"
                            ? "bg-success/10 text-success border-success/20"
                            : commission.status === "approved"
                            ? "bg-secondary/10 text-secondary border-secondary/20"
                            : "bg-warning/10 text-warning border-warning/20"
                        )}
                      >
                        {commission.status === "paid" ? (
                          <>
                            <CheckCircle className="ml-1 h-3 w-3" />
                            تم الصرف
                          </>
                        ) : commission.status === "approved" ? (
                          <>
                            <CheckCircle className="ml-1 h-3 w-3" />
                            معتمدة
                          </>
                        ) : (
                          <>
                            <Clock className="ml-1 h-3 w-3" />
                            في الانتظار
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {commission.paid_at
                        ? format(new Date(commission.paid_at), "yyyy-MM-dd", { locale: ar })
                        : "-"
                      }
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </MainLayout>
  );
}
