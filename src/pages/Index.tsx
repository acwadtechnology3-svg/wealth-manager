import { Users, UserCircle, Wallet, TrendingUp, AlertTriangle } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { RecentClients } from "@/components/dashboard/RecentClients";
import { PerformanceChart } from "@/components/dashboard/PerformanceChart";
import { TopEmployees } from "@/components/dashboard/TopEmployees";
import { UpcomingEvents } from "@/components/dashboard/UpcomingEvents";

const Index = () => {
  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="animate-slide-right">
          <h1 className="text-3xl font-bold text-foreground">لوحة التحكم</h1>
          <p className="text-muted-foreground mt-1">
            مرحباً بك، أحمد! هذه نظرة عامة على أداء النظام
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="إجمالي الموظفين"
            value={24}
            change={{ value: 12, type: "increase" }}
            icon={Users}
            variant="default"
          />
          <StatCard
            title="إجمالي العملاء"
            value={186}
            change={{ value: 8, type: "increase" }}
            icon={UserCircle}
            variant="primary"
          />
          <StatCard
            title="إجمالي الاستثمارات"
            value="4.2M ج.م"
            change={{ value: 15, type: "increase" }}
            icon={TrendingUp}
            variant="success"
          />
          <StatCard
            title="العمولات الشهرية"
            value="210K ج.م"
            change={{ value: 5, type: "decrease" }}
            icon={Wallet}
            variant="warning"
          />
        </div>

        {/* Alert Banner */}
        <div className="flex items-center gap-4 rounded-xl border border-warning/30 bg-warning/10 p-4 animate-fade-in">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning text-warning-foreground">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-foreground">
              تنبيه: هناك 3 عملاء متأخرين عن موعد صرف الأرباح
            </p>
            <p className="text-sm text-muted-foreground">
              يرجى مراجعة قسم التنبيهات لمتابعة الحالات المتأخرة
            </p>
          </div>
          <button className="rounded-lg bg-warning px-4 py-2 text-sm font-medium text-warning-foreground transition-colors hover:bg-warning/90">
            عرض التفاصيل
          </button>
        </div>

        {/* Charts and Performance */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <PerformanceChart />
          </div>
          <div>
            <TopEmployees />
          </div>
        </div>

        {/* Recent Clients Table */}
        <RecentClients />

        {/* Upcoming Events */}
        <div className="grid gap-6 lg:grid-cols-2">
          <UpcomingEvents />
          <div className="rounded-xl border bg-card p-6 shadow-card animate-slide-up">
            <div className="mb-6">
              <h3 className="text-lg font-semibold">ملخص الأداء الشهري</h3>
              <p className="text-sm text-muted-foreground">
                مقارنة بين الشهر الحالي والسابق
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
                <span className="text-muted-foreground">العملاء الجدد</span>
                <span className="font-semibold text-success">+24 عميل</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
                <span className="text-muted-foreground">الاستثمارات الجديدة</span>
                <span className="font-semibold text-success">+850,000 ج.م</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
                <span className="text-muted-foreground">الأرباح المصروفة</span>
                <span className="font-semibold">504,000 ج.م</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
                <span className="text-muted-foreground">السحوبات</span>
                <span className="font-semibold text-destructive">-320,000 ج.م</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Index;
