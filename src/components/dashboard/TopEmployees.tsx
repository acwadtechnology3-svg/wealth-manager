import { Trophy, TrendingUp, Users } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

const employees = [
  {
    id: 1,
    name: "سارة أحمد",
    clients: 45,
    totalInvestment: 2500000,
    commission: 125000,
    performance: 95,
  },
  {
    id: 2,
    name: "خالد محمود",
    clients: 38,
    totalInvestment: 2100000,
    commission: 105000,
    performance: 88,
  },
  {
    id: 3,
    name: "محمد علي",
    clients: 32,
    totalInvestment: 1800000,
    commission: 90000,
    performance: 82,
  },
  {
    id: 4,
    name: "نورا حسين",
    clients: 28,
    totalInvestment: 1500000,
    commission: 75000,
    performance: 75,
  },
];

export function TopEmployees() {
  return (
    <div className="rounded-xl border bg-card p-6 shadow-card animate-slide-up">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">أفضل الموظفين</h3>
          <p className="text-sm text-muted-foreground">
            ترتيب الموظفين حسب الأداء الشهري
          </p>
        </div>
        <Trophy className="h-6 w-6 text-warning" />
      </div>
      <div className="space-y-6">
        {employees.map((employee, index) => (
          <div
            key={employee.id}
            className="flex items-center gap-4 rounded-lg p-3 transition-colors hover:bg-muted/50"
          >
            <div className="relative">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {employee.name
                    .split(" ")
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
                <span className="text-sm font-semibold text-success">
                  {employee.commission.toLocaleString()} ج.م
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {employee.clients} عميل
                </span>
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {(employee.totalInvestment / 1000000).toFixed(1)}M ج.م
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Progress value={employee.performance} className="h-2 flex-1" />
                <span className="text-xs font-medium text-muted-foreground">
                  {employee.performance}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
