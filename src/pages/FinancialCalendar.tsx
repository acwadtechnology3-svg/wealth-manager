import { useState, useMemo } from "react";
import {
  ChevronRight,
  ChevronLeft,
  ArrowUpCircle,
  ArrowDownCircle,
  Wallet,
  Filter,
  Plus,
  X,
  Users,
  Image,
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  useWithdrawalsWithClients,
  useCreateWithdrawal,
  useWithdrawalsByDeposit,
} from "@/hooks/queries/useWithdrawals";
import { useClientsWithDeposits } from "@/hooks/queries/useClients";
import { useMeetings } from "@/hooks/queries/useMeetings";
import { usePosters } from "@/hooks/queries/usePosters";
import { format, startOfMonth, endOfMonth } from "date-fns";

type CalendarEvent = {
  id?: string;
  date: string;
  type: "withdraw" | "profit" | "deposit" | "meeting" | "poster";
  client?: string;
  clientCode?: string;
  clientPhone?: string;
  amount?: number;
  status?: "done" | "upcoming" | "late";
  title?: string; // For meetings and posters
  description?: string; // For meetings
  responsibleEmployee?: string; // For meetings
  depositId?: string;
  depositNumber?: string;
  depositAmount?: number;
  profitRate?: number;
  depositDate?: string;
  depositStatus?: string;
};

