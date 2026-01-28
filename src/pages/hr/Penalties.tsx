import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Search,
  Plus,
  Download,
  Filter,
  AlertCircle,
  MinusCircle,
  FileText,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  usePenalties,
  useCreatePenalty,
} from "@/hooks/queries/usePenalties";
import { useEmployees } from "@/hooks/queries/useProfiles";
import { useAuth } from "@/hooks/useAuth";

const typeConfig = {
  warning: {
    label: "إنذار",
    className: "bg-warning/10 text-warning border-warning/20",
    icon: AlertCircle,
  },
  suspension: {
    label: "إيقاف",
    className: "bg-destructive/10 text-destructive border-destructive/20",
    icon: AlertTriangle,
  },
  fine: {
    label: "خصم",
    className: "bg-destructive/10 text-destructive border-destructive/20",
    icon: MinusCircle,
  },
  other: {
    label: "ملاحظة",
    className: "bg-secondary/10 text-secondary-foreground border-secondary/20",
    icon: FileText,
  },
};

export default function Penalties() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Form states
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [penaltyType, setPenaltyType] = useState<string>("warning");
  const [reason, setReason] = useState("");
  const [amount, setAmount] = useState("");

  const { user } = useAuth();
  const { data: employees = [] } = useEmployees();
  const {
    data: penalties = [],
    isLoading,
    error,
    refetch,
  } = usePenalties({
    penaltyType: typeFilter !== "all" ? (typeFilter as keyof typeof typeConfig) : undefined,
  });

  const employeeNameById = useMemo(() => {
    return new Map(
      employees.map((employee) => [
        employee.user_id,
        employee.full_name || employee.email || employee.user_id,
      ])
    );
  }, [employees]);

  const filteredPenalties = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return penalties.filter((penalty) => {
      const displayName =
        penalty.profiles?.full_name ||
        penalty.profiles?.email ||
        employeeNameById.get(penalty.employee_id) ||
        penalty.employee_id;
      return !normalizedQuery || displayName.toLowerCase().includes(normalizedQuery);
    });
  }, [employeeNameById, penalties, searchQuery]);

  const warningCount = penalties.filter((p) => p.penalty_type === "warning").length;
  const suspensionCount = penalties.filter((p) => p.penalty_type === "suspension").length;
  const otherCount = penalties.filter((p) => p.penalty_type === "other").length;
  const totalDeductions = penalties
    .filter((p) => p.penalty_type === "fine")
    .reduce((acc, p) => acc + (p.amount || 0), 0);

  const createPenalty = useCreatePenalty();

  const handleSubmit = () => {
    if (!selectedEmployee || !reason || !user?.id) return;
    const penaltyDate = new Date().toISOString().split("T")[0];
    createPenalty.mutate({
      employee_id: selectedEmployee,
      penalty_type: penaltyType as keyof typeof typeConfig,
      title: reason,
      description: reason,
      amount: penaltyType === "fine" ? Number(amount || 0) : undefined,
      penalty_date: penaltyDate,
      issued_by: user.id,
      notes: penaltyType === "fine" ? "" : undefined,
    });

    setIsAddDialogOpen(false);
    setSelectedEmployee("");
    setPenaltyType("warning");
    setReason("");
    setAmount("");
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div>
            <Skeleton className="h-8 w-56 mb-2" />
            <Skeleton className="h-4 w-72" />
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-xl border bg-card p-4 shadow-card">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-20" />
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

  if (error) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">حدث خطأ في تحميل الجزاءات</h3>
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
            <h1 className="text-3xl font-bold text-foreground">الجزاءات والملاحظات</h1>
            <p className="text-muted-foreground mt-1">
              الإنذارات والخصومات والملاحظات الإدارية
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary">
                <Plus className="ml-2 h-4 w-4" />
                إضافة جزاء/ملاحظة
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>تسجيل جزاء أو ملاحظة</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>الموظف</Label>
                  <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الموظف" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((emp) => (
                        <SelectItem key={emp.user_id} value={emp.user_id}>
                          {emp.full_name || emp.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>النوع</Label>
                  <Select value={penaltyType} onValueChange={setPenaltyType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="warning">إنذار</SelectItem>
                      <SelectItem value="suspension">إيقاف</SelectItem>
                      <SelectItem value="fine">خصم</SelectItem>
                      <SelectItem value="other">ملاحظة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {penaltyType === "fine" && (
                  <div className="space-y-2">
                    <Label>مبلغ الخصم (ج.م)</Label>
                    <Input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>السبب</Label>
                  <Textarea
                    placeholder="اكتب السبب أو التفاصيل..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button
                  className="gradient-primary"
                  onClick={handleSubmit}
                  disabled={!selectedEmployee || !reason || !user?.id}
                >
                  تسجيل
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4 animate-slide-up">
          <div className="rounded-xl border bg-card p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10 text-warning">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">الإنذارات</p>
                <p className="text-2xl font-bold text-warning">{warningCount}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">الإيقاف</p>
                <p className="text-2xl font-bold text-destructive">{suspensionCount}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10 text-secondary-foreground">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">الملاحظات</p>
                <p className="text-2xl font-bold">{otherCount}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                <MinusCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الخصومات</p>
                <p className="text-2xl font-bold text-destructive">{totalDeductions} ج.م</p>
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
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-36">
              <Filter className="ml-2 h-4 w-4" />
              <SelectValue placeholder="النوع" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="warning">إنذار</SelectItem>
              <SelectItem value="suspension">إيقاف</SelectItem>
              <SelectItem value="fine">خصم</SelectItem>
              <SelectItem value="other">ملاحظة</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="ml-2 h-4 w-4" />
            تصدير
          </Button>
        </div>

        {/* Table */}
        <div className="rounded-xl border bg-card shadow-card animate-slide-up">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">الموظف</TableHead>
                <TableHead className="text-right">النوع</TableHead>
                <TableHead className="text-right">التاريخ</TableHead>
                <TableHead className="text-right">السبب</TableHead>
                <TableHead className="text-right">المبلغ</TableHead>
                <TableHead className="text-right">بواسطة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPenalties.map((penalty) => {
                const TypeIcon = typeConfig[penalty.penalty_type].icon;
                const displayName =
                  penalty.profiles?.full_name ||
                  penalty.profiles?.email ||
                  employeeNameById.get(penalty.employee_id) ||
                  penalty.employee_id;
                const issuedBy = employeeNameById.get(penalty.issued_by) || penalty.issued_by;
                return (
                  <TableRow key={penalty.id}>
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
                    <TableCell>
                      <Badge className={cn("font-medium", typeConfig[penalty.penalty_type].className)}>
                        <TypeIcon className="ml-1 h-3 w-3" />
                        {typeConfig[penalty.penalty_type].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{penalty.penalty_date}</TableCell>
                    <TableCell className="max-w-[300px]">
                      <p className="text-sm text-muted-foreground truncate">
                        {penalty.description || penalty.title || "-"}
                      </p>
                    </TableCell>
                    <TableCell>
                      {penalty.amount ? (
                        <span className="text-destructive font-semibold">
                          -{penalty.amount} ج.م
                        </span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {issuedBy}
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
