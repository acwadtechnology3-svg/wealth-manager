import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
import { TaskList } from "@/components/phone-numbers/TaskList";
import { useEmployees } from "@/hooks/queries/useProfiles";
import { useTaskStats, useUpdateTaskStatus } from "@/hooks/queries/usePhoneNumbers";
import { supabase } from "@/integrations/supabase/client";
import type { PhoneNumber } from "@/types/database";

interface TaskWithAssignee extends PhoneNumber {
  assignee?: {
    full_name: string | null;
    email: string;
  };
}

export default function TaskManagement() {
  const [activeTab, setActiveTab] = useState("all");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("all");
  const updateTaskStatus = useUpdateTaskStatus();

  const { data: stats } = useTaskStats();
  const { data: employees = [] } = useEmployees();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["phone-numbers", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("phone_numbers")
        .select(
          `*,
           assignee:profiles!phone_numbers_assigned_to_fkey(
             full_name,
             email
           )`
        )
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      return (data || []) as TaskWithAssignee[];
    },
  });

  const filteredTasks = useMemo(() => {
    if (selectedEmployeeId === "all") return tasks;
    return tasks.filter((task) => task.assigned_to === selectedEmployeeId);
  }, [tasks, selectedEmployeeId]);

  const employeeStats = useMemo(() => {
    const map = new Map<string, { total: number; pending: number; inProgress: number; completed: number }>();

    tasks.forEach((task) => {
      const employeeId = task.assigned_to || "unassigned";
      if (!map.has(employeeId)) {
        map.set(employeeId, { total: 0, pending: 0, inProgress: 0, completed: 0 });
      }
      const entry = map.get(employeeId);
      if (!entry) return;
      entry.total += 1;
      if (task.call_status === "pending") entry.pending += 1;
      if (task.call_status === "in_progress") entry.inProgress += 1;
      if (task.call_status === "completed") entry.completed += 1;
    });

    return map;
  }, [tasks]);

  const workloadData = useMemo(() => {
    const rows = employees.map((employee) => {
      const stats = employeeStats.get(employee.user_id || "") || {
        total: 0,
        pending: 0,
        inProgress: 0,
        completed: 0,
      };
      return {
        employee,
        total: stats.total,
      };
    });
    const max = Math.max(1, ...rows.map((row) => row.total));
    const average = rows.reduce((sum, row) => sum + row.total, 0) / Math.max(1, rows.length);

    return rows.map((row) => ({
      ...row,
      percent: Math.round((row.total / max) * 100),
      status: row.total >= average * 1.2 ? "over" : row.total <= average * 0.8 ? "under" : "ok",
    }));
  }, [employees, employeeStats]);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">إدارة المهام</h1>
        </div>

        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">إجمالي المهام</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">قيد الانتظار</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats?.pending ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">قيد التنفيذ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats?.inProgress ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">مكتملة اليوم</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats?.completedToday ?? 0}</div>
            </CardContent>
          </Card>
          <Card className="border-red-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-600">متأخرة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats?.overdue ?? 0}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">كل المهام</TabsTrigger>
            <TabsTrigger value="by-employee">حسب الموظف</TabsTrigger>
            <TabsTrigger value="workload">توزيع العمل</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                  <SelectTrigger className="w-56">
                    <SelectValue placeholder="فلترة حسب الموظف" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل الموظفين</SelectItem>
                    {employees.map((employee) => (
                      <SelectItem key={employee.user_id} value={employee.user_id || ""}>
                        {employee.full_name || employee.email || "بدون اسم"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" disabled>
                  توزيع جماعي (قريباً)
                </Button>
                <Button variant="outline" disabled>
                  تحديث حالة (قريباً)
                </Button>
              </div>
              <div className="text-sm text-muted-foreground">{filteredTasks.length} مهمة</div>
            </div>

            <TaskList
              tasks={filteredTasks}
              loading={isLoading}
              onTaskUpdate={(taskId, updates) => updateTaskStatus.mutate({ id: taskId, updates })}
              onTaskClick={() => undefined}
            />
          </TabsContent>

          <TabsContent value="by-employee">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الموظف</TableHead>
                  <TableHead>الإجمالي</TableHead>
                  <TableHead>قيد الانتظار</TableHead>
                  <TableHead>قيد التنفيذ</TableHead>
                  <TableHead>مكتملة</TableHead>
                  <TableHead>نسبة الإنجاز</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => {
                  const stats = employeeStats.get(employee.user_id || "") || {
                    total: 0,
                    pending: 0,
                    inProgress: 0,
                    completed: 0,
                  };
                  const completionRate = stats.total
                    ? Math.round((stats.completed / stats.total) * 100)
                    : 0;

                  return (
                    <TableRow
                      key={employee.user_id}
                      className="cursor-pointer"
                      onClick={() => {
                        setSelectedEmployeeId(employee.user_id || "all");
                        setActiveTab("all");
                      }}
                    >
                      <TableCell>{employee.full_name || employee.email || "بدون اسم"}</TableCell>
                      <TableCell>{stats.total}</TableCell>
                      <TableCell>{stats.pending}</TableCell>
                      <TableCell>{stats.inProgress}</TableCell>
                      <TableCell>{stats.completed}</TableCell>
                      <TableCell>{completionRate}%</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="workload" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                توزيع المهام حسب الموظف
              </div>
              <Button variant="outline" disabled>
                إعادة توزيع (قريباً)
              </Button>
            </div>
            <div className="space-y-4">
              {workloadData.map((row) => (
                <div key={row.employee.user_id} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>{row.employee.full_name || row.employee.email || "بدون اسم"}</span>
                    <span className="text-muted-foreground">{row.total} مهمة</span>
                  </div>
                  <Progress value={row.percent} />
                  {row.status !== "ok" && (
                    <div className="text-xs text-muted-foreground">
                      {row.status === "over" ? "حمولة مرتفعة" : "حمولة منخفضة"}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
