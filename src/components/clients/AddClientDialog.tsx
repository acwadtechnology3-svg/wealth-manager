import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Plus, Calculator, TrendingUp, DollarSign } from "lucide-react";
import { useCreateClientWithDeposit } from "@/hooks/queries/useClients";
import { useEmployees } from "@/hooks/queries/useProfiles";
import { useAuth } from "@/hooks/useAuth";

const clientSchema = z.object({
  name: z.string().trim().min(2, "الاسم يجب أن يكون حرفين على الأقل").max(100),
  phone: z.string().trim().min(10, "رقم الهاتف غير صحيح").max(15),
  registrationDate: z.string().min(1, "تاريخ التسجيل مطلوب"),
  depositNumber: z.string().trim().optional(),
  investmentAmount: z.coerce.number().min(1000, "الحد الأدنى للإيداع 1000 ج.م"),
  profitRate: z.coerce.number().min(1, "نسبة الربح يجب أن تكون 1% على الأقل").max(50),
  investmentDuration: z.coerce.number().min(1, "مدة الاستثمار شهر واحد على الأقل").max(60),
  employeeId: z.string().min(1, "يجب اختيار الموظف المسؤول"),
  commissionRate: z.coerce.number().min(0, "العمولة لا يمكن أن تكون سالبة").max(100),
});

type ClientFormData = z.infer<typeof clientSchema>;

export function AddClientDialog() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const createClientMutation = useCreateClientWithDeposit();
  const { data: employees = [], isLoading: isLoadingEmployees } = useEmployees();

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: "",
      phone: "",
      registrationDate: new Date().toISOString().split('T')[0],
      depositNumber: "",
      investmentAmount: 0,
      profitRate: 10,
      investmentDuration: 12,
      employeeId: "",
      commissionRate: 2,
    },
  });

  const watchedValues = form.watch();

  // حساب الأرباح التلقائي
  const calculations = useMemo(() => {
    const { investmentAmount, profitRate, investmentDuration, commissionRate } = watchedValues;

    const monthlyProfit = (investmentAmount * profitRate) / 100;
    const totalProfit = monthlyProfit * investmentDuration;
    const employeeCommission = (investmentAmount * commissionRate) / 100;

    return {
      monthlyProfit: isNaN(monthlyProfit) ? 0 : monthlyProfit,
      totalProfit: isNaN(totalProfit) ? 0 : totalProfit,
      employeeCommission: isNaN(employeeCommission) ? 0 : employeeCommission,
    };
  }, [watchedValues]);

  const onSubmit = (data: ClientFormData) => {
    if (!user) return;

    createClientMutation.mutate(
      {
        client: {
          name: data.name,
          email: null,
          phone: data.phone,
          assigned_to: data.employeeId,
          created_by: user.id,
          status: 'active',
        },
        deposit: {
          amount: data.investmentAmount,
          profitRate: data.profitRate,
          depositDate: data.registrationDate,
          depositNumber: data.depositNumber,
        },
        investment: {
          duration: data.investmentDuration,
          commissionRate: data.commissionRate,
        },
      },
      {
        onSuccess: () => {
          form.reset();
          setOpen(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gradient-primary">
          <Plus className="ml-2 h-4 w-4" />
          إضافة عميل
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">إضافة عميل جديد</DialogTitle>
          <DialogDescription>
            أدخل بيانات العميل والإيداع لفتح الحساب.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* بيانات العميل الأساسية */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground border-b pb-2">بيانات العميل</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اسم العميل *</FormLabel>
                      <FormControl>
                        <Input placeholder="أدخل اسم العميل" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>رقم الهاتف *</FormLabel>
                      <FormControl>
                        <Input placeholder="01xxxxxxxxx" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="registrationDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تاريخ التسجيل *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="depositNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رقم الإيداع (اختياري)</FormLabel>
                    <FormControl>
                      <Input placeholder="رقم الإيداع إن وجد" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* بيانات الاستثمار */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground border-b pb-2">بيانات الاستثمار</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="investmentAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>مبلغ الإيداع (ج.م) *</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="50000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="profitRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نسبة الربح الشهرية (%) *</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.5" placeholder="10" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="investmentDuration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>مدة الاستثمار (شهور) *</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="12" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* بيانات الموظف والعمولة */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground border-b pb-2">الموظف المسؤول والعمولة</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="employeeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الموظف المسؤول *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isLoadingEmployees}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={isLoadingEmployees ? "جاري التحميل..." : "اختر الموظف"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {employees.map((emp) => (
                            <SelectItem key={emp.user_id} value={emp.user_id!}>
                              {emp.full_name || emp.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="commissionRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نسبة عمولة الموظف (%) *</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.5" placeholder="2" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* ملخص الحسابات التلقائية */}
            <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
              <div className="flex items-center gap-2 text-foreground font-semibold">
                <Calculator className="h-5 w-5 text-primary" />
                <span>ملخص الحسابات التلقائية</span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-lg bg-card p-3 border">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <TrendingUp className="h-4 w-4 text-success" />
                    <span>الربح الشهري</span>
                  </div>
                  <p className="text-xl font-bold text-success">
                    {calculations.monthlyProfit.toLocaleString()} ج.م
                  </p>
                </div>
                <div className="rounded-lg bg-card p-3 border">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span>إجمالي الأرباح</span>
                  </div>
                  <p className="text-xl font-bold text-primary">
                    {calculations.totalProfit.toLocaleString()} ج.م
                  </p>
                </div>
                <div className="rounded-lg bg-card p-3 border">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <DollarSign className="h-4 w-4 text-warning" />
                    <span>عمولة الموظف</span>
                  </div>
                  <p className="text-xl font-bold text-warning">
                    {calculations.employeeCommission.toLocaleString()} ج.م
                  </p>
                </div>
              </div>
            </div>

            {/* أزرار الإجراءات */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                className="flex-1 gradient-primary"
                disabled={createClientMutation.isPending}
              >
                <Plus className="ml-2 h-4 w-4" />
                {createClientMutation.isPending ? "جاري الإضافة..." : "إضافة العميل"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={createClientMutation.isPending}
              >
                إلغاء
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
