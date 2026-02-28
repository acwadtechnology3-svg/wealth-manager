import { useState } from "react";
import {
  Calendar,
  Clock,
  User,
  Save,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useProfiles } from "@/hooks/queries/useProfiles";
import {
  useWorkSchedules,
  useEmployeeWorkSchedule,
  useUpsertWorkSchedule,
  useCreateDefaultSchedule,
  useDeleteWorkSchedule,
} from "@/hooks/queries/useWorkSchedules";
import type { ShiftType, WorkScheduleInsert } from "@/api/workSchedules";

const daysOfWeek = [
  { value: 0, label: "الأحد" },
  { value: 1, label: "الإثنين" },
  { value: 2, label: "الثلاثاء" },
  { value: 3, label: "الأربعاء" },
  { value: 4, label: "الخميس" },
  { value: 5, label: "الجمعة" },
  { value: 6, label: "السبت" },
];

const shiftTypes: { value: ShiftType; label: string; color: string }[] = [
  { value: "morning", label: "صباحي", color: "bg-yellow-100 text-yellow-800" },
  { value: "afternoon", label: "مسائي", color: "bg-orange-100 text-orange-800" },
  { value: "evening", label: "ليلي مبكر", color: "bg-purple-100 text-purple-800" },
  { value: "night", label: "ليلي", color: "bg-indigo-100 text-indigo-800" },
  { value: "flexible", label: "مرن", color: "bg-green-100 text-green-800" },
];

