import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  UserCircle,
  Phone,
  Mail,
  CreditCard,
  Calendar,
  TrendingUp,
  User,
  FileText,
  History,
  Paperclip,
  Download,
  AlertTriangle,
  CheckCircle,
  Clock,
  Edit,
  Loader,
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useClientFullDetails } from "@/hooks/queries/useClients";
import { useTableAuditLogs } from "@/hooks/queries/useAuditLogs";

const statusConfig = {
  active: { label: "نشط", className: "bg-success/10 text-success border-success/20", icon: CheckCircle },
  late: { label: "متأخر", className: "bg-destructive/10 text-destructive border-destructive/20", icon: AlertTriangle },
  suspended: { label: "موقوف", className: "bg-warning/10 text-warning border-warning/20", icon: Clock },
  inactive: { label: "غير نشط", className: "bg-muted text-muted-foreground", icon: Clock },
};

const withdrawalStatusConfig = {
  completed: { label: "تم", className: "bg-success/10 text-success", icon: CheckCircle },
  upcoming: { label: "قادم", className: "bg-warning/10 text-warning", icon: Clock },
  overdue: { label: "متأخر", className: "bg-destructive/10 text-destructive", icon: AlertTriangle },
};

const attachmentTypeLabels = {
  contract: "عقد",
  deposit_receipt: "إيصال إيداع",
  id_card: "بطاقة شخصية",
  other: "أخرى",
};

