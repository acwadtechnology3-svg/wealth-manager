import { useState, useMemo } from "react";
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
import { supabase } from "@/integrations/supabase/client";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useEmployees, useProfileStats } from "@/hooks/queries/useProfiles";
import { useClients } from "@/hooks/queries/useClients";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

type AppRole = "super_admin" | "admin" | "hr_manager" | "hr_officer" | "tele_sales" | "accountant" | "support";
type Department = "admin" | "hr" | "tele_sales" | "finance" | "support";

const roleLabels: Record<AppRole, string> = {
  super_admin: "سوبر أدمن",
  admin: "أدمن",
  hr_manager: "مدير HR",
  hr_officer: "موظف HR",
  tele_sales: "تيلي سيلز",
  accountant: "محاسب",
  support: "دعم فني",
};

const departmentLabels: Record<Department, string> = {
  admin: "الإدارة",
  hr: "الموارد البشرية",
  tele_sales: "المبيعات",
  finance: "المالية",
  support: "الدعم الفني",
};

export default function Employees() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    salary: "",
    department: "support" as Department,
    role: "support" as AppRole,
  });
  const { toast } = useToast();
  const { isSuperAdmin } = useAuth();

  // Fetch employees and stats
  const { data: employees = [], isLoading, error, refetch } = useEmployees();
  const { data: profileStats } = useProfileStats();
  const { data: allClients = [] } = useClients();

  // Filter employees based on search
  const filteredEmployees = useMemo(() => {
    if (!searchQuery) return employees;

    const query = searchQuery.toLowerCase();
    return employees.filter((emp) => {
      const fullName = emp.full_name?.toLowerCase() || '';
      const email = emp.email?.toLowerCase() || '';
      const code = emp.employee_code?.toLowerCase() || '';
      const phone = emp.phone?.toLowerCase() || '';

      return (
        fullName.includes(query) ||
        email.includes(query) ||
        code.includes(query) ||
        phone.includes(query)
      );
    });
  }, [employees, searchQuery]);

  // Calculate employee performance metrics
  const employeeMetrics = useMemo(() => {
    const metrics = new Map();

    // Count clients per employee
    allClients.forEach((client) => {
      if (client.assigned_to) {
        const existing = metrics.get(client.assigned_to) || { clients: 0 };
        existing.clients = (existing.clients || 0) + 1;
        metrics.set(client.assigned_to, existing);
      }
    });

    return metrics;
  }, [allClients]);

  const handleCreateEmployee = async () => {
    if (!newEmployee.firstName || !newEmployee.lastName || !newEmployee.email || !newEmployee.password) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newEmployee.email,
        password: newEmployee.password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            first_name: newEmployee.firstName,
            last_name: newEmployee.lastName,
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        const fullName = `${newEmployee.firstName} ${newEmployee.lastName}`.trim();
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            phone: newEmployee.phone || null,
            department: newEmployee.department,
            full_name: fullName,
          })
          .eq("user_id", authData.user.id);

        if (profileError) {
          console.error("Profile update error:", profileError);
        }

        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({
            user_id: authData.user.id,
            role: newEmployee.role,
          });

        if (roleError) {
          console.error("Role insert error:", roleError);
        }

        toast({
          title: "تم بنجاح",
          description: "تم إضافة الموظف بنجاح",
        });

        setIsAddDialogOpen(false);
        setNewEmployee({
          firstName: "",
          lastName: "",
          email: "",
          password: "",
          phone: "",
          salary: "",
          department: "support",
          role: "support",
        });
        refetch();
      }
    } catch (err: any) {
      toast({
        title: "خطأ",
        description: err?.message || "فشل في إضافة الموظف",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-9 w-32 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-xl border bg-card p-4 shadow-card">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-7 w-12" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border bg-card shadow-card p-8">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Show error state
  if (error) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <Users className="h-8 w-8 text-destructive" />
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">حدث خطأ في تحميل البيانات</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              {error?.message || 'فشل في تحميل بيانات الموظفين'}
            </p>
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="firstName">الاسم الأول *</Label>
                    <Input
                      id="firstName"
                      placeholder="أحمد"
                      value={newEmployee.firstName}
                      onChange={(e) => setNewEmployee({ ...newEmployee, firstName: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="lastName">الاسم الأخير *</Label>
                    <Input
                      id="lastName"
                      placeholder="محمد"
                      value={newEmployee.lastName}
                      onChange={(e) => setNewEmployee({ ...newEmployee, lastName: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">البريد الإلكتروني *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@fis.com"
                      value={newEmployee.email}
                      onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                      dir="ltr"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone">رقم الهاتف</Label>
                    <Input
                      id="phone"
                      placeholder="01xxxxxxxxx"
                      value={newEmployee.phone}
                      onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                      dir="ltr"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">كلمة المرور *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={newEmployee.password}
                    onChange={(e) => setNewEmployee({ ...newEmployee, password: e.target.value })}
                    dir="ltr"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>القسم</Label>
                    <Select
                      value={newEmployee.department}
                      onValueChange={(value: Department) =>
                        setNewEmployee({ ...newEmployee, department: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(departmentLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>الصلاحية</Label>
                    <Select
                      value={newEmployee.role}
                      onValueChange={(value: AppRole) =>
                        setNewEmployee({ ...newEmployee, role: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(roleLabels).map(([value, label]) => (
                          <SelectItem
                            key={value}
                            value={value}
                            disabled={value === "super_admin" && !isSuperAdmin()}
                          >
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="salary">الراتب الأساسي (ج.م)</Label>
                  <Input
                    id="salary"
                    type="number"
                    placeholder="0"
                    value={newEmployee.salary}
                    onChange={(e) => setNewEmployee({ ...newEmployee, salary: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button className="gradient-primary" onClick={handleCreateEmployee} disabled={submitting}>
                  {submitting ? "جارٍ الحفظ..." : "حفظ"}
                </Button>
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
                <p className="text-2xl font-bold">{profileStats?.total || employees.length}</p>
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
                  {profileStats?.active || employees.filter((e) => e.is_active).length}
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
                  {allClients.length}
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
                <p className="text-2xl font-bold">0K</p>
                <p className="text-xs text-muted-foreground">قريباً</p>
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
          <Button variant="outline">تصدير</Button>
        </div>

        {/* Table or Empty State */}
        {filteredEmployees.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4 rounded-xl border bg-card shadow-card">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">
                {searchQuery ? 'لا توجد نتائج' : 'لا يوجد موظفين بعد'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery
                  ? 'لم يتم العثور على موظفين تطابق معايير البحث'
                  : 'ابدأ بإضافة أول موظف'}
              </p>
            </div>
            {searchQuery && (
              <Button onClick={() => setSearchQuery('')} variant="outline">
                مسح البحث
              </Button>
            )}
          </div>
        ) : (
          <div className="rounded-xl border bg-card shadow-card animate-slide-up">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الكود</TableHead>
                  <TableHead className="text-right">الموظف</TableHead>
                  <TableHead className="text-right">التواصل</TableHead>
                  <TableHead className="text-right">القسم</TableHead>
                  <TableHead className="text-right">العملاء</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((employee) => {
                  const metrics = employeeMetrics.get(employee.user_id!) || { clients: 0 };

                  return (
                    <TableRow key={employee.user_id} className="group">
                      <TableCell className="font-mono text-sm">
                        {employee.employee_code || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            {employee.avatar_url && (
                              <AvatarImage src={employee.avatar_url} />
                            )}
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                              {(employee.full_name || employee.email)
                                .split(" ")
                                .slice(0, 2)
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">
                            {employee.full_name || employee.email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="text-sm">{employee.email}</p>
                          <p className="text-xs text-muted-foreground">
                            {employee.phone || '-'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {employee.department || 'غير محدد'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {metrics.clients}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            "font-medium",
                            employee.is_active
                              ? "bg-success/10 text-success border-success/20"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {employee.is_active ? "نشط" : "موقوف"}
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
        )}
      </div>
    </MainLayout>
  );
}
