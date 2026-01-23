import { Calendar, ArrowUpCircle, ArrowDownCircle, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

const events = [
  {
    id: 1,
    type: "withdraw",
    client: "أحمد علي محمد",
    amount: 18000,
    date: "2024-02-10",
    status: "upcoming",
  },
  {
    id: 2,
    type: "profit",
    client: "فاطمة حسن",
    amount: 30000,
    date: "2024-02-12",
    status: "upcoming",
  },
  {
    id: 3,
    type: "deposit",
    client: "خالد عمر",
    amount: 100000,
    date: "2024-02-15",
    status: "upcoming",
  },
  {
    id: 4,
    type: "withdraw",
    client: "نورة سعد",
    amount: 54000,
    date: "2024-02-18",
    status: "upcoming",
  },
  {
    id: 5,
    type: "profit",
    client: "محمد سعيد",
    amount: 8500,
    date: "2024-02-20",
    status: "late",
  },
];

const eventConfig = {
  withdraw: {
    icon: ArrowUpCircle,
    label: "سحب",
    className: "bg-destructive/10 text-destructive",
  },
  profit: {
    icon: Wallet,
    label: "أرباح",
    className: "bg-success/10 text-success",
  },
  deposit: {
    icon: ArrowDownCircle,
    label: "إيداع",
    className: "bg-secondary/10 text-secondary",
  },
};

export function UpcomingEvents() {
  return (
    <div className="rounded-xl border bg-card p-6 shadow-card animate-slide-up">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">المواعيد القادمة</h3>
          <p className="text-sm text-muted-foreground">
            إيداعات وسحوبات وأرباح قادمة
          </p>
        </div>
        <Calendar className="h-6 w-6 text-primary" />
      </div>
      <div className="space-y-4">
        {events.map((event) => {
          const config = eventConfig[event.type as keyof typeof eventConfig];
          const Icon = config.icon;
          return (
            <div
              key={event.id}
              className={cn(
                "flex items-center gap-4 rounded-lg border p-4 transition-all",
                "hover:shadow-sm",
                event.status === "late" && "border-destructive/50 bg-destructive/5"
              )}
            >
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg",
                  config.className
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate">{event.client}</p>
                  {event.status === "late" && (
                    <span className="text-xs font-medium text-destructive bg-destructive/10 px-2 py-0.5 rounded">
                      متأخر
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {config.label} - {event.date}
                </p>
              </div>
              <p className="font-semibold">
                {event.amount.toLocaleString()} ج.م
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