const eventConfig = {
  withdraw: { icon: ArrowUpCircle, label: "سحب", color: "bg-destructive/10 text-destructive border-destructive/20" },
  profit: { icon: Wallet, label: "أرباح", color: "bg-success/10 text-success border-success/20" },
  deposit: { icon: ArrowDownCircle, label: "إيداع", color: "bg-secondary/10 text-secondary border-secondary/20" },
  meeting: { icon: Users, label: "اجتماع", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  poster: { icon: Image, label: "ملصق", color: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
};

const statusConfig = {
  done: { label: "تم", color: "bg-success text-success-foreground" },
  upcoming: { label: "قادم", color: "bg-warning text-warning-foreground" },
  late: { label: "متأخر", color: "bg-destructive text-destructive-foreground" },
};

const daysOfWeek = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

export default function FinancialCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // Add Event Dialog State
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newEventType, setNewEventType] = useState<"withdraw" | "deposit">("withdraw");
  const [newEventDate, setNewEventDate] = useState("");
  const [newEventAmount, setNewEventAmount] = useState("");
  const [selectedDepositId, setSelectedDepositId] = useState("");

  // Fetch clients with deposits for the dialog
  const { data: clients = [] } = useClientsWithDeposits();
  const createWithdrawal = useCreateWithdrawal();

  const selectedEventDepositId = selectedEvent?.depositId;
  const { data: depositWithdrawals = [], isLoading: isLoadingDepositWithdrawals } =
    useWithdrawalsByDeposit(selectedEventDepositId);

  // Calculate date range for the current month
  const monthStart = useMemo(() => {
    return format(startOfMonth(currentDate), "yyyy-MM-dd");
  }, [currentDate]);

  const monthEnd = useMemo(() => {
    return format(endOfMonth(currentDate), "yyyy-MM-dd");
  }, [currentDate]);

  // Fetch withdrawals for the current month
  const { data: withdrawals = [], isLoading } = useWithdrawalsWithClients({
    startDate: monthStart,
    endDate: monthEnd,
  });

  // Fetch meetings for the current month
  const { data: meetings = [] } = useMeetings({
    startDate: monthStart,
    endDate: monthEnd,
  });

  // Fetch posters for the current month
  const { data: posters = [] } = usePosters({
    startDate: monthStart,
    endDate: monthEnd,
  });

  // Map withdrawals to calendar events
  const events = useMemo((): CalendarEvent[] => {
    const withdrawalEvents = withdrawals.map((withdrawal) => {
      const clientName = withdrawal.client_deposits?.clients?.name || "عميل غير معروف";

      // Map withdrawal status to calendar status
      let eventStatus: "done" | "upcoming" | "late" = "upcoming";
      if (withdrawal.status === "completed") {
        eventStatus = "done";
      } else if (withdrawal.status === "overdue" || withdrawal.due_date < new Date().toISOString().split("T")[0]) {
        eventStatus = "late";
      }

      return {
        id: withdrawal.id,
        date: withdrawal.due_date,
        type: "withdraw" as const,
        client: clientName,
        clientCode: withdrawal.client_deposits?.clients?.code,
        clientPhone: withdrawal.client_deposits?.clients?.phone,
        amount: withdrawal.amount,
        status: eventStatus,
        depositId: withdrawal.deposit_id,
        depositNumber: withdrawal.client_deposits?.deposit_number,
        depositAmount: withdrawal.client_deposits?.amount,
        profitRate: withdrawal.client_deposits?.profit_rate,
        depositDate: withdrawal.client_deposits?.deposit_date,
        depositStatus: withdrawal.client_deposits?.status,
      };
    });

    // Show every active deposit as a recurring monthly event.
    // Each deposit appears on the same day-of-month as its deposit_date,
    // for every month from the deposit date onwards.
    const depositEvents: CalendarEvent[] = [];
    const calYear = currentDate.getFullYear();
    const calMonth = currentDate.getMonth(); // 0-indexed
    const daysInCalMonth = new Date(calYear, calMonth + 1, 0).getDate();

    for (const client of clients) {
      for (const deposit of (client.client_deposits || [])) {
        if (!deposit.deposit_date) continue;
        // Skip closed deposits
        if (deposit.status === "completed" || deposit.status === "cancelled") continue;

        const depDate = new Date(deposit.deposit_date);
        const depYear = depDate.getFullYear();
        const depMonth = depDate.getMonth(); // 0-indexed

        // Only show for months at or after the deposit month
        if (depYear * 12 + depMonth > calYear * 12 + calMonth) continue;

        // Project onto the current month (cap day at month length, e.g. Jan 31 → Feb 28)
        const depDay = depDate.getDate();
        const dayInCalMonth = Math.min(depDay, daysInCalMonth);
        const eventDate = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(dayInCalMonth).padStart(2, "0")}`;

        depositEvents.push({
          id: `contract-${deposit.id}`,
          date: eventDate,
          type: "deposit" as const,
          client: client.name,
          clientCode: client.code,
          clientPhone: client.phone,
          amount: deposit.amount,
          status: "done" as const,
          depositId: deposit.id,
          depositNumber: deposit.deposit_number,
          depositAmount: deposit.amount,
          profitRate: deposit.profit_rate,
          depositDate: deposit.deposit_date,
          depositStatus: deposit.status,
        });
      }
    }

    const meetingEvents = meetings.map((meeting) => ({
      id: meeting.id,
      date: meeting.meeting_date,
      type: "meeting" as const,
      title: meeting.title,
      description: meeting.description || undefined,
      responsibleEmployee: meeting.responsible_employee?.full_name || "غير محدد",
      status: "upcoming" as const,
    }));

    const posterEvents = posters.map((poster) => ({
      id: poster.id,
      date: poster.poster_date,
      type: "poster" as const,
      title: poster.title,
      status: "upcoming" as const,
    }));

    return [...withdrawalEvents, ...depositEvents, ...meetingEvents, ...posterEvents];
  }, [withdrawals, clients, meetings, posters, monthStart, monthEnd]);

  const selectedDepositSummary = useMemo(() => {
    const totalScheduled = depositWithdrawals.reduce((sum, w) => sum + w.amount, 0);
    const totalCompleted = depositWithdrawals
      .filter((w) => w.status === "completed")
      .reduce((sum, w) => sum + w.amount, 0);
    const totalUpcoming = depositWithdrawals
      .filter((w) => w.status === "upcoming")
      .reduce((sum, w) => sum + w.amount, 0);
    const totalOverdue = depositWithdrawals
      .filter((w) => w.status === "overdue")
      .reduce((sum, w) => sum + w.amount, 0);
    const depositAmount = selectedEvent?.depositAmount || 0;
    const availableAmount = Math.max(depositAmount - totalCompleted, 0);

    return {
      totalScheduled,
      totalCompleted,
      totalUpcoming,
      totalOverdue,
      availableAmount,
    };
  }, [depositWithdrawals, selectedEvent?.depositAmount]);

  const getEventLabel = (event: CalendarEvent) => event.client || event.title || "حدث";
  const formatMoney = (value?: number) =>
    typeof value === "number" ? `${value.toLocaleString()} ج.م` : "-";
  const selectedTypeConfig = selectedEvent ? eventConfig[selectedEvent.type] : null;
  const selectedStatusConfig = selectedEvent?.status ? statusConfig[selectedEvent.status] : null;
  const getEventsForDate = (dateStr: string) =>
    events.filter((e) => {
      const matchesType = typeFilter === "all" || e.type === typeFilter;
      const matchesStatus = statusFilter === "all" || e.status === statusFilter;
      return e.date === dateStr && matchesType && matchesStatus;
    });
  const selectedDayEvents = useMemo(
    () => (selectedDay ? getEventsForDate(selectedDay) : []),
    [selectedDay, events, typeFilter, statusFilter]
  );

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    return { daysInMonth, startingDay };
  };

  const { daysInMonth, startingDay } = getDaysInMonth(currentDate);

  const getDateStringForDay = (day: number) => {
    const year = currentDate.getFullYear();
    const month = (currentDate.getMonth() + 1).toString().padStart(2, "0");
    const dayStr = day.toString().padStart(2, "0");
    return `${year}-${month}-${dayStr}`;
  };

  const getEventsForDay = (day: number) => getEventsForDate(getDateStringForDay(day));

  const navigateMonth = (direction: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
  };

  const handleAddEvent = async () => {
    if (!selectedDepositId || !newEventDate || !newEventAmount) {
      return;
    }

    try {
      await createWithdrawal.mutateAsync({
        deposit_id: selectedDepositId,
        due_date: newEventDate,
        amount: parseFloat(newEventAmount),
        status: 'upcoming',
      });

      // Reset form and close dialog
      setIsAddDialogOpen(false);
      setNewEventDate("");
      setNewEventAmount("");
      setSelectedDepositId("");
      setNewEventType("withdraw");
    } catch (error) {
      // Error is handled by the mutation hook
    }
  };

  const monthNames = [
    "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
    "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
  ];

  // Loading state
  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">التقويم المالي</h1>
              <p className="text-muted-foreground mt-1">متابعة مواعيد الإيداعات والسحوبات والأرباح</p>
            </div>
          </div>
          <div className="rounded-xl border bg-card shadow-card p-6">
            <Skeleton className="h-[600px] w-full" />
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Dialog
        open={!!selectedEvent}
        onOpenChange={(open) => {
          if (!open) setSelectedEvent(null);
        }}
      >
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>{selectedEvent ? getEventLabel(selectedEvent) : "تفاصيل الحدث"}</DialogTitle>
            {selectedEvent && (
              <DialogDescription>
                {selectedTypeConfig?.label} • {selectedEvent.date}
              </DialogDescription>
            )}
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                {selectedTypeConfig && (
                  <Badge className={cn("h-6", selectedTypeConfig.color)}>
                    {selectedTypeConfig.label}
                  </Badge>
                )}
                {selectedStatusConfig && (
                  <Badge className={cn("h-6", selectedStatusConfig.color)}>
                    {selectedStatusConfig.label}
                  </Badge>
                )}
              </div>

              {selectedEvent.client && (
                <div className="rounded-lg border p-4">
                  <p className="text-sm font-semibold mb-3">بيانات العميل</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">الاسم</p>
                      <p className="font-medium">{selectedEvent.client}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">الكود</p>
                      <p className="font-medium">{selectedEvent.clientCode || "-"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">الهاتف</p>
                      <p className="font-medium">{selectedEvent.clientPhone || "-"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">تاريخ السحب</p>
                      <p className="font-medium">{selectedEvent.date}</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedEvent.depositId && (
                <div className="rounded-lg border p-4">
                  <p className="text-sm font-semibold mb-3">تفاصيل الإيداع</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">رقم الإيداع</p>
                      <p className="font-medium">{selectedEvent.depositNumber || "-"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">تاريخ الإيداع</p>
                      <p className="font-medium">{selectedEvent.depositDate || "-"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">قيمة الإيداع</p>
                      <p className="font-medium">{formatMoney(selectedEvent.depositAmount)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">نسبة الربح</p>
                      <p className="font-medium">
                        {typeof selectedEvent.profitRate === "number" ? `${selectedEvent.profitRate}%` : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">مبلغ السحب</p>
                      <p className="font-medium">{formatMoney(selectedEvent.amount)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">حالة الإيداع</p>
                      <p className="font-medium">{selectedEvent.depositStatus || "-"}</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedEvent.depositId && (
                <div className="rounded-lg border p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold">الرصيد المتاح</p>
                    <p className="text-sm font-semibold text-success">
                      {formatMoney(selectedDepositSummary.availableAmount)}
                    </p>
                  </div>
                  {isLoadingDepositWithdrawals ? (
                    <div className="grid grid-cols-2 gap-3">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">إجمالي المسحوبات</p>
                        <p className="font-medium">{formatMoney(selectedDepositSummary.totalScheduled)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">منصرف</p>
                        <p className="font-medium">{formatMoney(selectedDepositSummary.totalCompleted)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">قادم</p>
                        <p className="font-medium">{formatMoney(selectedDepositSummary.totalUpcoming)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">متأخر</p>
                        <p className="font-medium">{formatMoney(selectedDepositSummary.totalOverdue)}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {selectedEvent.type === "meeting" && (
                <div className="rounded-lg border p-4">
                  <p className="text-sm font-semibold mb-3">تفاصيل الاجتماع</p>
                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">المسؤول</p>
                      <p className="font-medium">{selectedEvent.responsibleEmployee || "-"}</p>
                    </div>
                    {selectedEvent.description && (
                      <div>
                        <p className="text-muted-foreground">الوصف</p>
                        <p className="font-medium">{selectedEvent.description}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedEvent(null)}>
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!selectedDay}
        onOpenChange={(open) => {
          if (!open) setSelectedDay(null);
        }}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>تفاصيل اليوم</DialogTitle>
            <DialogDescription>
              {selectedDay} • {selectedDayEvents.length} حدث
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {selectedDayEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center">لا توجد أحداث لهذا اليوم</p>
            ) : (
              selectedDayEvents.map((event, idx) => {
                const config = eventConfig[event.type as keyof typeof eventConfig];
                const Icon = config.icon;
                return (
                  <button
                    key={`${event.id ?? event.date}-${idx}`}
                    type="button"
                    onClick={() => {
                      setSelectedDay(null);
                      setSelectedEvent(event);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg border px-4 py-3 text-right transition-colors hover:bg-muted/60",
                      config.color
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", config.color)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium">{getEventLabel(event)}</p>
                        <p className="text-xs text-muted-foreground">{event.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {typeof event.amount === "number" && (
                        <p className="text-sm font-semibold">{formatMoney(event.amount)}</p>
                      )}
                      {event.status && (
                        <Badge className={cn("h-5", statusConfig[event.status].color)}>
                          {statusConfig[event.status].label}
                        </Badge>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedDay(null)}>
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between animate-slide-right">
          <div>
            <h1 className="text-3xl font-bold text-foreground">التقويم المالي</h1>
            <p className="text-muted-foreground mt-1">
              متابعة مواعيد السحوبات (البيانات المتاحة: السحوبات فقط)
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="ml-2 h-4 w-4" />
                إضافة تاريخ
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>إضافة موعد جديد</DialogTitle>
                <DialogDescription>
                  أضف موعد سحب جديد لعميل محدد
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="event-type">نوع العملية</Label>
                  <Select value={newEventType} onValueChange={(v) => setNewEventType(v as "withdraw" | "deposit")}>
                    <SelectTrigger id="event-type">
                      <SelectValue placeholder="اختر النوع" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="withdraw">سحب</SelectItem>
                      <SelectItem value="deposit">إيداع</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="client-deposit">العميل / الإيداع</Label>
                  <Select value={selectedDepositId} onValueChange={setSelectedDepositId}>
                    <SelectTrigger id="client-deposit">
                      <SelectValue placeholder="اختر العميل والإيداع" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        client.client_deposits?.map((deposit) => (
                          <SelectItem key={deposit.id} value={deposit.id}>
                            {client.name} - {deposit.deposit_number} ({deposit.amount?.toLocaleString()} ج.م)
                          </SelectItem>
                        ))
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="event-date">التاريخ</Label>
                  <Input
                    id="event-date"
                    type="date"
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="event-amount">المبلغ</Label>
                  <Input
                    id="event-amount"
                    type="number"
                    placeholder="أدخل المبلغ"
                    value={newEventAmount}
                    onChange={(e) => setNewEventAmount(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button
                  onClick={handleAddEvent}
                  disabled={!selectedDepositId || !newEventDate || !newEventAmount || createWithdrawal.isPending}
                >
                  {createWithdrawal.isPending ? "جاري الحفظ..." : "حفظ"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 animate-fade-in">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40">
              <Filter className="ml-2 h-4 w-4" />
              <SelectValue placeholder="النوع" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الأنواع</SelectItem>
              <SelectItem value="deposit">إيداع</SelectItem>
              <SelectItem value="withdraw">سحب</SelectItem>
              <SelectItem value="profit">أرباح</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              <SelectItem value="done">تم</SelectItem>
              <SelectItem value="upcoming">قادم</SelectItem>
              <SelectItem value="late">متأخر</SelectItem>
            </SelectContent>
          </Select>

          {/* Legend */}
          <div className="flex items-center gap-4 mr-auto">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-success" />
              <span className="text-sm text-muted-foreground">تم</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-warning" />
              <span className="text-sm text-muted-foreground">قادم</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-destructive" />
              <span className="text-sm text-muted-foreground">متأخر</span>
            </div>
          </div>
        </div>

        {/* Calendar */}
        <div className="rounded-xl border bg-card shadow-card animate-slide-up">
          {/* Calendar Header */}
          <div className="flex items-center justify-between border-b p-6">
            <Button variant="ghost" size="icon" onClick={() => navigateMonth(-1)}>
              <ChevronRight className="h-5 w-5" />
            </Button>
            <h2 className="text-xl font-bold">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <Button variant="ghost" size="icon" onClick={() => navigateMonth(1)}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </div>

          {/* Days of Week */}
          <div className="grid grid-cols-7 border-b">
            {daysOfWeek.map((day) => (
              <div
                key={day}
                className="p-4 text-center text-sm font-semibold text-muted-foreground"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7">
            {/* Empty cells for days before the 1st */}
            {Array.from({ length: startingDay }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-32 border-b border-l p-2" />
            ))}

            {/* Days of the month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayEvents = getEventsForDay(day);

              // Check if this day is today
              const today = new Date();
              const isToday =
                day === today.getDate() &&
                currentDate.getMonth() === today.getMonth() &&
                currentDate.getFullYear() === today.getFullYear();

              const dayDateStr = getDateStringForDay(day);
              return (
                <div
                  key={day}
                  onClick={() => dayEvents.length > 0 && setSelectedDay(dayDateStr)}
                  className={cn(
                    "min-h-32 border-b border-l p-2 transition-colors",
                    dayEvents.length > 0 && "cursor-pointer hover:bg-muted/50",
                    isToday && "bg-primary/5"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold",
                      isToday && "bg-primary text-primary-foreground"
                    )}
                  >
                    {day}
                  </div>
                  <div className="mt-1 space-y-0.5 max-h-40 overflow-y-auto">
                    {dayEvents.map((event, idx) => {
                      const config = eventConfig[event.type as keyof typeof eventConfig];
                      const Icon = config.icon;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(event);
                          }}
                          className={cn(
                            "flex w-full items-center gap-1 rounded px-1.5 py-0.5 text-xs transition-colors hover:opacity-80",
                            config.color
                          )}
                        >
                          <Icon className="h-3 w-3 shrink-0" />
                          <span className="truncate font-medium">{getEventLabel(event)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Events List */}
        <div className="grid gap-6 lg:grid-cols-3">
          {Object.entries(eventConfig).map(([type, config]) => {
            const Icon = config.icon;
            const filteredEvents = events.filter((e) => e.type === type);
            return (
              <div key={type} className="rounded-xl border bg-card p-6 shadow-card">
                <div className="flex items-center gap-3 mb-4">
                  <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", config.color)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{config.label}</h3>
                    <p className="text-sm text-muted-foreground">{filteredEvents.length} حدث</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {filteredEvents.slice(0, 4).map((event, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedEvent(event)}
                      className="flex w-full items-center justify-between rounded-lg bg-muted/50 p-3 text-right transition-colors hover:bg-muted"
                    >
                      <div>
                        <p className="font-medium">{getEventLabel(event)}</p>
                        <p className="text-xs text-muted-foreground">{event.date}</p>
                      </div>
                      <div className="text-left">
                        <p className="font-semibold">{formatMoney(event.amount)}</p>
                        <Badge className={cn("h-5", statusConfig[event.status as keyof typeof statusConfig].color)}>
                          {statusConfig[event.status as keyof typeof statusConfig].label}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </MainLayout>
  );
}
