import { useState } from "react";
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

const commissions = [
  {
    id: 1,
    employee: "سارة أحمد",
    month: "يناير 2024",
    clients: 12,
    totalInvestments: 450000,
    rate: 5,
    amount: 22500,
    status: "paid",
    paidDate: "2024-02-01",
  },
  {
    id: 2,
    employee: "خالد محمود",
    month: "يناير 2024",
    clients: 8,
    totalInvestments: 320000,
    rate: 4.5,
    amount: 14400,
    status: "paid",
    paidDate: "2024-02-01",
  },
  {
    id: 3,
    employee: "محمد علي",
    month: "يناير 2024",
    clients: 6,
    totalInvestments: 180000,
    rate: 5,
    amount: 9000,
    status: "pending",
    paidDate: null,
  },
  {
    id: 4,
    employee: "نورا حسين",
    month: "يناير 2024",
    clients: 5,
    totalInvestments: 150000,
    rate: 4,
    amount: 6000,
    status: "pending",
    paidDate: null,
  },
  {
    id: 5,
    employee: "عمر سعيد",
    month: "يناير 2024",
    clients: 4,
    totalInvestments: 100000,
    rate: 5.5,
    amount: 5500,
    status: "paid",
    paidDate: "2024-02-02",
  },
];

const monthlyStats = {
  totalCommissions: 57400,
  paidCommissions: 42400,
  pendingCommissions: 15000,
  topPerformer: "سارة أحمد",
};

export default function Commissions() {
  const [monthFilter, setMonthFilter] = useState("january-2024");

  const paidPercentage =
    (monthlyStats.paidCommissions / monthlyStats.totalCommissions) * 100;

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
            <Select value={monthFilter} onValueChange={setMonthFilter}>
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
            <Button variant="outline">
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
                  {monthlyStats.totalCommissions.toLocaleString()}
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
                  {monthlyStats.paidCommissions.toLocaleString()}
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
                  {monthlyStats.pendingCommissions.toLocaleString()}
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
                  {monthlyStats.topPerformer}
                </p>
                <p className="text-sm text-success">22,500 ج.م</p>
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
            <span>تم صرفها: {monthlyStats.paidCommissions.toLocaleString()} ج.م</span>
            <span>
              المتبقي: {monthlyStats.pendingCommissions.toLocaleString()} ج.م
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border bg-card shadow-card animate-slide-up">
          <div className="flex items-center justify-between border-b p-6">
            <div>
              <h3 className="text-lg font-semibold">تفاصيل العمولات</h3>
              <p className="text-sm text-muted-foreground">
                عمولات الموظفين لشهر يناير 2024
              </p>
            </div>
            <Button variant="outline" size="sm">
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
              {commissions.map((commission) => (
                <TableRow key={commission.id}>
                  <TableCell className="font-medium">
                    {commission.employee}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {commission.month}
                  </TableCell>
                  <TableCell>{commission.clients}</TableCell>
                  <TableCell>
                    {commission.totalInvestments.toLocaleString()} ج.م
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{commission.rate}%</Badge>
                  </TableCell>
                  <TableCell className="font-semibold text-success">
                    {commission.amount.toLocaleString()} ج.م
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={cn(
                        "font-medium",
                        commission.status === "paid"
                          ? "bg-success/10 text-success border-success/20"
                          : "bg-warning/10 text-warning border-warning/20"
                      )}
                    >
                      {commission.status === "paid" ? (
                        <>
                          <CheckCircle className="ml-1 h-3 w-3" />
                          تم الصرف
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
                    {commission.paidDate || "-"}
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
