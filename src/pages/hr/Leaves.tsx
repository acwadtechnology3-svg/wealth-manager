import { useMemo, useState } from "react";
import {
  Search,
  Plus,
  Check,
  X,
  Clock,
  Download,
  Filter,
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
  useLeaves,
  useCreateLeave,
  useApproveLeave,
  useRejectLeave,
} from "@/hooks/queries/useLeaves";
import { useEmployees } from "@/hooks/queries/useProfiles";

const statusConfig = {
  pending: { label: "معلق", className: "bg-warning/10 text-warning border-warning/20" },
  approved: { label: "موافق عليه", className: "bg-success/10 text-success border-success/20" },
  rejected: { label: "مرفوض", className: "bg-destructive/10 text-destructive border-destructive/20" },
  cancelled: { label: "ملغى", className: "bg-muted text-muted-foreground border-muted/20" },
};

const leaveTypeConfig = {
  vacation: { label: "سنوية", className: "bg-primary/10 text-primary" },
  sick: { label: "مرضية", className: "bg-warning/10 text-warning" },
  personal: { label: "شخصية", className: "bg-secondary/10 text-secondary-foreground" },
  maternity: { label: "وضع", className: "bg-accent/10 text-accent-foreground" },
  paternity: { label: "أبوة", className: "bg-accent/10 text-accent-foreground" },
  unpaid: { label: "بدون أجر", className: "bg-muted text-muted-foreground" },
};

const calculateDays = (start: string, end: string) => {
  if (!start || !end) return 0;
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return 0;
  const diff = endDate.getTime() - startDate.getTime();
  if (diff < 0) return 0;
  return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
};

export default function Leaves() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Form states
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [leaveType, setLeaveType] = useState<string>("vacation");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  const { data: employees = [] } = useEmployees();
  const {
    data: leaveRequests = [],
    isLoading,
    error,
    refetch,
  } = useLeaves();

  const employeeNameById = useMemo(() => {
    return new Map(
      employees.map((employee) => [
        employee.user_id,
        employee.full_name || employee.email || employee.user_id,
      ])
    );
  }, [employees]);

  const filteredRequests = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return leaveRequests.filter((request) => {
      const displayName =
        request.profiles?.full_name ||
        request.profiles?.email ||
        employeeNameById.get(request.employee_id) ||
        request.employee_id;
      const matchesSearch = !normalizedQuery || displayName.toLowerCase().includes(normalizedQuery);
      const matchesStatus = statusFilter === "all" || request.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [employeeNameById, leaveRequests, searchQuery, statusFilter]);

  const pendingCount = leaveRequests.filter((l) => l.status === "pending").length;
  const approvedCount = leaveRequests.filter((l) => l.status === "approved").length;
  const rejectedCount = leaveRequests.filter((l) => l.status === "rejected").length;

  const createLeave = useCreateLeave();
  const approveLeave = useApproveLeave();
  const rejectLeave = useRejectLeave();

  const handleApprove = (id: string) => {
    approveLeave.mutate({ id });
  };

  const handleReject = (id: string) => {
    rejectLeave.mutate({ id });
  };

  const handleSubmitRequest = () => {
    if (!selectedEmployee || !startDate || !endDate) return;

    const daysCount = calculateDays(startDate, endDate);
    createLeave.mutate({
      employee_id: selectedEmployee,
      leave_type: leaveType as keyof typeof leaveTypeConfig,
      start_date: startDate,
      end_date: endDate,
      days_count: daysCount,
      reason: reason || undefined,
    });

    setIsAddDialogOpen(false);
    setSelectedEmployee("");
    setLeaveType("vacation");
    setStartDate("");
    setEndDate("");
    setReason("");
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div>
            <Skeleton className="h-8 w-40 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-xl border bg-card p-4 shadow-card">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-lg" />
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
            <h3 className="text-lg font-semibold">حدث خطأ في تحميل طلبات الإجازات</h3>
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
            <h1 className="text-3xl font-bold text-foreground">الإجازات</h1>
            <p className="text-muted-foreground mt-1">
              إدارة طلبات الإجازات والموافقات
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary">
                <Plus className="ml-2 h-4 w-4" />
                طلب إجازة جديد
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>تقديم طلب إجازة</DialogTitle>
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
                  <Label>نوع الإجازة</Label>
                  <Select value={leaveType} onValueChange={setLeaveType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vacation">سنوية</SelectItem>
                      <SelectItem value="sick">مرضية</SelectItem>
                      <SelectItem value="personal">شخصية</SelectItem>
                      <SelectItem value="maternity">وضع</SelectItem>
                      <SelectItem value="paternity">أبوة</SelectItem>
                      <SelectItem value="unpaid">بدون أجر</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>من تاريخ</Label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>إلى تاريخ</Label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>السبب</Label>
                  <Textarea
                    placeholder="اكتب سبب الإجازة..."
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
                  onClick={handleSubmitRequest}
                  disabled={!selectedEmployee || !startDate || !endDate}
                >
                  تقديم الطلب
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3 animate-slide-up">
          <div className="rounded-xl border bg-card p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10 text-warning">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">طلبات معلقة</p>
                <p className="text-3xl font-bold text-warning">{pendingCount}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10 text-success">
                <Check className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">موافق عليها</p>
                <p className="text-3xl font-bold text-success">{approvedCount}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                <X className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">مرفوضة</p>
                <p className="text-3xl font-bold text-destructive">{rejectedCount}</p>
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
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <Filter className="ml-2 h-4 w-4" />
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              <SelectItem value="pending">معلق</SelectItem>
              <SelectItem value="approved">موافق عليه</SelectItem>
              <SelectItem value="rejected">مرفوض</SelectItem>
              <SelectItem value="cancelled">ملغى</SelectItem>
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
                <TableHead className="text-right">نوع الإجازة</TableHead>
                <TableHead className="text-right">من</TableHead>
                <TableHead className="text-right">إلى</TableHead>
                <TableHead className="text-right">عدد الأيام</TableHead>
                <TableHead className="text-right">السبب</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.map((request) => {
                const displayName =
                  request.profiles?.full_name ||
                  request.profiles?.email ||
                  employeeNameById.get(request.employee_id) ||
                  request.employee_id;
                const approvedBy = request.reviewed_by
                  ? employeeNameById.get(request.reviewed_by) || request.reviewed_by
                  : null;
                return (
                  <TableRow key={request.id}>
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
                      <Badge className={leaveTypeConfig[request.leave_type].className}>
                        {leaveTypeConfig[request.leave_type].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{request.start_date}</TableCell>
                    <TableCell className="text-muted-foreground">{request.end_date}</TableCell>
                    <TableCell className="font-semibold">{request.days_count} يوم</TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                      {request.reason || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("font-medium", statusConfig[request.status].className)}>
                        {statusConfig[request.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {request.status === "pending" ? (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-success hover:text-success hover:bg-success/10"
                            onClick={() => handleApprove(request.id)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleReject(request.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {approvedBy && `بواسطة: ${approvedBy}`}
                        </span>
                      )}
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
