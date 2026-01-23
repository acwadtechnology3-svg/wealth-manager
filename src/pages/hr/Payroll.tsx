import { useState } from "react";
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
import { payrollRecords } from "@/data/hrMockData";
import { toast } from "@/hooks/use-toast";

export default function Payroll() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [monthFilter, setMonthFilter] = useState("2024-01");

  const filteredRecords = payrollRecords.filter((record) => {
    const matchesSearch = record.employeeName.includes(searchQuery);
    const matchesStatus = statusFilter === "all" || record.status === statusFilter;
    const matchesMonth = record.month === monthFilter;
    return matchesSearch && matchesStatus && matchesMonth;
  });

  const totals = {
    baseSalary: filteredRecords.reduce((acc, r) => acc + r.baseSalary, 0),
    commissions: filteredRecords.reduce((acc, r) => acc + r.commissions, 0),
    bonuses: filteredRecords.reduce((acc, r) => acc + r.bonuses, 0),
    deductions: filteredRecords.reduce((acc, r) => acc + r.deductions, 0),
    netSalary: filteredRecords.reduce((acc, r) => acc + r.netSalary, 0),
  };

  const handleMarkAsPaid = (id: string) => {
    toast({
      title: "تم تأكيد الصرف",
      description: "تم تسجيل صرف الراتب بنجاح",
    });
  };

  const handleExportPDF = (id: string) => {
    toast({
      title: "تم التصدير",
      description: "تم تصدير كشف الراتب بصيغة PDF",
    });
  };

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
              <SelectItem value="pending">معلق</SelectItem>
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
              {filteredRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {record.employeeName.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{record.employeeName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{record.month}</TableCell>
                  <TableCell className="font-semibold">
                    {record.baseSalary > 0 ? `${record.baseSalary.toLocaleString()} ج.م` : "-"}
                  </TableCell>
                  <TableCell className="text-success font-semibold">
                    {record.commissions.toLocaleString()} ج.م
                  </TableCell>
                  <TableCell>
                    {record.bonuses > 0 ? (
                      <span className="text-secondary-foreground font-medium">
                        +{record.bonuses.toLocaleString()} ج.م
                      </span>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    {record.deductions > 0 ? (
                      <span className="text-destructive font-medium">
                        -{record.deductions.toLocaleString()} ج.م
                      </span>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="font-bold text-primary text-lg">
                    {record.netSalary.toLocaleString()} ج.م
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
                      {record.status === "paid" ? "مصروف" : "معلق"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleExportPDF(record.id)}
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                      {record.status === "pending" && (
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
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </MainLayout>
  );
}
