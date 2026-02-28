import { useMemo, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TaskCalendar } from "@/components/phone-numbers/TaskCalendar";
import { TaskList } from "@/components/phone-numbers/TaskList";
import {
  useEmployeeCalendarTasks,
  useTaskStats,
  useUpcomingTasks,
  useUpdateTaskStatus,
} from "@/hooks/queries/usePhoneNumbers";
import { useAuth } from "@/hooks/useAuth";
import type { PhoneNumber } from "@/types/database";

export default function MyTasks() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTask, setSelectedTask] = useState<PhoneNumber | null>(null);
  const [editStatus, setEditStatus] = useState<string>("");
  const [editNotes, setEditNotes] = useState<string>("");

  const updateTaskStatus = useUpdateTaskStatus();

  const { data: stats, isLoading: statsLoading } = useTaskStats(user?.id);
  const { data: upcomingTasks = [], isLoading: upcomingLoading } = useUpcomingTasks(user?.id, 10);

  const dateRange = useMemo(() => {
    if (!selectedDate) return null;
    const start = new Date(selectedDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(selectedDate);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }, [selectedDate]);

  const { data: selectedDayData = [], isLoading: selectedDayLoading } = useEmployeeCalendarTasks(
    selectedDate ? user?.id : undefined,
    dateRange?.start.toISOString() || "",
    dateRange?.end.toISOString() || ""
  );

  const selectedDateKey = selectedDate?.toISOString().split("T")[0];
  const selectedDayTasks = useMemo(() => {
    if (!selectedDateKey) return [];
    return selectedDayData.find((day) => day.date === selectedDateKey)?.tasks || [];
  }, [selectedDateKey, selectedDayData]);

  const upcomingFiltered = useMemo(() => {
    const limitDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    return upcomingTasks.filter((task) => {
      if (!task.due_date) return true;
      return new Date(task.due_date) <= limitDate;
    });
  }, [upcomingTasks]);

  const handleQuickComplete = (taskId: string) => {
    updateTaskStatus.mutate({ id: taskId, updates: { call_status: "completed" } });
  };

  const handleTaskClick = (task: PhoneNumber) => {
    setSelectedTask(task);
    setEditStatus(task.call_status || "pending");
    setEditNotes(task.notes || "");
  };

  const handleSaveTask = async () => {
    if (!selectedTask) return;
    await updateTaskStatus.mutateAsync({
      id: selectedTask.id,
      updates: { call_status: editStatus, notes: editNotes },
    });
    setSelectedTask(null);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">مهامي</h1>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <TaskCalendar
              employeeId={user?.id || ""}
              onDateSelect={setSelectedDate}
              onTaskClick={handleTaskClick}
            />
          </div>

          <div className="space-y-6">
            <div className="grid gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">المهام المعلقة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {statsLoading ? "..." : stats?.pending ?? 0}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">مكتملة اليوم</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {statsLoading ? "..." : stats?.completedToday ?? 0}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">متأخرة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {statsLoading ? "..." : stats?.overdue ?? 0}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>المهام القادمة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {upcomingLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <div key={index} className="h-12 animate-pulse rounded-md bg-muted" />
                    ))}
                  </div>
                ) : upcomingFiltered.length === 0 ? (
                  <div className="text-sm text-muted-foreground">لا توجد مهام قادمة</div>
                ) : (
                  <div className="space-y-3">
                    {upcomingFiltered.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div className="space-y-1">
                          <div className="text-sm font-semibold">{task.phone_number}</div>
                          <div className="text-xs text-muted-foreground">
                            {task.due_date
                              ? new Date(task.due_date).toLocaleDateString("ar-EG")
                              : "بدون موعد"}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleQuickComplete(task.id)}
                          >
                            إكمال
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleTaskClick(task)}>
                            تفاصيل
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={!!selectedDate} onOpenChange={(open) => !open && setSelectedDate(undefined)}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>مهام {selectedDateKey}</DialogTitle>
          </DialogHeader>
          <TaskList
            tasks={selectedDayTasks}
            loading={selectedDayLoading}
            showFilters={false}
            emptyMessage="لا توجد مهام في هذا اليوم"
            onTaskUpdate={(taskId, updates) => updateTaskStatus.mutate({ id: taskId, updates })}
            onTaskClick={handleTaskClick}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedTask} onOpenChange={(open) => !open && setSelectedTask(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>تفاصيل المهمة</DialogTitle>
          </DialogHeader>
          {selectedTask && (
            <div className="space-y-4">
              <div className="rounded-lg border p-3 text-sm">
                رقم الهاتف: <span className="font-semibold">{selectedTask.phone_number}</span>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">الحالة</label>
                <Select value={editStatus} onValueChange={setEditStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الحالة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">قيد الانتظار</SelectItem>
                    <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
                    <SelectItem value="completed">مكتملة</SelectItem>
                    <SelectItem value="cancelled">ملغاة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">الأولوية</label>
                <div className="rounded-lg border p-3 text-sm text-muted-foreground">
                  {selectedTask.priority || "medium"}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">الملاحظات</label>
                <Textarea value={editNotes} onChange={(event) => setEditNotes(event.target.value)} />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedTask(null)}>
                  إلغاء
                </Button>
                <Button onClick={handleSaveTask} disabled={updateTaskStatus.isLoading}>
                  حفظ
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
