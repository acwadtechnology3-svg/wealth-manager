import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
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
import { Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const employeeSchema = z.object({
  name: z.string().trim().min(2, "الاسم يجب أن يكون حرفين على الأقل").max(100),
  position: z.string().trim().min(2, "الوظيفة مطلوبة"),
  department: z.string().trim().min(1, "القسم مطلوب"),
  phone: z.string().trim().min(10, "رقم الهاتف غير صحيح").max(15),
  email: z.string().email("البريد الإلكتروني غير صحيح"),
  employmentType: z.enum(["full-time", "part-time", "commission"]),
  baseSalary: z.coerce.number().min(0, "الراتب لا يمكن أن يكون سالب"),
  commissionRate: z.coerce.number().min(0).max(100),
  hireDate: z.string().min(1, "تاريخ التعيين مطلوب"),
  contractEndDate: z.string().optional(),
  annualLeaveBalance: z.coerce.number().min(0).max(30),
  sickLeaveBalance: z.coerce.number().min(0).max(15),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

export function AddEmployeeDialog() {
  const [open, setOpen] = useState(false);

  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      name: "",
      position: "",
      department: "المبيعات",
      phone: "",
      email: "",
      employmentType: "full-time",
      baseSalary: 0,
      commissionRate: 0,
      hireDate: new Date().toISOString().split("T")[0],
      contractEndDate: "",
      annualLeaveBalance: 21,
      sickLeaveBalance: 10,
    },
  });

  const watchedType = form.watch("employmentType");

  const onSubmit = (data: EmployeeFormData) => {
    // Successfully added employee - this is informational only
    toast({
      title: "تم إضافة الموظف بنجاح",
      description: `تم تسجيل الموظف ${data.name} في النظام`,
    });
    form.reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gradient-primary">
          <Plus className="ml-2 h-4 w-4" />
          إضافة موظف
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">إضافة موظف جديد</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* البيانات الشخصية */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground border-b pb-2">البيانات الشخصية</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الاسم الكامل *</FormLabel>
                      <FormControl>
                        <Input placeholder="أدخل اسم الموظف" {...field} />
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
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>البريد الإلكتروني *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@fis.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* بيانات الوظيفة */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground border-b pb-2">بيانات الوظيفة</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الوظيفة *</FormLabel>
                      <FormControl>
                        <Input placeholder="مسؤول مبيعات" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>القسم *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر القسم" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="المبيعات">المبيعات</SelectItem>
                          <SelectItem value="المحاسبة">المحاسبة</SelectItem>
                          <SelectItem value="الموارد البشرية">الموارد البشرية</SelectItem>
                          <SelectItem value="الإدارة">الإدارة</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="employmentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نوع التعاقد *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر نوع التعاقد" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="full-time">دوام كامل</SelectItem>
                          <SelectItem value="part-time">دوام جزئي</SelectItem>
                          <SelectItem value="commission">بالعمولة فقط</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="hireDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>تاريخ التعيين *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="contractEndDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تاريخ انتهاء العقد (اختياري)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* البيانات المالية */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground border-b pb-2">البيانات المالية</h3>
              <div className="grid grid-cols-2 gap-4">
                {watchedType !== "commission" && (
                  <FormField
                    control={form.control}
                    name="baseSalary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الراتب الأساسي (ج.م)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                <FormField
                  control={form.control}
                  name="commissionRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نسبة العمولة (%)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.5" placeholder="5" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* رصيد الإجازات */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground border-b pb-2">رصيد الإجازات</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="annualLeaveBalance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الإجازات السنوية (أيام)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sickLeaveBalance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الإجازات المرضية (أيام)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* أزرار الإجراءات */}
            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1 gradient-primary">
                <Plus className="ml-2 h-4 w-4" />
                إضافة الموظف
              </Button>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                إلغاء
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
