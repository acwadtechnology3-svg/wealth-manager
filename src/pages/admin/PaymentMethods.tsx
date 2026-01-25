import { useEffect, useMemo, useState } from "react";
import { CreditCard, Smartphone, Landmark } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

type MethodId = "wallet" | "instapay" | "bank_transfer";

type WalletConfig = {
  enabled: boolean;
  providerName: string;
  walletNumber: string;
  accountName: string;
  notes: string;
};

type InstaPayConfig = {
  enabled: boolean;
  instapayId: string;
  accountName: string;
  notes: string;
};

type BankConfig = {
  enabled: boolean;
  bankName: string;
  accountName: string;
  accountNumber: string;
  iban: string;
  swift: string;
  branch: string;
  notes: string;
};

type PaymentFormState = {
  wallet: WalletConfig;
  instapay: InstaPayConfig;
  bank_transfer: BankConfig;
};

const paymentMethods = [
  {
    id: "wallet" as MethodId,
    title: "محفظة إلكترونية",
    description: "الدفع عبر المحافظ الإلكترونية المعتمدة.",
    icon: CreditCard,
  },
  {
    id: "instapay" as MethodId,
    title: "InstaPay",
    description: "الدفع الفوري عبر تطبيق InstaPay.",
    icon: Smartphone,
  },
  {
    id: "bank_transfer" as MethodId,
    title: "تحويل بنكي",
    description: "التحويل عبر الحساب البنكي المعتمد.",
    icon: Landmark,
  },
];

