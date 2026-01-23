import { useState } from "react";
import {
  Plus,
  Search,
  MoreHorizontal,
  Users,
  Wallet,
  TrendingUp,
  Edit,
  Trash2,
  Eye,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const employees = [
  {
    id: "EMP001",
    name: "سارة أحمد",
    email: "sara@fis.com",
    phone: "01234567890",
    commissionRate: 5,
    status: "active",
    clients: 45,
    totalInvestments: 2500000,
    totalCommissions: 125000,
  },
  {
    id: "EMP002",
    name: "خالد محمود",
    email: "khaled@fis.com",
    phone: "01234567891",
    commissionRate: 4.5,
    status: "active",
    clients: 38,
    totalInvestments: 2100000,
    totalCommissions: 94500,
  },
  {
    id: "EMP003",
    name: "محمد علي",
    email: "mohamed@fis.com",
    phone: "01234567892",
    commissionRate: 5,
    status: "active",
    clients: 32,
    totalInvestments: 1800000,
    totalCommissions: 90000,
  },
  {
    id: "EMP004",
    name: "نورا حسين",
    email: "noura@fis.com",
    phone: "01234567893",
    commissionRate: 4,
    status: "inactive",
    clients: 28,
    totalInvestments: 1500000,
    totalCommissions: 60000,
  },
  {
    id: "EMP005",
    name: "عمر سعيد",
    email: "omar@fis.com",
    phone: "01234567894",
    commissionRate: 5.5,
    status: "active",
    clients: 22,
    totalInvestments: 1200000,
    totalCommissions: 66000,
  },
];

export default function Employees() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.name.includes(searchQuery) ||
      emp.id.includes(searchQuery) ||
      emp.email.includes(searchQuery)
  );

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between animate-slide-right">
          <div>
            <h1 className="text-3xl font-bold text-foreground">الموظفين</h1>
            <p className="text-muted-foreground mt-1">
              إدارة موظفي التيلي سيلز ومتابعة أدائهم
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary">
                <Plus className="ml-2 h-4 w-4" />
                إضافة موظف
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>إضافة موظف جديد</DialogTitle>
                <DialogDescription>
                  أدخل بيانات الموظف الجديد. اضغط حفظ عند الانتهاء.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">الاسم الكامل</Label>
                  <Input id="name" placeholder="أدخل اسم الموظف" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">البريد الإلكتروني</Label>
                    <Input id="email" type="email" placeholder="email@fis.com" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone">رقم الهاتف</Label>
                    <Input id="phone" placeholder="01xxxxxxxxx" />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="commission">نسبة العمولة (%)</Label>
                  <Input id="commission" type="number" placeholder="5" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button className="gradient-primary">حفظ</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4 animate-slide-up">
          <div className="rounded-xl border bg-card p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الموظفين</p>
                <p className="text-2xl font-bold">{employees.length}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">الموظفين النشطين</p>
                <p className="text-2xl font-bold">
                  {employees.filter((e) => e.status === "active").length}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">إجمالي العملاء</p>
                <p className="text-2xl font-bold">
                  {employees.reduce((acc, e) => acc + e.clients, 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10 text-warning">
                <Wallet className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">إجمالي العمولات</p>
                <p className="text-2xl font-bold">
                  {(employees.reduce((acc, e) => acc + e.totalCommissions, 0) / 1000).toFixed(0)}K
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4 animate-fade-in">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="بحث بالاسم أو الكود أو البريد..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
          <Button variant="outline">تصفية</Button>
          <Button variant="outline">تصدير</Button>
        </div>

        {/* Table */}
        <div className="rounded-xl border bg-card shadow-card animate-slide-up">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">الكود</TableHead>
                <TableHead className="text-right">الموظف</TableHead>
                <TableHead className="text-right">التواصل</TableHead>
                <TableHead className="text-right">نسبة العمولة</TableHead>
                <TableHead className="text-right">العملاء</TableHead>
                <TableHead className="text-right">الاستثمارات</TableHead>
                <TableHead className="text-right">العمولات</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map((employee) => (
                <TableRow key={employee.id} className="group">
                  <TableCell className="font-mono text-sm">{employee.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {employee.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{employee.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="text-sm">{employee.email}</p>
                      <p className="text-xs text-muted-foreground">{employee.phone}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-semibold">
                      {employee.commissionRate}%
                    </Badge>
                  </TableCell>
                  <TableCell className="font-semibold">{employee.clients}</TableCell>
                  <TableCell className="font-semibold">
                    {(employee.totalInvestments / 1000000).toFixed(1)}M ج.م
                  </TableCell>
                  <TableCell className="font-semibold text-success">
                    {employee.totalCommissions.toLocaleString()} ج.م
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={cn(
                        "font-medium",
                        employee.status === "active"
                          ? "bg-success/10 text-success border-success/20"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {employee.status === "active" ? "نشط" : "موقوف"}
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
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </MainLayout>
  );
}
