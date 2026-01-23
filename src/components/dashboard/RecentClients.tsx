import { MoreHorizontal, TrendingUp, TrendingDown, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const clients = [
  {
    id: "C001",
    name: "أحمد علي محمد",
    employee: "سارة أحمد",
    investment: 150000,
    profit: 12,
    status: "active",
    nextWithdraw: "2024-02-15",
  },
  {
    id: "C002",
    name: "محمد سعيد عبدالله",
    employee: "خالد محمود",
    investment: 85000,
    profit: 10,
    status: "pending",
    nextWithdraw: "2024-02-10",
  },
  {
    id: "C003",
    name: "فاطمة حسن",
    employee: "سارة أحمد",
    investment: 200000,
    profit: 15,
    status: "late",
    nextWithdraw: "2024-01-20",
  },
  {
    id: "C004",
    name: "خالد عمر",
    employee: "محمد علي",
    investment: 50000,
    profit: 8,
    status: "active",
    nextWithdraw: "2024-02-25",
  },
  {
    id: "C005",
    name: "نورة سعد",
    employee: "خالد محمود",
    investment: 300000,
    profit: 18,
    status: "active",
    nextWithdraw: "2024-03-01",
  },
];

const statusConfig = {
  active: { label: "نشط", variant: "default" as const, className: "bg-success/10 text-success border-success/20" },
  pending: { label: "انتظار سحب", variant: "secondary" as const, className: "bg-warning/10 text-warning border-warning/20" },
  late: { label: "متأخر", variant: "destructive" as const, className: "bg-destructive/10 text-destructive border-destructive/20" },
};

export function RecentClients() {
  return (
    <div className="rounded-xl border bg-card shadow-card animate-slide-up">
      <div className="flex items-center justify-between border-b p-6">
        <div>
          <h3 className="text-lg font-semibold">العملاء الحاليين</h3>
          <p className="text-sm text-muted-foreground">
            آخر العملاء المضافين وحالاتهم
          </p>
        </div>
        <Button variant="outline" size="sm">
          عرض الكل
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-right">الكود</TableHead>
            <TableHead className="text-right">الاسم</TableHead>
            <TableHead className="text-right">الموظف المسؤول</TableHead>
            <TableHead className="text-right">الاستثمار</TableHead>
            <TableHead className="text-right">نسبة الربح</TableHead>
            <TableHead className="text-right">الحالة</TableHead>
            <TableHead className="text-right">موعد السحب</TableHead>
            <TableHead className="w-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => (
            <TableRow key={client.id} className="group">
              <TableCell className="font-mono text-sm">{client.id}</TableCell>
              <TableCell className="font-medium">{client.name}</TableCell>
              <TableCell className="text-muted-foreground">
                {client.employee}
              </TableCell>
              <TableCell className="font-semibold">
                {client.investment.toLocaleString()} ج.م
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4 text-success" />
                  <span className="text-success">{client.profit}%</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  variant={statusConfig[client.status as keyof typeof statusConfig].variant}
                  className={cn(
                    "font-medium",
                    statusConfig[client.status as keyof typeof statusConfig].className
                  )}
                >
                  {statusConfig[client.status as keyof typeof statusConfig].label}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {client.nextWithdraw}
                </div>
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