export default function PaymentMethods() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<MethodId | null>(null);
  const [form, setForm] = useState<PaymentFormState>({
    wallet: {
      enabled: true,
      providerName: "",
      walletNumber: "",
      accountName: "",
      notes: "",
    },
    instapay: {
      enabled: true,
      instapayId: "",
      accountName: "",
      notes: "",
    },
    bank_transfer: {
      enabled: true,
      bankName: "",
      accountName: "",
      accountNumber: "",
      iban: "",
      swift: "",
      branch: "",
      notes: "",
    },
  });

  useEffect(() => {
    const fetchMethods = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("payment_methods")
        .select("*");

      if (error) {
        toast({
          title: "خطأ",
          description: error.message || "فشل في تحميل طرق الدفع",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const next = { ...form } as PaymentFormState;

      (data || []).forEach((row) => {
        const method = row.method as MethodId;
        if (!next[method]) return;

        const details = (row.details || {}) as Record<string, string>;

        if (method === "wallet") {
          next.wallet = {
            enabled: row.enabled,
            providerName: details.providerName || "",
            walletNumber: details.walletNumber || "",
            accountName: details.accountName || "",
            notes: details.notes || "",
          };
        }

        if (method === "instapay") {
          next.instapay = {
            enabled: row.enabled,
            instapayId: details.instapayId || "",
            accountName: details.accountName || "",
            notes: details.notes || "",
          };
        }

        if (method === "bank_transfer") {
          next.bank_transfer = {
            enabled: row.enabled,
            bankName: details.bankName || "",
            accountName: details.accountName || "",
            accountNumber: details.accountNumber || "",
            iban: details.iban || "",
            swift: details.swift || "",
            branch: details.branch || "",
            notes: details.notes || "",
          };
        }
      });

      setForm(next);
      setLoading(false);
    };

    fetchMethods();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateMethod = (method: MethodId, updates: Partial<WalletConfig | InstaPayConfig | BankConfig>) => {
    setForm((prev) => ({
      ...prev,
      [method]: {
        ...prev[method],
        ...updates,
      },
    }));
  };

  const buildDetails = (method: MethodId) => {
    if (method === "wallet") {
      const { providerName, walletNumber, accountName, notes } = form.wallet;
      return { providerName, walletNumber, accountName, notes };
    }
    if (method === "instapay") {
      const { instapayId, accountName, notes } = form.instapay;
      return { instapayId, accountName, notes };
    }
    const { bankName, accountName, accountNumber, iban, swift, branch, notes } = form.bank_transfer;
    return { bankName, accountName, accountNumber, iban, swift, branch, notes };
  };

  const handleSave = async (method: MethodId) => {
    setSaving(method);
    const payload = {
      method,
      enabled: form[method].enabled,
      details: buildDetails(method),
    };

    const { error } = await supabase
      .from("payment_methods")
      .upsert(payload, { onConflict: "method" });

    if (error) {
      toast({
        title: "خطأ",
        description: error.message || "فشل في حفظ طريقة الدفع",
        variant: "destructive",
      });
    } else {
      toast({
        title: "تم بنجاح",
        description: "تم حفظ إعدادات طريقة الدفع",
      });
    }

    setSaving(null);
  };

  const statusBadge = useMemo(() => {
    if (loading) {
      return <Badge variant="outline">جاري التحميل...</Badge>;
    }
    return <Badge className="bg-success/10 text-success border-success/20">متاح</Badge>;
  }, [loading]);

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
          {statusBadge}
        </div>

        <Tabs defaultValue="wallet" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="wallet">محفظة إلكترونية</TabsTrigger>
            <TabsTrigger value="instapay">InstaPay</TabsTrigger>
            <TabsTrigger value="bank_transfer">تحويل بنكي</TabsTrigger>
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
                    <div className="flex items-center gap-2">
                      <Label className="text-sm">متاح</Label>
                      <Switch
                        checked={form[method.id].enabled}
                        onCheckedChange={(checked) => updateMethod(method.id, { enabled: checked })}
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    {method.id === "wallet" && (
                      <div className="grid gap-4">
                        <div className="grid gap-2">
                          <Label>اسم المزود</Label>
                          <Input
                            value={form.wallet.providerName}
                            onChange={(e) => updateMethod("wallet", { providerName: e.target.value })}
                            placeholder="Vodafone Cash"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>رقم المحفظة</Label>
                          <Input
                            value={form.wallet.walletNumber}
                            onChange={(e) => updateMethod("wallet", { walletNumber: e.target.value })}
                            placeholder="01xxxxxxxxx"
                            dir="ltr"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>اسم صاحب الحساب</Label>
                          <Input
                            value={form.wallet.accountName}
                            onChange={(e) => updateMethod("wallet", { accountName: e.target.value })}
                            placeholder="اسم الحساب"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>تعليمات إضافية</Label>
                          <Textarea
                            value={form.wallet.notes}
                            onChange={(e) => updateMethod("wallet", { notes: e.target.value })}
                            placeholder="أضف أي تعليمات خاصة بالدفع"
                          />
                        </div>
                        <div className="flex justify-end">
                          <Button onClick={() => handleSave("wallet")} disabled={saving === "wallet"}>
                            {saving === "wallet" ? "جارٍ الحفظ..." : "حفظ"}
                          </Button>
                        </div>
                      </div>
                    )}

                    {method.id === "instapay" && (
                      <div className="grid gap-4">
                        <div className="grid gap-2">
                          <Label>معرّف InstaPay</Label>
                          <Input
                            value={form.instapay.instapayId}
                            onChange={(e) => updateMethod("instapay", { instapayId: e.target.value })}
                            placeholder="instapay@bank"
                            dir="ltr"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>اسم صاحب الحساب</Label>
                          <Input
                            value={form.instapay.accountName}
                            onChange={(e) => updateMethod("instapay", { accountName: e.target.value })}
                            placeholder="اسم الحساب"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>تعليمات إضافية</Label>
                          <Textarea
                            value={form.instapay.notes}
                            onChange={(e) => updateMethod("instapay", { notes: e.target.value })}
                            placeholder="أضف أي تعليمات خاصة بالدفع"
                          />
                        </div>
                        <div className="flex justify-end">
                          <Button onClick={() => handleSave("instapay")} disabled={saving === "instapay"}>
                            {saving === "instapay" ? "جارٍ الحفظ..." : "حفظ"}
                          </Button>
                        </div>
                      </div>
                    )}

                    {method.id === "bank_transfer" && (
                      <div className="grid gap-4">
                        <div className="grid gap-2">
                          <Label>اسم البنك</Label>
                          <Input
                            value={form.bank_transfer.bankName}
                            onChange={(e) => updateMethod("bank_transfer", { bankName: e.target.value })}
                            placeholder="اسم البنك"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>اسم صاحب الحساب</Label>
                          <Input
                            value={form.bank_transfer.accountName}
                            onChange={(e) => updateMethod("bank_transfer", { accountName: e.target.value })}
                            placeholder="اسم الحساب"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>رقم الحساب</Label>
                          <Input
                            value={form.bank_transfer.accountNumber}
                            onChange={(e) => updateMethod("bank_transfer", { accountNumber: e.target.value })}
                            placeholder="0000000000"
                            dir="ltr"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label>IBAN</Label>
                            <Input
                              value={form.bank_transfer.iban}
                              onChange={(e) => updateMethod("bank_transfer", { iban: e.target.value })}
                              placeholder="EG00XXXX..."
                              dir="ltr"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label>SWIFT</Label>
                            <Input
                              value={form.bank_transfer.swift}
                              onChange={(e) => updateMethod("bank_transfer", { swift: e.target.value })}
                              placeholder="ABCDEF12"
                              dir="ltr"
                            />
                          </div>
                        </div>
                        <div className="grid gap-2">
                          <Label>الفرع</Label>
                          <Input
                            value={form.bank_transfer.branch}
                            onChange={(e) => updateMethod("bank_transfer", { branch: e.target.value })}
                            placeholder="اسم الفرع"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>تعليمات إضافية</Label>
                          <Textarea
                            value={form.bank_transfer.notes}
                            onChange={(e) => updateMethod("bank_transfer", { notes: e.target.value })}
                            placeholder="أضف أي تعليمات خاصة بالدفع"
                          />
                        </div>
                        <div className="flex justify-end">
                          <Button onClick={() => handleSave("bank_transfer")} disabled={saving === "bank_transfer"}>
                            {saving === "bank_transfer" ? "جارٍ الحفظ..." : "حفظ"}
                          </Button>
                        </div>
                      </div>
                    )}
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
