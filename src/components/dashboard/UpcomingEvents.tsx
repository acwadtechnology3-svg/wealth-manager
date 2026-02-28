import { Calendar, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { UpcomingWithdrawal } from "@/api/dashboard";

interface UpcomingEventsProps {
  withdrawals: UpcomingWithdrawal[];
  isLoading?: boolean;
}

export function UpcomingEvents({ withdrawals, isLoading }: UpcomingEventsProps) {
  return (
    <div className="rounded-xl border bg-card p-6 shadow-card animate-slide-up">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">مواعيد السحب القادمة</h3>
          <p className="text-sm text-muted-foreground">
            مواعيد صرف الأرباح المجدولة
          </p>
        </div>
        <Calendar className="h-6 w-6 text-primary" />
      </div>
      <div className="space-y-4">
        {isLoading ? (
          <>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 rounded-lg border p-4">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </>
        ) : withdrawals.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>لا توجد مواعيد سحب قادمة</p>
          </div>
        ) : (
          withdrawals.map((withdrawal) => {
            const isOverdue = new Date(withdrawal.scheduledDate) < new Date();
            return (
              <div
                key={withdrawal.id}
                className={cn(
                  "flex items-center gap-4 rounded-lg border p-4 transition-all",
                  "hover:shadow-sm",
                  isOverdue && "border-destructive/50 bg-destructive/5"
                )}
              >
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg",
                    isOverdue
                      ? "bg-destructive/10 text-destructive"
                      : "bg-success/10 text-success"
                  )}
                >
                  <Wallet className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{withdrawal.clientName}</p>
                    {isOverdue && (
                      <span className="text-xs font-medium text-destructive bg-destructive/10 px-2 py-0.5 rounded">
                        متأخر
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    أرباح - {new Date(withdrawal.scheduledDate).toLocaleDateString('ar-EG', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <p className="font-semibold">
                  {withdrawal.amount.toLocaleString()} ج.م
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
