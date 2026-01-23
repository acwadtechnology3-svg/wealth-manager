import { useState } from "react";
import {
  ChevronRight,
  ChevronLeft,
  ArrowUpCircle,
  ArrowDownCircle,
  Wallet,
  Filter,
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const events = [
  { date: "2024-02-05", type: "deposit", client: "أحمد علي", amount: 50000, status: "done" },
  { date: "2024-02-08", type: "profit", client: "محمد سعيد", amount: 8500, status: "late" },
  { date: "2024-02-10", type: "withdraw", client: "فاطمة حسن", amount: 30000, status: "upcoming" },
  { date: "2024-02-12", type: "profit", client: "خالد عمر", amount: 4000, status: "upcoming" },
  { date: "2024-02-15", type: "deposit", client: "نورة سعد", amount: 100000, status: "upcoming" },
  { date: "2024-02-18", type: "withdraw", client: "يوسف أحمد", amount: 13200, status: "upcoming" },
  { date: "2024-02-20", type: "profit", client: "سارة محمد", amount: 18000, status: "upcoming" },
  { date: "2024-02-22", type: "deposit", client: "عمر خالد", amount: 75000, status: "upcoming" },
  { date: "2024-02-25", type: "withdraw", client: "هالة أحمد", amount: 25000, status: "upcoming" },
];

const eventConfig = {
  withdraw: { icon: ArrowUpCircle, label: "سحب", color: "bg-destructive/10 text-destructive border-destructive/20" },
  profit: { icon: Wallet, label: "أرباح", color: "bg-success/10 text-success border-success/20" },
  deposit: { icon: ArrowDownCircle, label: "إيداع", color: "bg-secondary/10 text-secondary border-secondary/20" },
};

const statusConfig = {
  done: { label: "تم", color: "bg-success text-success-foreground" },
  upcoming: { label: "قادم", color: "bg-warning text-warning-foreground" },
  late: { label: "متأخر", color: "bg-destructive text-destructive-foreground" },
};

const daysOfWeek = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

export default function FinancialCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date(2024, 1, 1));
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

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

  const getEventsForDay = (day: number) => {
    const dateStr = `2024-02-${day.toString().padStart(2, "0")}`;
    return events.filter((e) => {
      const matchesType = typeFilter === "all" || e.type === typeFilter;
      const matchesStatus = statusFilter === "all" || e.status === statusFilter;
      return e.date === dateStr && matchesType && matchesStatus;
    });
  };

  const navigateMonth = (direction: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
  };

  const monthNames = [
    "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
    "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between animate-slide-right">
          <div>
            <h1 className="text-3xl font-bold text-foreground">التقويم المالي</h1>
            <p className="text-muted-foreground mt-1">
              متابعة مواعيد الإيداعات والسحوبات والأرباح
            </p>
          </div>
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
              const isToday = day === 8; // Simulating today as Feb 8

              return (
                <div
                  key={day}
                  className={cn(
                    "min-h-32 border-b border-l p-2 transition-colors hover:bg-muted/50",
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
                  <div className="mt-2 space-y-1">
                    {dayEvents.slice(0, 3).map((event, idx) => {
                      const config = eventConfig[event.type as keyof typeof eventConfig];
                      const Icon = config.icon;
                      return (
                        <div
                          key={idx}
                          className={cn(
                            "flex items-center gap-1 rounded px-2 py-1 text-xs",
                            config.color
                          )}
                        >
                          <Icon className="h-3 w-3 shrink-0" />
                          <span className="truncate">{event.client}</span>
                          <Badge
                            className={cn(
                              "mr-auto h-4 px-1 text-[10px]",
                              statusConfig[event.status as keyof typeof statusConfig].color
                            )}
                          >
                            {statusConfig[event.status as keyof typeof statusConfig].label}
                          </Badge>
                        </div>
                      );
                    })}
                    {dayEvents.length > 3 && (
                      <p className="text-xs text-muted-foreground text-center">
                        +{dayEvents.length - 3} المزيد
                      </p>
                    )}
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
                    <div key={idx} className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                      <div>
                        <p className="font-medium">{event.client}</p>
                        <p className="text-xs text-muted-foreground">{event.date}</p>
                      </div>
                      <div className="text-left">
                        <p className="font-semibold">{event.amount.toLocaleString()} ج.م</p>
                        <Badge className={cn("h-5", statusConfig[event.status as keyof typeof statusConfig].color)}>
                          {statusConfig[event.status as keyof typeof statusConfig].label}
                        </Badge>
                      </div>
                    </div>
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
