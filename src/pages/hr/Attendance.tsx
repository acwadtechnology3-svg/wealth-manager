import { useMemo, useState } from "react";
import {
  Clock,
  Search,
  UserCheck,
  UserX,
  AlertTriangle,
  Calendar,
  Download,
  Plus,
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
import { cn } from "@/lib/utils";
import {
  useAttendance,
  useCreateAttendance,
  useUpdateAttendance,
} from "@/hooks/queries/useAttendance";
import { useEmployees } from "@/hooks/queries/useProfiles";

const statusConfig = {
  present: { label: "حاضر", className: "bg-success/10 text-success border-success/20", icon: UserCheck },
  late: { label: "متأخر", className: "bg-warning/10 text-warning border-warning/20", icon: AlertTriangle },
  absent: { label: "غائب", className: "bg-destructive/10 text-destructive border-destructive/20", icon: UserX },
};

const workStartMinutes = 9 * 60;

const timeToMinutes = (time?: string | null) => {
  if (!time) return null;
  const [hours, minutes] = time.split(":").map((part) => Number(part));
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
};

const formatTime = (time?: string | null) => {
  if (!time) return null;
  return time.slice(0, 5);
};

export default function Attendance() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const today = new Date().toISOString().split("T")[0];
  const [dateFilter, setDateFilter] = useState(today);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [checkInTime, setCheckInTime] = useState("");
  const [checkOutTime, setCheckOutTime] = useState("");

  const { data: employees = [] } = useEmployees();
  const {
    data: attendanceRecords = [],
    isLoading,
    error,
    refetch,
  } = useAttendance({
    startDate: dateFilter,
    endDate: dateFilter,
  });

  const employeeNameById = useMemo(() => {
    return new Map(
      employees.map((employee) => [
        employee.user_id,
        employee.full_name || employee.email || employee.user_id,
      ])
    );
  }, [employees]);

  const filteredRecords = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return attendanceRecords.filter((record) => {
      const displayName =
        record.profiles?.full_name ||
        record.profiles?.email ||
        employeeNameById.get(record.employee_id) ||
        record.employee_id;
      const matchesSearch = !normalizedQuery || displayName.toLowerCase().includes(normalizedQuery);
      const matchesStatus = statusFilter === "all" || record.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [attendanceRecords, employeeNameById, searchQuery, statusFilter]);

  const todayStats = {
    present: attendanceRecords.filter((r) => r.status === "present").length,
    late: attendanceRecords.filter((r) => r.status === "late").length,
    absent: attendanceRecords.filter((r) => r.status === "absent").length,
  };

  const createAttendance = useCreateAttendance();
  const updateAttendance = useUpdateAttendance();

  const handleAddAttendance = () => {
    if (!selectedEmployee) return;

    const checkIn = checkInTime || undefined;
    const checkOut = checkOutTime || undefined;
    const checkInMinutes = timeToMinutes(checkIn);
    const derivedStatus = checkIn
      ? checkInMinutes && checkInMinutes > workStartMinutes
        ? "late"
        : "present"
      : "absent";

    const existingRecord = attendanceRecords.find(
      (record) => record.employee_id === selectedEmployee && record.date === dateFilter
    );

    if (existingRecord) {
      updateAttendance.mutate({
        id: existingRecord.id,
        updates: {
          check_in: checkIn,
          check_out: checkOut,
          status: derivedStatus,
        },
      });
    } else {
      createAttendance.mutate({
        employee_id: selectedEmployee,
        date: dateFilter,
        check_in: checkIn,
        check_out: checkOut,
        status: derivedStatus,
      });
    }

    setIsAddDialogOpen(false);
    setSelectedEmployee("");
    setCheckInTime("");
    setCheckOutTime("");
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
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
            <h3 className="text-lg font-semibold">حدث خطأ في تحميل سجلات الحضور</h3>
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
            <h1 className="text-3xl font-bold text-foreground">الحضور والانصراف</h1>
            <p className="text-muted-foreground mt-1">
              تسجيل ومتابعة حضور الموظفين
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary">
                <Plus className="ml-2 h-4 w-4" />
                تسجيل حضور
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>تسجيل حضور يدوي</DialogTitle>
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>وقت الحضور</Label>
                    <Input
                      type="time"
                      value={checkInTime}
                      onChange={(e) => setCheckInTime(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>وقت الانصراف</Label>
                    <Input
                      type="time"
                      value={checkOutTime}
                      onChange={(e) => setCheckOutTime(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button
                  className="gradient-primary"
                  onClick={handleAddAttendance}
                  disabled={!selectedEmployee}
                >
                  تسجيل
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3 animate-slide-up">
          <div className="rounded-xl border bg-card p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10 text-success">
                <UserCheck className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">حاضرين</p>
                <p className="text-3xl font-bold text-success">{todayStats.present}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10 text-warning">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">متأخرين</p>
                <p className="text-3xl font-bold text-warning">{todayStats.late}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                <UserX className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">غائبين</p>
                <p className="text-3xl font-bold text-destructive">{todayStats.absent}</p>
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
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-40"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <Filter className="ml-2 h-4 w-4" />
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="present">حاضر</SelectItem>
              <SelectItem value="late">متأخر</SelectItem>
              <SelectItem value="absent">غائب</SelectItem>
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
                <TableHead className="text-right">التاريخ</TableHead>
                <TableHead className="text-right">وقت الحضور</TableHead>
                <TableHead className="text-right">وقت الانصراف</TableHead>
                <TableHead className="text-right">التأخير</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">ملاحظات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.map((record) => {
                const statusKey =
                  record.status && statusConfig[record.status] ? record.status : "present";
                const StatusIcon = statusConfig[statusKey].icon;
                const displayName =
                  record.profiles?.full_name ||
                  record.profiles?.email ||
                  employeeNameById.get(record.employee_id) ||
                  record.employee_id;
                const initials = displayName
                  .split(" ")
                  .map((n) => n[0])
                  .join("");
                const lateMinutes =
                  statusKey === "late"
                    ? Math.max(
                        0,
                        (timeToMinutes(record.check_in) || 0) - workStartMinutes
                      )
                    : null;
                return (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-primary/10 text-primary text-sm">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{displayName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{record.date}</TableCell>
                    <TableCell>
                      {record.check_in ? (
                        <span className="font-mono">{formatTime(record.check_in)}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {record.check_out ? (
                        <span className="font-mono">{formatTime(record.check_out)}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {lateMinutes ? (
                        <span className="text-warning font-medium">{lateMinutes} دقيقة</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("font-medium", statusConfig[statusKey].className)}>
                        <StatusIcon className="ml-1 h-3 w-3" />
                        {statusConfig[statusKey].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {record.notes || "-"}
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
