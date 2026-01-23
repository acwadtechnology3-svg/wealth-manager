import { useState } from "react";
import {
  Plus,
  Search,
  MoreHorizontal,
  UserCircle,
  TrendingUp,
  Clock,
  AlertTriangle,
  Edit,
  Trash2,
  Eye,
  Filter,
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const clients = [
  {
    id: "C001",
    name: "أحمد علي محمد",
    email: "ahmed@email.com",
    phone: "01012345678",
    employee: "سارة أحمد",
    investment: 150000,
    profitRate: 12,
    startDate: "2023-06-15",
    nextWithdraw: "2024-02-15",
    status: "active",
  },
  {
    id: "C002",
    name: "محمد سعيد عبدالله",
    email: "mohamed@email.com",
    phone: "01112345678",
    employee: "خالد محمود",
    investment: 85000,
    profitRate: 10,
    startDate: "2023-08-20",
    nextWithdraw: "2024-02-10",
    status: "pending",
  },
  {
    id: "C003",
    name: "فاطمة حسن إبراهيم",
    email: "fatma@email.com",
    phone: "01212345678",
    employee: "سارة أحمد",
    investment: 200000,
    profitRate: 15,
    startDate: "2023-04-10",
    nextWithdraw: "2024-01-20",
    status: "late",
  },
  {
    id: "C004",
    name: "خالد عمر عبدالرحمن",
    email: "khaled@email.com",
    phone: "01512345678",
    employee: "محمد علي",
    investment: 50000,
    profitRate: 8,
    startDate: "2023-11-01",
    nextWithdraw: "2024-02-25",
    status: "active",
  },
  {
    id: "C005",
    name: "نورة سعد الدين",
    email: "noura@email.com",
    phone: "01012345679",
    employee: "خالد محمود",
    investment: 300000,
    profitRate: 18,
    startDate: "2023-03-05",
    nextWithdraw: "2024-03-01",
    status: "active",
  },
  {
    id: "C006",
    name: "يوسف أحمد عمر",
    email: "yousef@email.com",
    phone: "01112345679",
    employee: "نورا حسين",
    investment: 120000,
    profitRate: 11,
    startDate: "2023-07-22",
    nextWithdraw: "2024-02-08",
    status: "pending",
  },
];

const statusConfig = {
  active: {
    label: "نشط",
    className: "bg-success/10 text-success border-success/20",
    icon: TrendingUp,
  },
  pending: {
    label: "انتظار سحب",
    className: "bg-warning/10 text-warning border-warning/20",
    icon: Clock,
  },
  late: {
    label: "متأخر",
    className: "bg-destructive/10 text-destructive border-destructive/20",
    icon: AlertTriangle,
  },
};

export default function Clients() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.name.includes(searchQuery) ||
      client.id.includes(searchQuery) ||
      client.employee.includes(searchQuery);
    const matchesStatus =
      statusFilter === "all" || client.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const lateClientsCount = clients.filter((c) => c.status === "late").length;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between animate-slide-right">
          <div>
            <h1 className="text-3xl font-bold text-foreground">العملاء</h1>
            <p className="text-muted-foreground mt-1">
              إدارة العملاء المستثمرين ومتابعة استثماراتهم
            </p>
          </div>
          <Button className="gradient-primary">
            <Plus className="ml-2 h-4 w-4" />
            إضافة عميل
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4 animate-slide-up">
          <div className="rounded-xl border bg-card p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <UserCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">إجمالي العملاء</p>
                <p className="text-2xl font-bold">{clients.length}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">العملاء النشطين</p>
                <p className="text-2xl font-bold">
                  {clients.filter((c) => c.status === "active").length}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10 text-warning">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">انتظار سحب</p>
                <p className="text-2xl font-bold">
                  {clients.filter((c) => c.status === "pending").length}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">متأخرين</p>
                <p className="text-2xl font-bold">{lateClientsCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Late Clients Alert */}
        {lateClientsCount > 0 && (
          <div className="flex items-center gap-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4 animate-fade-in">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <p className="flex-1 text-sm">
              يوجد <span className="font-bold">{lateClientsCount}</span> عملاء
              متأخرين عن موعد صرف الأرباح. يرجى المتابعة فوراً.
            </p>
            <Button variant="destructive" size="sm">
              عرض المتأخرين
            </Button>
          </div>
        )}

        {/* Search and Filters */}
        <div className="flex items-center gap-4 animate-fade-in">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="بحث بالاسم أو الكود أو الموظف..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <Filter className="ml-2 h-4 w-4" />
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              <SelectItem value="active">نشط</SelectItem>
              <SelectItem value="pending">انتظار سحب</SelectItem>
              <SelectItem value="late">متأخر</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">تصدير</Button>
        </div>

        {/* Table */}
        <div className="rounded-xl border bg-card shadow-card animate-slide-up">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">الكود</TableHead>
                <TableHead className="text-right">العميل</TableHead>
                <TableHead className="text-right">الموظف المسؤول</TableHead>
                <TableHead className="text-right">الاستثمار</TableHead>
                <TableHead className="text-right">نسبة الربح</TableHead>
                <TableHead className="text-right">تاريخ البداية</TableHead>
                <TableHead className="text-right">موعد السحب</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => {
                const StatusIcon =
                  statusConfig[client.status as keyof typeof statusConfig].icon;
                return (
                  <TableRow
                    key={client.id}
                    className={cn(
                      "group",
                      client.status === "late" && "bg-destructive/5"
                    )}
                  >
                    <TableCell className="font-mono text-sm">{client.id}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{client.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {client.phone}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {client.employee}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {client.investment.toLocaleString()} ج.م
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-success">
                        <TrendingUp className="h-4 w-4" />
                        <span className="font-semibold">{client.profitRate}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {client.startDate}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {client.nextWithdraw}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          "font-medium",
                          statusConfig[client.status as keyof typeof statusConfig]
                            .className
                        )}
                      >
                        <StatusIcon className="ml-1 h-3 w-3" />
                        {
                          statusConfig[client.status as keyof typeof statusConfig]
                            .label
                        }
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem>
                            <Eye className="ml-2 h-4 w-4" />
                            عرض التفاصيل
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="ml-2 h-4 w-4" />
                            تعديل
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="ml-2 h-4 w-4" />
                            حذف
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
