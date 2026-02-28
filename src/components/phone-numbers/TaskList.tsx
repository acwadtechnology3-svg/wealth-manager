import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import type { PhoneNumber } from "@/types/database";

interface TaskListProps {
  tasks: PhoneNumber[];
  loading?: boolean;
  onTaskUpdate?: (taskId: string, updates: Partial<PhoneNumber>) => void;
  onTaskClick?: (task: PhoneNumber) => void;
  showFilters?: boolean;
  emptyMessage?: string;
}

const statusLabels: Record<string, string> = {
  pending: "قيد الانتظار",
  in_progress: "قيد التنفيذ",
  completed: "مكتملة",
  cancelled: "ملغاة",
  called: "تم الاتصال",
  interested: "مهتم",
  not_interested: "غير مهتم",
  callback: "إعادة اتصال",
  converted: "تم التحويل",
};

const statusColors: Record<string, string> = {
  pending: "bg-blue-100 text-blue-700",
  in_progress: "bg-yellow-100 text-yellow-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-gray-200 text-gray-700",
};

const priorityLabels: Record<string, string> = {
  low: "منخفضة",
  medium: "متوسطة",
  high: "عالية",
  urgent: "عاجلة",
};

const priorityColors: Record<string, string> = {
  low: "bg-gray-100 text-gray-700",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
};

const priorityRank: Record<string, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export function TaskList({
  tasks,
  loading = false,
  onTaskUpdate,
  onTaskClick,
  showFilters = true,
  emptyMessage = "لا توجد مهام حالياً",
}: TaskListProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("due_date");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  const filteredTasks = useMemo(() => {
    const query = searchQuery.trim();

    return tasks
      .filter((task) => {
        if (statusFilter !== "all" && task.call_status !== statusFilter) return false;
        if (priorityFilter !== "all" && task.priority !== priorityFilter) return false;
        if (query && !task.phone_number.includes(query)) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "priority") {
          return (priorityRank[b.priority] ?? 0) - (priorityRank[a.priority] ?? 0);
        }
        const aDate = a.due_date ? new Date(a.due_date).getTime() : Number.MAX_SAFE_INTEGER;
        const bDate = b.due_date ? new Date(b.due_date).getTime() : Number.MAX_SAFE_INTEGER;
        return aDate - bDate;
      });
  }, [tasks, statusFilter, priorityFilter, searchQuery, sortBy]);

  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / pageSize));
  const paginatedTasks = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredTasks.slice(start, start + pageSize);
  }, [filteredTasks, page]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-12 animate-pulse rounded-md bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showFilters && (
        <div className="flex flex-wrap items-center gap-3">
          <Input
            placeholder="ابحث برقم الهاتف"
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value);
              setPage(1);
            }}
            className="w-56"
          />
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الحالات</SelectItem>
              <SelectItem value="pending">قيد الانتظار</SelectItem>
              <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
              <SelectItem value="completed">مكتملة</SelectItem>
              <SelectItem value="cancelled">ملغاة</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={priorityFilter}
            onValueChange={(value) => {
              setPriorityFilter(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="الأولوية" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الأولويات</SelectItem>
              <SelectItem value="low">منخفضة</SelectItem>
              <SelectItem value="medium">متوسطة</SelectItem>
              <SelectItem value="high">عالية</SelectItem>
              <SelectItem value="urgent">عاجلة</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="ترتيب" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="due_date">الأقرب موعداً</SelectItem>
              <SelectItem value="priority">الأعلى أولوية</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {filteredTasks.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border/70 py-10 text-center text-sm text-muted-foreground">
          {emptyMessage}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>رقم الهاتف</TableHead>
              <TableHead>الموظف</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>الأولوية</TableHead>
              <TableHead>موعد الاستحقاق</TableHead>
              <TableHead>إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedTasks.map((task) => {
              const dueDate = task.due_date ? new Date(task.due_date) : null;
              const isOverdue =
                dueDate && task.call_status !== "completed" && dueDate.getTime() < today.getTime();
              const assigneeName =
                (task as PhoneNumber & { assignee?: { full_name?: string | null; email?: string } })
                  .assignee?.full_name ||
                (task as PhoneNumber & { assignee?: { full_name?: string | null; email?: string } })
                  .assignee?.email ||
                task.assigned_employee_name ||
                "-";

              return (
                <TableRow key={task.id}>
                  <TableCell className="font-medium">{task.phone_number}</TableCell>
                  <TableCell>{assigneeName}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[task.call_status] || "bg-muted text-muted-foreground"}>
                      {statusLabels[task.call_status] || task.call_status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={priorityColors[task.priority] || "bg-muted text-muted-foreground"}>
                      {priorityLabels[task.priority] || task.priority}
                    </Badge>
                  </TableCell>
                  <TableCell className={isOverdue ? "text-red-600" : "text-muted-foreground"}>
                    {dueDate ? dueDate.toLocaleDateString("ar-EG") : "بدون موعد"}
                    {isOverdue && <span className="mr-2 text-xs">متأخرة</span>}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      {task.call_status !== "completed" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            onTaskUpdate?.(task.id, {
                              call_status: "completed",
                              completed_at: new Date().toISOString(),
                            })
                          }
                        >
                          إكمال
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => onTaskClick?.(task)}>
                        عرض
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => onTaskClick?.(task)}>
                        ملاحظات
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      {filteredTasks.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            صفحة {page} من {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            >
              السابق
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page === totalPages}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            >
              التالي
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
