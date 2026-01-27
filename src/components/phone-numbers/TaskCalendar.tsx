import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar } from "@/components/ui/calendar";
import { useEmployeeCalendarTasks, useUpdateTaskStatus } from "@/hooks/queries/usePhoneNumbers";
import type { PhoneNumber, TaskCalendarDay } from "@/types/database";

interface TaskCalendarProps {
  employeeId: string;
  onDateSelect?: (date: Date) => void;
  onTaskClick?: (task: PhoneNumber) => void;
}

function getMonthRange(date: Date) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

export function TaskCalendar({ employeeId, onDateSelect, onTaskClick }: TaskCalendarProps) {
  const [month, setMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const updateTaskStatus = useUpdateTaskStatus();

  const { start, end } = useMemo(() => getMonthRange(month), [month]);
  const { data: calendarDays = [], isLoading } = useEmployeeCalendarTasks(
    employeeId,
    start.toISOString(),
    end.toISOString()
  );

  const tasksByDate = useMemo(() => {
    const map = new Map<string, TaskCalendarDay>();
    calendarDays.forEach((day) => {
      map.set(day.date, day);
    });
    return map;
  }, [calendarDays]);

  const selectedDateKey = selectedDate ? selectedDate.toISOString().split("T")[0] : undefined;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>التقويم الشهري</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[320px] animate-pulse rounded-lg bg-muted" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>التقويم الشهري</CardTitle>
      </CardHeader>
      <CardContent>
        <Calendar
          mode="single"
          month={month}
          onMonthChange={setMonth}
          selected={selectedDate}
          onSelect={(date) => {
            setSelectedDate(date ?? undefined);
            if (date && onDateSelect) {
              onDateSelect(date);
            }
          }}
          components={{
            DayContent: ({ date }) => {
              const dateKey = date.toISOString().split("T")[0];
              const dayInfo = tasksByDate.get(dateKey);
              const pendingCount = dayInfo?.counts.pending ?? 0;
              const inProgressCount = dayInfo?.counts.inProgress ?? 0;
              const completedCount = dayInfo?.counts.completed ?? 0;
              const tasksForDay = dayInfo?.tasks ?? [];
              const isOpen = selectedDateKey === dateKey;

              return (
                <Popover
                  open={isOpen}
                  onOpenChange={(open) => {
                    if (!open && isOpen) {
                      setSelectedDate(undefined);
                    }
                  }}
                >
                  <PopoverTrigger asChild>
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-sm font-medium">{date.getDate()}</span>
                      <div className="flex gap-1">
                        {pendingCount > 0 && (
                          <Badge className="h-4 bg-blue-500 px-1 text-[10px] text-white">
                            {pendingCount}
                          </Badge>
                        )}
                        {inProgressCount > 0 && (
                          <Badge className="h-4 bg-yellow-500 px-1 text-[10px] text-white">
                            {inProgressCount}
                          </Badge>
                        )}
                        {completedCount > 0 && (
                          <Badge className="h-4 bg-green-500 px-1 text-[10px] text-white">
                            {completedCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0 text-right">
                    <div className="border-b px-4 py-3">
                      <div className="text-sm font-semibold">مهام {dateKey}</div>
                      <div className="text-xs text-muted-foreground">
                        {tasksForDay.length} مهمة
                      </div>
                    </div>
                    <ScrollArea className="h-64">
                      <div className="space-y-3 p-4">
                        {tasksForDay.length === 0 ? (
                          <div className="py-8 text-center text-sm text-muted-foreground">
                            لا توجد مهام لهذا اليوم
                          </div>
                        ) : (
                          tasksForDay.map((task) => (
                            <div
                              key={task.id}
                              className="rounded-lg border border-border/60 p-3"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="space-y-1">
                                  <div className="text-sm font-semibold">{task.phone_number}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {task.notes || "بدون ملاحظات"}
                                  </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                  {task.call_status !== "completed" && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        updateTaskStatus.mutate({
                                          id: task.id,
                                          updates: { call_status: "completed" },
                                        })
                                      }
                                    >
                                      إكمال
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => onTaskClick?.(task)}
                                  >
                                    تفاصيل
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </PopoverContent>
                </Popover>
              );
            },
          }}
        />
      </CardContent>
    </Card>
  );
}
