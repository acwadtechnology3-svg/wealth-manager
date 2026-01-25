import { Users, UserCircle, Wallet, TrendingUp, AlertTriangle } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { RecentClients } from "@/components/dashboard/RecentClients";
import { PerformanceChart } from "@/components/dashboard/PerformanceChart";
import { TopEmployees } from "@/components/dashboard/TopEmployees";
import { UpcomingEvents } from "@/components/dashboard/UpcomingEvents";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  useDashboardStats,
  useMonthlyPerformance,
  useTopEmployees,
  useRecentClients,
  useUpcomingWithdrawals,
} from "@/hooks/queries/useDashboard";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: stats, isLoading: isLoadingStats } = useDashboardStats();
  const { data: performance, isLoading: isLoadingPerformance } = useMonthlyPerformance();
  const { data: topEmployees = [], isLoading: isLoadingTopEmployees } = useTopEmployees(5);
  const { data: recentClients = [], isLoading: isLoadingRecentClients } = useRecentClients(5);
  const { data: upcomingWithdrawals = [], isLoading: isLoadingUpcoming } = useUpcomingWithdrawals(10);

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="animate-slide-right">
          <h1 className="text-3xl font-bold text-foreground">لوحة التحكم</h1>
          <p className="text-muted-foreground mt-1">
            مرحباً بك، {user?.email?.split('@')[0]}! هذه نظرة عامة على أداء النظام
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {isLoadingStats ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="rounded-xl border bg-card p-6 shadow-card">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-20" />
                </div>
              ))}
            </>
          ) : (
            <>
              <StatCard
                title="إجمالي الموظفين"
                value={stats?.totalEmployees || 0}
                change={{
                  value: stats?.employeesChange || 0,
                  type: (stats?.employeesChange || 0) >= 0 ? "increase" : "decrease",
                }}
                icon={Users}
                variant="default"
              />
              <StatCard
                title="إجمالي العملاء"
                value={stats?.totalClients || 0}
                change={{
                  value: stats?.clientsChange || 0,
                  type: (stats?.clientsChange || 0) >= 0 ? "increase" : "decrease",
                }}
                icon={UserCircle}
                variant="primary"
              />
              <StatCard
                title="إجمالي الاستثمارات"
                value={`${((stats?.totalInvestments || 0) / 1000000).toFixed(1)}M ج.م`}
                change={{
                  value: stats?.investmentsChange || 0,
                  type: (stats?.investmentsChange || 0) >= 0 ? "increase" : "decrease",
                }}
                icon={TrendingUp}
                variant="success"
              />
              <StatCard
                title="العمولات الشهرية"
                value={`${((stats?.monthlyCommissions || 0) / 1000).toFixed(0)}K ج.م`}
                change={{ value: 0, type: "increase" }}
                icon={Wallet}
                variant="warning"
              />
            </>
          )}
        </div>

        {/* Alert Banner - Only show if there are late clients */}
        {!isLoadingStats && stats && stats.lateClients > 0 && (
          <div className="flex items-center gap-4 rounded-xl border border-destructive/30 bg-destructive/10 p-4 animate-fade-in">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive text-destructive-foreground">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">
                تنبيه: هناك {stats.lateClients} عملاء متأخرين عن موعد صرف الأرباح
              </p>
              <p className="text-sm text-muted-foreground">
                يرجى مراجعة قسم العملاء لمتابعة الحالات المتأخرة
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => navigate('/admin/clients?status=late')}
            >
              عرض التفاصيل
            </Button>
          </div>
        )}

        {/* Charts and Performance */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <PerformanceChart isLoading={isLoadingPerformance} />
          </div>
          <div>
            <TopEmployees employees={topEmployees} isLoading={isLoadingTopEmployees} />
          </div>
        </div>

        {/* Recent Clients Table */}
        <RecentClients clients={recentClients} isLoading={isLoadingRecentClients} />

        {/* Upcoming Events */}
        <div className="grid gap-6 lg:grid-cols-2">
          <UpcomingEvents withdrawals={upcomingWithdrawals} isLoading={isLoadingUpcoming} />
          <div className="rounded-xl border bg-card p-6 shadow-card animate-slide-up">
            <div className="mb-6">
              <h3 className="text-lg font-semibold">ملخص الأداء الشهري</h3>
              <p className="text-sm text-muted-foreground">
                إحصائيات الشهر الحالي
              </p>
            </div>
            {isLoadingPerformance ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
                  <span className="text-muted-foreground">العملاء الجدد</span>
                  <span className="font-semibold text-success">
                    +{performance?.newClients || 0} عميل
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
                  <span className="text-muted-foreground">الاستثمارات الجديدة</span>
                  <span className="font-semibold text-success">
                    +{((performance?.newInvestments || 0) / 1000).toFixed(0)}K ج.م
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
                  <span className="text-muted-foreground">الأرباح المصروفة</span>
                  <span className="font-semibold">
                    {((performance?.profitsPaid || 0) / 1000).toFixed(0)}K ج.م
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
                  <span className="text-muted-foreground">السحوبات</span>
                  <span className="font-semibold text-destructive">
                    -{((performance?.withdrawals || 0) / 1000).toFixed(0)}K ج.م
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Index;
