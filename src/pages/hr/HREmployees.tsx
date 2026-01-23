import { useState } from "react";
import {
  Plus,
  Search,
  MoreHorizontal,
  Users,
  Briefcase,
  Calendar,
  Phone,
  Mail,
  Edit,
  Trash2,
  Eye,
  FileText,
  Clock,
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
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { employees } from "@/data/hrMockData";
import { AddEmployeeDialog } from "@/components/hr/AddEmployeeDialog";

const statusConfig = {
  active: { label: "نشط", className: "bg-success/10 text-success border-success/20" },
  "on-leave": { label: "في إجازة", className: "bg-warning/10 text-warning border-warning/20" },
  suspended: { label: "موقوف", className: "bg-destructive/10 text-destructive border-destructive/20" },
};

const employmentTypeConfig = {
  "full-time": { label: "دوام كامل", className: "bg-primary/10 text-primary" },
  "part-time": { label: "دوام جزئي", className: "bg-secondary/10 text-secondary-foreground" },
  commission: { label: "بالعمولة", className: "bg-accent/10 text-accent-foreground" },
};

export default function HREmployees() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.includes(searchQuery) ||
      emp.code.includes(searchQuery) ||
      emp.email.includes(searchQuery) ||
      emp.position.includes(searchQuery);
    const matchesStatus = statusFilter === "all" || emp.status === statusFilter;
    const matchesDepartment = departmentFilter === "all" || emp.department === departmentFilter;
    return matchesSearch && matchesStatus && matchesDepartment;
  });

  const departments = [...new Set(employees.map((e) => e.department))];

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between animate-slide-right">
          <div>
            <h1 className="text-3xl font-bold text-foreground">ملفات الموظفين</h1>
            <p className="text-muted-foreground mt-1">
              إدارة بيانات الموظفين والملفات الشخصية
            </p>
          </div>
          <AddEmployeeDialog />
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
                <Briefcase className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">دوام كامل</p>
                <p className="text-2xl font-bold">
                  {employees.filter((e) => e.employmentType === "full-time").length}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10 text-warning">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">في إجازة</p>
                <p className="text-2xl font-bold">
                  {employees.filter((e) => e.status === "on-leave").length}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">عقود تنتهي قريباً</p>
                <p className="text-2xl font-bold">
                  {employees.filter((e) => e.contractEndDate).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 animate-fade-in flex-wrap">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="بحث بالاسم أو الكود أو الوظيفة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              <SelectItem value="active">نشط</SelectItem>
              <SelectItem value="on-leave">في إجازة</SelectItem>
              <SelectItem value="suspended">موقوف</SelectItem>
            </SelectContent>
          </Select>
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="القسم" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الأقسام</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline">تصدير</Button>
        </div>

        {/* Table */}
        <div className="rounded-xl border bg-card shadow-card animate-slide-up overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">الكود</TableHead>
                <TableHead className="text-right">الموظف</TableHead>
                <TableHead className="text-right">الوظيفة</TableHead>
                <TableHead className="text-right">نوع التعاقد</TableHead>
                <TableHead className="text-right">تاريخ التعيين</TableHead>
                <TableHead className="text-right">الراتب</TableHead>
                <TableHead className="text-right">رصيد الإجازات</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map((employee) => (
                <TableRow key={employee.id} className="group">
                  <TableCell className="font-mono text-sm">{employee.code}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {employee.name.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{employee.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {employee.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{employee.position}</p>
                      <p className="text-xs text-muted-foreground">{employee.department}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={employmentTypeConfig[employee.employmentType].className}>
                      {employmentTypeConfig[employee.employmentType].label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{employee.hireDate}</TableCell>
                  <TableCell className="font-semibold">
                    {employee.baseSalary > 0 ? `${employee.baseSalary.toLocaleString()} ج.م` : "-"}
                    {employee.commissionRate > 0 && (
                      <span className="text-xs text-muted-foreground block">
                        + {employee.commissionRate}% عمولة
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <span className="text-success">{employee.annualLeaveBalance} سنوية</span>
                      <span className="text-muted-foreground mx-1">|</span>
                      <span className="text-warning">{employee.sickLeaveBalance} مرضية</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusConfig[employee.status].className}>
                      {statusConfig[employee.status].label}
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
                          عرض الملف الكامل
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="ml-2 h-4 w-4" />
                          تعديل البيانات
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <FileText className="ml-2 h-4 w-4" />
                          المستندات
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Clock className="ml-2 h-4 w-4" />
                          سجل الحضور
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
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