export default function ClientProfile() {
  const { clientId } = useParams();
  const navigate = useNavigate();

  const { data: client, isLoading, error } = useClientFullDetails(clientId);
  const { data: auditLogs = [] } = useTableAuditLogs('clients');

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-[50vh]">
          <Loader className="h-12 w-12 text-primary mb-4 animate-spin" />
          <h2 className="text-xl font-semibold mb-2">جاري التحميل...</h2>
        </div>
      </MainLayout>
    );
  }

  if (error || !client) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-[50vh]">
          <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-xl font-semibold mb-2">العميل غير موجود</h2>
          <p className="text-muted-foreground mb-4">لم يتم العثور على العميل المطلوب</p>
          <Button onClick={() => navigate("/admin")}>العودة للوحة الأدمن</Button>
        </div>
      </MainLayout>
    );
  }

  const StatusIcon = statusConfig[client.status].icon;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 animate-slide-right">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
            <ArrowRight className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-foreground">{client.name}</h1>
              <Badge className={cn("font-medium", statusConfig[client.status].className)}>
                <StatusIcon className="ml-1 h-3 w-3" />
                {statusConfig[client.status].label}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              كود العميل: {client.code} • تاريخ التسجيل: {new Date(client.createdAt).toLocaleDateString("ar-EG")}
            </p>
          </div>
          <Button variant="outline">
            <Edit className="ml-2 h-4 w-4" />
            تعديل البيانات
          </Button>
          <Button>
            <Download className="ml-2 h-4 w-4" />
            تصدير PDF
          </Button>
        </div>

        {/* Basic Info Cards */}
        <div className="grid gap-4 md:grid-cols-3 animate-slide-up">
          {/* Client Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <UserCircle className="h-4 w-4 text-primary" />
                بيانات العميل
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{client.phone}</span>
              </div>
              {client.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{client.email}</span>
                </div>
              )}
              {client.nationalId && (
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span>{client.nationalId}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Financial Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-success" />
                الملخص المالي
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">عدد الإيداعات</span>
                <span className="font-semibold">{(client as any).client_deposits?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">إجمالي المبالغ المودعة</span>
                <span className="font-semibold">
                  {(client as any).client_deposits?.reduce((sum: number, d: any) => sum + (d.amount || 0), 0).toLocaleString() || '0'} ج.م
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">حالة العميل</span>
                <span className="font-semibold text-success">{statusConfig[client.status].label}</span>
              </div>
            </CardContent>
          </Card>

          {/* Assigned Employee */}
          {client.assigned_to && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  الموظف المسؤول
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">معين للموظف</p>
                    <p className="text-sm text-muted-foreground">{client.assigned_to}</p>
                  </div>
                </div>
                <Separator />
                <p className="text-sm text-muted-foreground">معرف الموظف المسؤول عن هذا العميل</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Tabs Section */}
        <Tabs defaultValue="deposits" className="animate-slide-up">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="deposits" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              الإيداعات والسحوبات
            </TabsTrigger>
            <TabsTrigger value="data-entry" className="gap-2">
              <FileText className="h-4 w-4" />
              سجل إدخال البيانات
            </TabsTrigger>
            <TabsTrigger value="audit" className="gap-2">
              <History className="h-4 w-4" />
              سجل التعديلات
            </TabsTrigger>
            <TabsTrigger value="attachments" className="gap-2">
              <Paperclip className="h-4 w-4" />
              المرفقات
            </TabsTrigger>
          </TabsList>

          {/* Deposits Tab */}
          <TabsContent value="deposits" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>الإيداعات</CardTitle>
                <CardDescription>جميع إيداعات العميل</CardDescription>
              </CardHeader>
              <CardContent>
                {(client as any).client_deposits && (client as any).client_deposits.length > 0 ? (
                  <div className="space-y-6">
                    {(client as any).client_deposits.map((deposit: any) => (
                      <div key={deposit.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="font-semibold">{deposit.deposit_number}</p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(deposit.deposit_date).toLocaleDateString("ar-EG")}
                            </p>
                          </div>
                          <div className="text-left">
                            <p className="text-xl font-bold">{deposit.amount.toLocaleString()} ج.م</p>
                            <p className="text-sm text-success">{deposit.profit_rate || 0}% ربح</p>
                            <Badge className="mt-2">{deposit.status}</Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">لا توجد إيداعات لهذا العميل</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Entry Log Tab */}
          <TabsContent value="data-entry" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>معلومات العميل</CardTitle>
                <CardDescription>بيانات إنشاء وتحديث العميل</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">تاريخ الإنشاء</p>
                    <p className="font-medium">{new Date(client.created_at).toLocaleDateString("ar-EG")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">آخر تحديث</p>
                    <p className="font-medium">{new Date(client.updated_at).toLocaleDateString("ar-EG")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">الحالة</p>
                    <p className="font-medium">{statusConfig[client.status].label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audit History Tab */}
          <TabsContent value="audit" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>سجل التعديلات</CardTitle>
                <CardDescription>جميع التعديلات على بيانات العميل</CardDescription>
              </CardHeader>
              <CardContent>
                {auditLogs.length > 0 ? (
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-4">
                      {auditLogs.map((log) => (
                        <div
                          key={log.id}
                          className={cn(
                            "p-4 rounded-lg border",
                            log.action === "create" && "bg-success/5 border-success/20",
                            log.action === "update" && "bg-warning/5 border-warning/20",
                            log.action === "delete" && "bg-destructive/5 border-destructive/20"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div className={cn(
                              "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
                              log.action === "create" && "bg-success/10 text-success",
                              log.action === "update" && "bg-warning/10 text-warning",
                              log.action === "delete" && "bg-destructive/10 text-destructive"
                            )}>
                              <History className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">
                                {log.action === "create" && "إنشاء"}
                                {log.action === "update" && "تعديل"}
                                {log.action === "delete" && "حذف"}
                                {" "}
                                {log.target_table}
                              </p>
                              {log.field_name && (
                                <div className="mt-2 p-2 rounded bg-muted/50 text-sm">
                                  <span className="text-muted-foreground">الحقل: </span>
                                  <span className="font-medium">{log.field_name}</span>
                                  {log.old_value && log.new_value && (
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="text-destructive line-through">{log.old_value}</span>
                                      <span>←</span>
                                      <span className="text-success">{log.new_value}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                              {log.reason && (
                                <p className="text-sm text-muted-foreground mt-2">
                                  السبب: {log.reason}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(log.created_at).toLocaleString("ar-EG")}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">لا توجد تعديلات مسجلة</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Attachments Tab */}
          <TabsContent value="attachments" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>المستندات</CardTitle>
                <CardDescription>الملفات والمستندات المتعلقة بالعميل</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">لا توجد مستندات مرفوعة</p>
                  <p className="text-sm text-muted-foreground mt-2">يمكن إضافة المستندات من خلال نظام إدارة الملفات</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
