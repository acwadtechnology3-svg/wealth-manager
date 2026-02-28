import { useMemo, useState } from "react";
import {
  Search,
  MoreHorizontal,
  Users,
  Briefcase,
  Calendar,
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
import { useEmployees } from "@/hooks/queries/useProfiles";
import { useLeaves } from "@/hooks/queries/useLeaves";
import { useDocuments } from "@/hooks/queries/useDocuments";
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
  unknown: { label: "غير محدد", className: "bg-muted text-muted-foreground" },
};

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  return value.split("T")[0];
};

const isDateBetween = (target: string, start: string, end: string) => {
  const targetDate = new Date(target);
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (
    Number.isNaN(targetDate.getTime()) ||
    Number.isNaN(startDate.getTime()) ||
    Number.isNaN(endDate.getTime())
  ) {
    return false;
  }
  return targetDate >= startDate && targetDate <= endDate;
};

export default function HREmployees() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");

  const today = new Date().toISOString().split("T")[0];

  const {
    data: employees = [],
    isLoading: loadingEmployees,
    error: employeesError,
    refetch,
  } = useEmployees();
  const { data: approvedLeaves = [], isLoading: loadingLeaves } = useLeaves({ status: "approved" });
  const { data: contractDocuments = [], isLoading: loadingDocuments } = useDocuments({
    documentType: "contract",
  });

  const onLeaveEmployeeIds = useMemo(() => {
    const ids = new Set<string>();
    approvedLeaves.forEach((leave) => {
      if (isDateBetween(today, leave.start_date, leave.end_date)) {
        ids.add(leave.employee_id);
      }
    });
    return ids;
  }, [approvedLeaves, today]);

  const departments = useMemo(() => {
    return [...new Set(employees.map((e) => e.department).filter(Boolean))] as string[];
  }, [employees]);

  const contractExpiringSoon = useMemo(() => {
    const now = new Date();
    const inThirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return contractDocuments.filter((doc) => {
      if (!doc.expiry_date) return false;
      const expiry = new Date(doc.expiry_date);
      return expiry >= now && expiry <= inThirtyDays;
    });
  }, [contractDocuments]);

  const filteredEmployees = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return employees.filter((emp) => {
      const fullName = (emp.full_name || `${emp.first_name} ${emp.last_name}` || emp.email).toLowerCase();
      const code = emp.employee_code?.toLowerCase() || "";
      const email = emp.email?.toLowerCase() || "";
      const department = emp.department?.toLowerCase() || "";

      const derivedStatus = onLeaveEmployeeIds.has(emp.user_id)
        ? "on-leave"
        : emp.is_active
          ? "active"
          : "suspended";

      const matchesSearch =
        !normalizedQuery ||
        fullName.includes(normalizedQuery) ||
        code.includes(normalizedQuery) ||
        email.includes(normalizedQuery) ||
        department.includes(normalizedQuery);
      const matchesStatus = statusFilter === "all" || derivedStatus === statusFilter;
      const matchesDepartment = departmentFilter === "all" || emp.department === departmentFilter;

      return matchesSearch && matchesStatus && matchesDepartment;
    });
  }, [departmentFilter, employees, onLeaveEmployeeIds, searchQuery, statusFilter]);

  const activeCount = employees.filter((e) => e.is_active).length;
  const onLeaveCount = onLeaveEmployeeIds.size;
  const isLoading = loadingEmployees || loadingLeaves || loadingDocuments;

  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-72" />
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-xl border bg-card p-4 shadow-card">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-6 w-12" />
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

  if (employeesError) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">حدث خطأ في تحميل بيانات الموظفين</h3>
            <p className="text-sm text-muted-foreground">{employeesError.message}</p>
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
                <p className="text-sm text-muted-foreground">موظفين نشطين</p>
                <p className="text-2xl font-bold">
                  {activeCount}
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
                  {onLeaveCount}
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
                  {contractExpiringSoon.length}
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
              placeholder="بحث بالاسم أو الكود أو القسم..."
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
              {filteredEmployees.map((employee) => {
                const fullName = employee.full_name || `${employee.first_name} ${employee.last_name}` || employee.email;
                const employmentType = "unknown" as const;
                const statusKey = onLeaveEmployeeIds.has(employee.user_id)
                  ? "on-leave"
                  : employee.is_active
                    ? "active"
                    : "suspended";

                return (
                  <TableRow key={employee.user_id} className="group">
                    <TableCell className="font-mono text-sm">{employee.employee_code || "-"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {fullName.split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{fullName}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {employee.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">-</p>
                        <p className="text-xs text-muted-foreground">{employee.department || "-"}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={employmentTypeConfig[employmentType].className}>
                        {employmentTypeConfig[employmentType].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(employee.created_at)}</TableCell>
                    <TableCell className="font-semibold">-</TableCell>
                    <TableCell>
                      <div className="text-sm">-</div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(statusConfig[statusKey].className)}>
                        {statusConfig[statusKey].label}
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
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </MainLayout>
  );
}
