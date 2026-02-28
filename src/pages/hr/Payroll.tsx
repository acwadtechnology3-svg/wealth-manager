import { useMemo, useState } from "react";
import {
  Wallet,
  Search,
  Download,
  Filter,
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText,
  Check,
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import {
  usePayroll,
  useMarkPayrollAsPaid,
} from "@/hooks/queries/usePayroll";
import { useEmployees } from "@/hooks/queries/useProfiles";
import { toast } from "@/hooks/use-toast";

const statusLabels = {
  draft: "مسودة",
  approved: "معتمد",
  paid: "مصروف",
};

const formatMonth = (year: number, month: number) => {
  if (!year || !month) return "-";
  const padded = String(month).padStart(2, "0");
  return `${year}-${padded}`;
};

export default function Payroll() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const today = new Date();
  const [monthFilter, setMonthFilter] = useState(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`
  );

  const [filterYear, filterMonth] = monthFilter.split("-");
  const periodYear = Number(filterYear);
  const periodMonth = Number(filterMonth);

  const { data: employees = [] } = useEmployees();
  const {
    data: payrollRecords = [],
    isLoading,
    error,
    refetch,
  } = usePayroll({
    periodMonth: Number.isNaN(periodMonth) ? undefined : periodMonth,
    periodYear: Number.isNaN(periodYear) ? undefined : periodYear,
    status: statusFilter !== "all" ? (statusFilter as "draft" | "approved" | "paid") : undefined,
  });

  const employeeNameById = useMemo(() => {
    return new Map(
      employees.map((employee) => [
        employee.user_id,
        employee.full_name || employee.email || employee.user_id,
      ])
    );
  }, [employees]);

  const filteredRecords = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return payrollRecords.filter((record) => {
      const displayName =
        record.profiles?.full_name ||
        record.profiles?.email ||
        employeeNameById.get(record.employee_id) ||
        record.employee_id;
      return !normalizedQuery || displayName.toLowerCase().includes(normalizedQuery);
    });
  }, [employeeNameById, payrollRecords, searchQuery]);

  const totals = {
    baseSalary: filteredRecords.reduce((acc, r) => acc + Number(r.base_salary || 0), 0),
    commissions: filteredRecords.reduce((acc, r) => acc + Number(r.commission || 0), 0),
    bonuses: filteredRecords.reduce((acc, r) => acc + Number(r.bonuses || 0), 0),
    deductions: filteredRecords.reduce((acc, r) => acc + Number(r.deductions || 0), 0),
    netSalary: filteredRecords.reduce((acc, r) => acc + Number(r.total_salary || 0), 0),
  };

  const markAsPaid = useMarkPayrollAsPaid();

  const handleMarkAsPaid = (id: string) => {
    markAsPaid.mutate(id);
  };

  const handleExportPDF = () => {
    toast({
      title: "تم التصدير",
      description: "تم تصدير كشف الراتب بصيغة PDF",
    });
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div>
            <Skeleton className="h-8 w-40 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="grid gap-4 md:grid-cols-5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="rounded-xl border bg-card p-4 shadow-card">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-xl border bg-card shadow-card p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">حدث خطأ في تحميل سجلات الرواتب</h3>
            <p className="text-sm text-muted-foreground">{error.message}</p>
          </div>
          <Button onClick={() => refetch()} variant="outline">
            إعادة المحاولة
          </Button>
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
            <h1 className="text-3xl font-bold text-foreground">الرواتب</h1>
            <p className="text-muted-foreground mt-1">
              كشوف المرتبات والعمولات
            </p>
          </div>
          <Button variant="outline">
            <Download className="ml-2 h-4 w-4" />
            تصدير الكل
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-5 animate-slide-up">
          <div className="rounded-xl border bg-card p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Wallet className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">الرواتب الأساسية</p>
                <p className="text-lg font-bold">{totals.baseSalary.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">العمولات</p>
                <p className="text-lg font-bold text-success">{totals.commissions.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10 text-secondary-foreground">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">المكافآت</p>
                <p className="text-lg font-bold">{totals.bonuses.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                <TrendingDown className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">الخصومات</p>
                <p className="text-lg font-bold text-destructive">{totals.deductions.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-gradient-to-br from-primary/10 to-primary/5 p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Wallet className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">صافي الرواتب</p>
                <p className="text-lg font-bold text-primary">{totals.netSalary.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 animate-fade-in flex-wrap">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="بحث بالاسم..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
          <Input
            type="month"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="w-40"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <Filter className="ml-2 h-4 w-4" />
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="draft">مسودة</SelectItem>
              <SelectItem value="approved">معتمد</SelectItem>
              <SelectItem value="paid">مصروف</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-xl border bg-card shadow-card animate-slide-up overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">الموظف</TableHead>
                <TableHead className="text-right">الشهر</TableHead>
                <TableHead className="text-right">الراتب الأساسي</TableHead>
                <TableHead className="text-right">العمولات</TableHead>
                <TableHead className="text-right">المكافآت</TableHead>
                <TableHead className="text-right">الخصومات</TableHead>
                <TableHead className="text-right">صافي الراتب</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.map((record) => {
                const displayName =
                  record.profiles?.full_name ||
                  record.profiles?.email ||
                  employeeNameById.get(record.employee_id) ||
                  record.employee_id;
                return (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-primary/10 text-primary text-sm">
                            {displayName.split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{displayName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatMonth(record.period_year, record.period_month)}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {record.base_salary > 0 ? `${Number(record.base_salary).toLocaleString()} ج.م` : "-"}
                    </TableCell>
                    <TableCell className="text-success font-semibold">
                      {Number(record.commission || 0).toLocaleString()} ج.م
                    </TableCell>
                    <TableCell>
                      {record.bonuses > 0 ? (
                        <span className="text-secondary-foreground font-medium">
                          +{Number(record.bonuses).toLocaleString()} ج.م
                        </span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      {record.deductions > 0 ? (
                        <span className="text-destructive font-medium">
                          -{Number(record.deductions).toLocaleString()} ج.م
                        </span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="font-bold text-primary text-lg">
                      {Number(record.total_salary || 0).toLocaleString()} ج.م
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          "font-medium",
                          record.status === "paid"
                            ? "bg-success/10 text-success border-success/20"
                            : "bg-warning/10 text-warning border-warning/20"
                        )}
                      >
                        {statusLabels[record.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost" onClick={handleExportPDF}>
                          <FileText className="h-4 w-4" />
                        </Button>
                        {record.status !== "paid" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-success hover:text-success hover:bg-success/10"
                            onClick={() => handleMarkAsPaid(record.id)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </MainLayout>
  );
}
