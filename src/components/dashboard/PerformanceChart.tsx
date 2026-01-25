import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

const data = [
  { month: "يناير", investments: 400000, profits: 48000 },
  { month: "فبراير", investments: 550000, profits: 66000 },
  { month: "مارس", investments: 720000, profits: 86400 },
  { month: "أبريل", investments: 890000, profits: 106800 },
  { month: "مايو", investments: 1100000, profits: 132000 },
  { month: "يونيو", investments: 1350000, profits: 162000 },
];

interface PerformanceChartProps {
  isLoading?: boolean;
}

export function PerformanceChart({ isLoading }: PerformanceChartProps) {
  return (
    <div className="rounded-xl border bg-card p-6 shadow-card animate-slide-up">
      <div className="mb-6">
        <h3 className="text-lg font-semibold">أداء الاستثمارات</h3>
        <p className="text-sm text-muted-foreground">
          إجمالي الاستثمارات والأرباح خلال الأشهر الماضية
        </p>
      </div>
      {isLoading ? (
        <div className="h-80 flex items-center justify-center">
          <Skeleton className="w-full h-full" />
        </div>
      ) : (
        <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorInvestments" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(222, 60%, 25%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(222, 60%, 25%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorProfits" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(200, 80%, 55%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(200, 80%, 55%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="month"
              tick={{ fill: "hsl(215, 16%, 47%)", fontSize: 12 }}
              axisLine={{ stroke: "hsl(214, 32%, 91%)" }}
            />
            <YAxis
              tick={{ fill: "hsl(215, 16%, 47%)", fontSize: 12 }}
              axisLine={{ stroke: "hsl(214, 32%, 91%)" }}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(0, 0%, 100%)",
                border: "1px solid hsl(214, 32%, 91%)",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              }}
              formatter={(value: number) => [
                `${value.toLocaleString()} ج.م`,
                "",
              ]}
            />
            <Area
              type="monotone"
              dataKey="investments"
              stroke="hsl(222, 60%, 25%)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorInvestments)"
              name="الاستثمارات"
            />
            <Area
              type="monotone"
              dataKey="profits"
              stroke="hsl(200, 80%, 55%)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorProfits)"
              name="الأرباح"
            />
          </AreaChart>
        </ResponsiveContainer>
        </div>
      )}
      {!isLoading && (
        <div className="mt-4 flex items-center justify-center gap-6">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-primary" />
            <span className="text-sm text-muted-foreground">الاستثمارات</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-secondary" />
            <span className="text-sm text-muted-foreground">الأرباح</span>
          </div>
        </div>
      )}
    </div>
  );
}