export default function WorkSchedules() {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<{
    dayOfWeek: number;
    shiftType: ShiftType;
    startTime: string;
    endTime: string;
    isWorkingDay: boolean;
    breakDuration: number;
  } | null>(null);

  // Fetch employees
  const { data: employees = [], isLoading: employeesLoading } = useProfiles({ active: true });

  // Fetch work schedules for selected employee
  const { data: schedules = [], isLoading: schedulesLoading } = useEmployeeWorkSchedule(selectedEmployeeId);

  // Mutations
  const upsertSchedule = useUpsertWorkSchedule();
  const createDefaultSchedule = useCreateDefaultSchedule();
  const deleteSchedule = useDeleteWorkSchedule();

  const handleEditSchedule = (dayOfWeek: number) => {
    const existing = schedules.find((s) => s.day_of_week === dayOfWeek);
    if (existing) {
      setEditingSchedule({
        dayOfWeek: existing.day_of_week,
        shiftType: existing.shift_type,
        startTime: existing.start_time,
        endTime: existing.end_time,
        isWorkingDay: existing.is_working_day,
        breakDuration: existing.break_duration || 60,
      });
    } else {
      setEditingSchedule({
        dayOfWeek,
        shiftType: "morning",
        startTime: "09:00",
        endTime: "17:00",
        isWorkingDay: true,
        breakDuration: 60,
      });
    }
    setIsEditDialogOpen(true);
  };

  const handleSaveSchedule = async () => {
    if (!selectedEmployeeId || !editingSchedule) return;

    const schedule: WorkScheduleInsert = {
      employee_id: selectedEmployeeId,
      day_of_week: editingSchedule.dayOfWeek,
      shift_type: editingSchedule.shiftType,
      start_time: editingSchedule.startTime,
      end_time: editingSchedule.endTime,
      is_working_day: editingSchedule.isWorkingDay,
      break_duration: editingSchedule.breakDuration,
    };

    await upsertSchedule.mutateAsync(schedule);
    setIsEditDialogOpen(false);
    setEditingSchedule(null);
  };

  const handleCreateDefaultSchedule = async () => {
    if (!selectedEmployeeId) return;
    await createDefaultSchedule.mutateAsync(selectedEmployeeId);
  };

  const getScheduleForDay = (dayOfWeek: number) => {
    return schedules.find((s) => s.day_of_week === dayOfWeek);
  };

  const getShiftBadge = (shiftType: ShiftType) => {
    const shift = shiftTypes.find((s) => s.value === shiftType);
    return shift ? (
      <Badge className={cn("font-normal", shift.color)}>{shift.label}</Badge>
    ) : null;
  };

  if (employeesLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-[500px] w-full" />
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
            <h1 className="text-3xl font-bold text-foreground">جداول العمل</h1>
            <p className="text-muted-foreground mt-1">
              إدارة جداول عمل الموظفين وأوقات الدوام
            </p>
          </div>
        </div>

        {/* Employee Selection */}
        <Card className="animate-slide-up">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              اختيار الموظف
            </CardTitle>
            <CardDescription>
              اختر موظفاً لعرض وتعديل جدول عمله
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                <SelectTrigger className="w-80">
                  <SelectValue placeholder="اختر الموظف" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.full_name || `${employee.first_name} ${employee.last_name}`}
                      {employee.department && ` - ${employee.department}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedEmployeeId && schedules.length === 0 && (
                <Button
                  variant="outline"
                  onClick={handleCreateDefaultSchedule}
                  disabled={createDefaultSchedule.isPending}
                >
                  <Plus className="ml-2 h-4 w-4" />
                  إنشاء جدول افتراضي
                </Button>
              )}

              {selectedEmployeeId && schedules.length > 0 && (
                <Button
                  variant="outline"
                  onClick={handleCreateDefaultSchedule}
                  disabled={createDefaultSchedule.isPending}
                >
                  <RefreshCw className="ml-2 h-4 w-4" />
                  إعادة تعيين للافتراضي
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Schedule Table */}
        {selectedEmployeeId && (
          <Card className="animate-slide-up">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                جدول العمل الأسبوعي
              </CardTitle>
              <CardDescription>
                انقر على أي يوم لتعديل مواعيد العمل
              </CardDescription>
            </CardHeader>
            <CardContent>
              {schedulesLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">اليوم</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">نوع الوردية</TableHead>
                      <TableHead className="text-right">من</TableHead>
                      <TableHead className="text-right">إلى</TableHead>
                      <TableHead className="text-right">استراحة</TableHead>
                      <TableHead className="text-right">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {daysOfWeek.map((day) => {
                      const schedule = getScheduleForDay(day.value);
                      return (
                        <TableRow
                          key={day.value}
                          className={cn(
                            "cursor-pointer hover:bg-muted/50 transition-colors",
                            !schedule?.is_working_day && "bg-muted/30"
                          )}
                          onClick={() => handleEditSchedule(day.value)}
                        >
                          <TableCell className="font-medium">{day.label}</TableCell>
                          <TableCell>
                            {schedule?.is_working_day ? (
                              <Badge className="bg-success/10 text-success">يوم عمل</Badge>
                            ) : (
                              <Badge variant="secondary">إجازة</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {schedule ? getShiftBadge(schedule.shift_type) : "-"}
                          </TableCell>
                          <TableCell>{schedule?.start_time || "-"}</TableCell>
                          <TableCell>{schedule?.end_time || "-"}</TableCell>
                          <TableCell>
                            {schedule?.break_duration ? `${schedule.break_duration} دقيقة` : "-"}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditSchedule(day.value);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* No Employee Selected */}
        {!selectedEmployeeId && (
          <Card className="animate-fade-in">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <User className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground">
                اختر موظفاً لعرض جدول عمله
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                يمكنك إنشاء جدول افتراضي أو تخصيص مواعيد كل يوم
              </p>
            </CardContent>
          </Card>
        )}

        {/* Edit Schedule Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                تعديل جدول {daysOfWeek.find((d) => d.value === editingSchedule?.dayOfWeek)?.label}
              </DialogTitle>
              <DialogDescription>
                حدد مواعيد العمل لهذا اليوم
              </DialogDescription>
            </DialogHeader>
            {editingSchedule && (
              <div className="grid gap-4 py-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="is-working-day">يوم عمل</Label>
                  <Switch
                    id="is-working-day"
                    checked={editingSchedule.isWorkingDay}
                    onCheckedChange={(checked) =>
                      setEditingSchedule({ ...editingSchedule, isWorkingDay: checked })
                    }
                  />
                </div>

                {editingSchedule.isWorkingDay && (
                  <>
                    <div className="grid gap-2">
                      <Label htmlFor="shift-type">نوع الوردية</Label>
                      <Select
                        value={editingSchedule.shiftType}
                        onValueChange={(v) =>
                          setEditingSchedule({ ...editingSchedule, shiftType: v as ShiftType })
                        }
                      >
                        <SelectTrigger id="shift-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {shiftTypes.map((shift) => (
                            <SelectItem key={shift.value} value={shift.value}>
                              {shift.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="start-time">وقت البدء</Label>
                        <Input
                          id="start-time"
                          type="time"
                          value={editingSchedule.startTime}
                          onChange={(e) =>
                            setEditingSchedule({ ...editingSchedule, startTime: e.target.value })
                          }
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="end-time">وقت الانتهاء</Label>
                        <Input
                          id="end-time"
                          type="time"
                          value={editingSchedule.endTime}
                          onChange={(e) =>
                            setEditingSchedule({ ...editingSchedule, endTime: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="break-duration">مدة الاستراحة (بالدقائق)</Label>
                      <Input
                        id="break-duration"
                        type="number"
                        value={editingSchedule.breakDuration}
                        onChange={(e) =>
                          setEditingSchedule({
                            ...editingSchedule,
                            breakDuration: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                  </>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={handleSaveSchedule} disabled={upsertSchedule.isPending}>
                <Save className="ml-2 h-4 w-4" />
                {upsertSchedule.isPending ? "جاري الحفظ..." : "حفظ"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
