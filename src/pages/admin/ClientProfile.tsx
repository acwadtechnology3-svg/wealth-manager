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
import { clientsFullData } from "@/data/adminMockData";

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
  
  const client = clientsFullData.find((c) => c.id === clientId);

  if (!client) {
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
                <span className="text-muted-foreground">إجمالي الاستثمار</span>
                <span className="font-semibold">{client.totalInvestment.toLocaleString()} ج.م</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">نسبة الربح</span>
                <span className="font-semibold text-success">{client.profitRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">الربح الشهري</span>
                <span className="font-semibold">{client.monthlyProfit.toLocaleString()} ج.م</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">إجمالي الأرباح</span>
                <span className="font-bold text-success">{client.totalProfit.toLocaleString()} ج.م</span>
              </div>
            </CardContent>
          </Card>

          {/* Assigned Employee */}
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
                  <p className="font-medium">{client.assignedEmployee.name}</p>
                  <p className="text-sm text-muted-foreground">{client.assignedEmployee.code}</p>
                </div>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">القسم</span>
                <span>{client.assignedEmployee.department}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">نسبة العمولة</span>
                <span className="text-success">{client.assignedEmployee.commissionRate}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">الهاتف</span>
                <span>{client.assignedEmployee.phone}</span>
              </div>
            </CardContent>
          </Card>
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
                <CardTitle>الإيداعات ومواعيد السحب</CardTitle>
                <CardDescription>جميع إيداعات العميل ومواعيد صرف الأرباح</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {client.deposits.map((deposit) => (
                    <div key={deposit.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="font-semibold">{deposit.depositNumber}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {deposit.depositDate}
                          </p>
                        </div>
                        <div className="text-left">
                          <p className="text-xl font-bold">{deposit.amount.toLocaleString()} ج.م</p>
                          <p className="text-sm text-success">{deposit.profitRate}% شهرياً</p>
                        </div>
                      </div>
                      <Separator className="my-4" />
                      <p className="text-sm font-medium mb-3">مواعيد السحب:</p>
                      <div className="grid gap-2 md:grid-cols-3">
                        {deposit.withdrawalDates.map((withdrawal) => {
                          const config = withdrawalStatusConfig[withdrawal.status];
                          const Icon = config.icon;
                          return (
                            <div
                              key={withdrawal.id}
                              className={cn(
                                "p-3 rounded-lg border flex items-center justify-between",
                                config.className
                              )}
                            >
                              <div>
                                <p className="font-medium">{withdrawal.dueDate}</p>
                                <p className="text-sm">{withdrawal.amount.toLocaleString()} ج.م</p>
                              </div>
                              <div className="flex items-center gap-1">
                                <Icon className="h-4 w-4" />
                                <span className="text-sm">{config.label}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Entry Log Tab */}
          <TabsContent value="data-entry" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>سجل إدخال البيانات</CardTitle>
                <CardDescription>من أدخل كل حقل ومتى</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">البيان</TableHead>
                      <TableHead className="text-right">القيمة</TableHead>
                      <TableHead className="text-right">أدخلها</TableHead>
                      <TableHead className="text-right">التاريخ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {client.dataEntryLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">{log.fieldLabel}</TableCell>
                        <TableCell>{log.value}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="h-3 w-3 text-primary" />
                            </div>
                            <span>{log.enteredBy.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(log.timestamp).toLocaleString("ar-EG")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audit History Tab */}
          <TabsContent value="audit" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>سجل التعديلات</CardTitle>
                <CardDescription>جميع التعديلات على بيانات العميل مع القيم قبل وبعد</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {client.auditHistory.map((log) => (
                      <div
                        key={log.id}
                        className={cn(
                          "p-4 rounded-lg border",
                          log.action === "create" && "bg-success/5 border-success/20",
                          log.action === "update" && "bg-warning/5 border-warning/20",
                          log.action === "delete" && "bg-destructive/5 border-destructive/20"
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className={cn(
                              "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
                              log.action === "create" && "bg-success/10 text-success",
                              log.action === "update" && "bg-warning/10 text-warning",
                              log.action === "delete" && "bg-destructive/10 text-destructive"
                            )}>
                              <History className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-medium">
                                {log.action === "create" && "إنشاء"}
                                {log.action === "update" && "تعديل"}
                                {log.action === "delete" && "حذف"}
                                {" "}
                                {log.entityType === "client" && "بيانات العميل"}
                                {log.entityType === "transaction" && "معاملة مالية"}
                              </p>
                              {log.field && (
                                <div className="mt-2 p-2 rounded bg-muted/50 text-sm">
                                  <span className="text-muted-foreground">الحقل: </span>
                                  <span className="font-medium">{log.field}</span>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-destructive line-through">{log.oldValue}</span>
                                    <span>←</span>
                                    <span className="text-success">{log.newValue}</span>
                                  </div>
                                </div>
                              )}
                              {log.reason && (
                                <p className="text-sm text-muted-foreground mt-2">
                                  السبب: {log.reason}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-left text-sm">
                            <p className="font-medium">{log.performedBy.name}</p>
                            <p className="text-muted-foreground">{log.performedBy.role}</p>
                            <p className="text-muted-foreground mt-1">
                              {new Date(log.timestamp).toLocaleString("ar-EG")}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Attachments Tab */}
          <TabsContent value="attachments" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>المرفقات</CardTitle>
                <CardDescription>العقود والإيصالات والمستندات</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {client.attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{attachment.name}</p>
                          <Badge variant="secondary" className="mt-1">
                            {attachmentTypeLabels[attachment.type]}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="mt-3 text-sm text-muted-foreground">
                        <p>رفعها: {attachment.uploadedBy}</p>
                        <p>{new Date(attachment.uploadedAt).toLocaleDateString("ar-EG")}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
