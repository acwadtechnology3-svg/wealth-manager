import { Trophy, TrendingUp, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import type { TopEmployee } from "@/api/dashboard";

interface TopEmployeesProps {
  employees: TopEmployee[];
  isLoading?: boolean;
}

export function TopEmployees({ employees, isLoading }: TopEmployeesProps) {
  return (
    <div className="rounded-xl border bg-card p-6 shadow-card animate-slide-up">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">أفضل الموظفين</h3>
          <p className="text-sm text-muted-foreground">
            ترتيب الموظفين حسب إجمالي الاستثمارات
          </p>
        </div>
        <Trophy className="h-6 w-6 text-warning" />
      </div>
      <div className="space-y-6">
        {isLoading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-4 rounded-lg p-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                  <Skeleton className="h-2 w-full" />
                </div>
              </div>
            ))}
          </>
        ) : employees.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>لا يوجد بيانات للموظفين</p>
          </div>
        ) : (
          employees.map((employee, index) => (
            <div
              key={employee.id}
              className="flex items-center gap-4 rounded-lg p-3 transition-colors hover:bg-muted/50"
            >
              <div className="relative">
                <Avatar className="h-12 w-12">
                  {employee.avatar && <AvatarImage src={employee.avatar} />}
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {employee.name
                      .split(" ")
                      .slice(0, 2)
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                {index < 3 && (
                  <span
                    className={`absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-primary-foreground ${
                      index === 0
                        ? "bg-warning"
                        : index === 1
                        ? "bg-muted-foreground"
                        : "bg-warning/60"
                    }`}
                  >
                    {index + 1}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-semibold truncate">{employee.name}</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {employee.clientsCount} عميل
                  </span>
                  <span className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {(employee.totalInvestments / 1000000).toFixed(1)}M ج.م
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
