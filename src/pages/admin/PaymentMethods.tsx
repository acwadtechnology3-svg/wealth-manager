import { CreditCard, Smartphone, Landmark } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const paymentMethods = [
  {
    id: "wallets",
    title: "محفظة إلكترونية",
    description: "الدفع عبر المحافظ الإلكترونية المعتمدة.",
    icon: CreditCard,
    details: ["متاحة في منطقة الخدمات المدفوعة", "إثبات الدفع مطلوب عند الطلب"],
  },
  {
    id: "instapay",
    title: "InstaPay",
    description: "الدفع الفوري عبر تطبيق InstaPay.",
    icon: Smartphone,
    details: ["تحويل فوري", "تأكيد تلقائي بعد إتمام العملية"],
  },
  {
    id: "bank-transfer",
    title: "تحويل بنكي",
    description: "التحويل عبر الحساب البنكي المعتمد.",
    icon: Landmark,
    details: ["يُفضّل إرفاق رقم العملية", "قد يستغرق التفعيل وقتًا أطول"],
  },
];

export default function PaymentMethods() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">طرق الدفع</h1>
            <p className="text-muted-foreground mt-1">
              طرق الدفع المتاحة في منطقة الخدمات المدفوعة
            </p>
          </div>
          <Badge className="bg-success/10 text-success border-success/20">متاح</Badge>
        </div>

        <Tabs defaultValue="wallets" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="wallets">محفظة إلكترونية</TabsTrigger>
            <TabsTrigger value="instapay">InstaPay</TabsTrigger>
            <TabsTrigger value="bank-transfer">تحويل بنكي</TabsTrigger>
          </TabsList>

          {paymentMethods.map((method) => {
            const Icon = method.icon;
            return (
              <TabsContent key={method.id} value={method.id} className="mt-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{method.title}</CardTitle>
                        <p className="text-sm text-muted-foreground">{method.description}</p>
                      </div>
                    </div>
                    <Badge variant="outline">متاح</Badge>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {method.details.map((detail) => (
                        <li key={detail}>• {detail}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </MainLayout>
  );
}
