import { useEffect, useMemo, useState } from "react";
import {
  User,
  Lock,
  Bell,
  Palette,
  Shield,
  Database,
  Save,
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useUpdateProfile } from "@/hooks/queries/useProfiles";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { user, profile, roles, isAdmin } = useAuth();
  const updateProfile = useUpdateProfile();
  const { toast } = useToast();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const defaultNotifications = useMemo(
    () => ({
      email: true,
      push: true,
      sms: false,
      profitReminder: true,
      withdrawReminder: true,
      newClient: true,
    }),
    []
  );
  const [notifications, setNotifications] = useState(defaultNotifications);
  const [appearance, setAppearance] = useState({
    fontSize: "medium",
    language: "ar",
  });
  const [systemSettings, setSystemSettings] = useState<{
    defaultCommissionRate: number;
    defaultProfitRate: number;
    reminderDays: number;
    currency: string;
  } | null>(null);
  const [security, setSecurity] = useState({
    twoFactorEnabled: false,
  });
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingSection, setSavingSection] = useState<
    null | "notifications" | "appearance" | "system" | "security"
  >(null);

  useEffect(() => {
    const derivedName =
      profile?.full_name ||
      [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
      "";
    setFullName(derivedName);
    setEmail(user?.email || profile?.email || "");
    setPhone(profile?.phone || "");
  }, [profile, user?.email]);

  useEffect(() => {
    if (!user) return;

    const fetchSettings = async () => {
      setLoadingSettings(true);

      const [{ data: userSettings, error: userError }, { data: appSettings, error: appError }] =
        await Promise.all([
          supabase
            .from("user_settings")
            .select("*")
            .eq("user_id", user.id)
            .maybeSingle(),
          supabase.from("app_settings").select("key, value"),
        ]);

      if (userError) {
        toast({
          title: "خطأ",
          description: userError.message || "فشل في تحميل إعدادات المستخدم",
          variant: "destructive",
        });
      }

      if (appError) {
        toast({
          title: "خطأ",
          description: appError.message || "فشل في تحميل إعدادات النظام",
          variant: "destructive",
        });
      }

      if (userSettings) {
        const incomingNotifications = (userSettings.notifications || {}) as Record<string, boolean>;
        setNotifications({
          ...defaultNotifications,
          ...incomingNotifications,
        });

        const incomingAppearance = (userSettings.appearance || {}) as Record<string, string>;
        setAppearance({
          fontSize: incomingAppearance.fontSize || "medium",
          language: incomingAppearance.language || "ar",
        });

        const incomingSecurity = (userSettings.security || {}) as Record<string, boolean>;
        setSecurity({
          twoFactorEnabled: Boolean(incomingSecurity.twoFactorEnabled),
        });
      }

      if (appSettings) {
        const settingsMap = new Map(appSettings.map((item) => [item.key, item.value]));
        setSystemSettings({
          defaultCommissionRate: Number(settingsMap.get("default_commission_rate") ?? 5),
          defaultProfitRate: Number(settingsMap.get("default_profit_rate") ?? 10),
          reminderDays: Number(settingsMap.get("reminder_days") ?? 3),
          currency: settingsMap.get("currency") || "egp",
        });
      }

      setLoadingSettings(false);
    };

    fetchSettings();
  }, [defaultNotifications, toast, user]);

  const roleLabel = roles.length > 0
    ? roles.join("، ")
    : profile?.department || "";

  const handleProfileSave = () => {
    if (!user) return;

    const trimmedName = fullName.trim();
    const [firstName, ...rest] = trimmedName.split(/\s+/);
    const lastName = rest.join(" ");

    updateProfile.mutate({
      userId: user.id,
      updates: {
        first_name: firstName || profile?.first_name || "",
        last_name: lastName || profile?.last_name || "",
        email: user?.email || profile?.email || "",
        phone: phone.trim() ? phone.trim() : null,
      },
    });
  };

  const handleNotificationsSave = async () => {
    if (!user) return;
    setSavingSection("notifications");

    const { error } = await supabase
      .from("user_settings")
      .upsert({ user_id: user.id, notifications });

    if (error) {
      toast({
        title: "خطأ",
        description: error.message || "فشل في حفظ إعدادات الإشعارات",
        variant: "destructive",
      });
    } else {
      toast({
        title: "تم بنجاح",
        description: "تم حفظ إعدادات الإشعارات",
      });
    }

    setSavingSection(null);
  };

  const handleAppearanceSave = async () => {
    if (!user) return;
    setSavingSection("appearance");

    const { error } = await supabase
      .from("user_settings")
      .upsert({ user_id: user.id, appearance });

    if (error) {
      toast({
        title: "خطأ",
        description: error.message || "فشل في حفظ إعدادات المظهر",
        variant: "destructive",
      });
    } else {
      toast({
        title: "تم بنجاح",
        description: "تم حفظ إعدادات المظهر",
      });
    }

    setSavingSection(null);
  };

  const handleSystemSave = async () => {
    if (!isAdmin()) {
      toast({
        title: "غير مسموح",
        description: "هذه الإعدادات خاصة بالمدير فقط",
        variant: "destructive",
      });
      return;
    }

    setSavingSection("system");

    const payload = [
      {
        key: "default_commission_rate",
        value: String(systemSettings.defaultCommissionRate),
        description: "نسبة العمولة الافتراضية",
      },
      {
        key: "default_profit_rate",
        value: String(systemSettings.defaultProfitRate),
        description: "نسبة الربح الافتراضية",
      },
      {
        key: "reminder_days",
        value: String(systemSettings.reminderDays),
        description: "أيام التنبيه قبل الموعد",
      },
      {
        key: "currency",
        value: systemSettings.currency,
        description: "العملة الافتراضية",
      },
    ];

    const { error } = await supabase
      .from("app_settings")
      .upsert(payload, { onConflict: "key" });

    if (error) {
      toast({
        title: "خطأ",
        description: error.message || "فشل في حفظ إعدادات النظام",
        variant: "destructive",
      });
    } else {
      toast({
        title: "تم بنجاح",
        description: "تم حفظ إعدادات النظام",
      });
    }

    setSavingSection(null);
  };

  const handleSecuritySave = async () => {
    if (!user) return;
    setSavingSection("security");

    if (newPassword || confirmPassword || currentPassword) {
      if (!newPassword || !confirmPassword || !currentPassword) {
        toast({
          title: "خطأ",
          description: "يرجى إدخال كلمة المرور الحالية والجديدة وتأكيدها",
          variant: "destructive",
        });
        setSavingSection(null);
        return;
      }

      if (newPassword !== confirmPassword) {
        toast({
          title: "خطأ",
          description: "كلمة المرور الجديدة غير متطابقة",
          variant: "destructive",
        });
        setSavingSection(null);
        return;
      }

      if (!user.email) {
        toast({
          title: "خطأ",
          description: "تعذر التحقق من البريد الإلكتروني للمستخدم",
          variant: "destructive",
        });
        setSavingSection(null);
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        toast({
          title: "خطأ",
          description: "كلمة المرور الحالية غير صحيحة",
          variant: "destructive",
        });
        setSavingSection(null);
        return;
      }

      const { error: passwordError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (passwordError) {
        toast({
          title: "خطأ",
          description: passwordError.message || "فشل في تحديث كلمة المرور",
          variant: "destructive",
        });
        setSavingSection(null);
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }

    const { error } = await supabase
      .from("user_settings")
      .upsert({ user_id: user.id, security });

    if (error) {
      toast({
        title: "خطأ",
        description: error.message || "فشل في حفظ إعدادات الأمان",
        variant: "destructive",
      });
    } else {
      toast({
        title: "تم بنجاح",
        description: "تم حفظ إعدادات الأمان",
      });
    }

    setSavingSection(null);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="animate-slide-right">
          <h1 className="text-3xl font-bold text-foreground">الإعدادات</h1>
          <p className="text-muted-foreground mt-1">
            إدارة إعدادات النظام والحساب الشخصي
          </p>
        </div>

        {/* Settings Tabs */}
        <Tabs defaultValue="profile" className="animate-slide-up">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:grid-cols-none lg:flex">
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4" />
              الملف الشخصي
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Lock className="h-4 w-4" />
              الأمان
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              الإشعارات
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-2">
              <Palette className="h-4 w-4" />
              المظهر
            </TabsTrigger>
            <TabsTrigger value="system" className="gap-2">
              <Database className="h-4 w-4" />
              النظام
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>الملف الشخصي</CardTitle>
                <CardDescription>
                  تعديل بيانات الحساب الشخصي
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">الاسم الكامل</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">البريد الإلكتروني</Label>
                    <Input id="email" type="email" value={email} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">رقم الهاتف</Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">الدور</Label>
                    <Input id="role" value={roleLabel} disabled />
                  </div>
                </div>
                <Button
                  className="gradient-primary"
                  onClick={handleProfileSave}
                  disabled={updateProfile.isPending}
                >
                  <Save className="ml-2 h-4 w-4" />
                  حفظ التغييرات
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          {/* Security Tab */}
          <TabsContent value="security" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>الأمان</CardTitle>
                <CardDescription>
                  تغيير كلمة المرور وإعدادات الأمان
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">كلمة المرور الحالية</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      disabled={savingSection === "security"}
                    />
                  </div>
                  <div></div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={savingSection === "security"}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={savingSection === "security"}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">التحقق بخطوتين</p>
                      <p className="text-sm text-muted-foreground">
                        إضافة طبقة حماية إضافية لحسابك
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={security.twoFactorEnabled}
                    onCheckedChange={(checked) =>
                      setSecurity((prev) => ({ ...prev, twoFactorEnabled: checked }))
                    }
                    disabled={savingSection === "security"}
                  />
                </div>
                <Button
                  className="gradient-primary"
                  onClick={handleSecuritySave}
                  disabled={savingSection === "security"}
                >
                  <Save className="ml-2 h-4 w-4" />
                  {savingSection === "security" ? "جارٍ الحفظ..." : "حفظ التغييرات"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>الإشعارات</CardTitle>
                <CardDescription>
                  إدارة طرق استلام الإشعارات والتنبيهات
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-medium">طرق الإشعار</h4>
                  <div className="space-y-4">
                    {[
                      { key: "email", label: "البريد الإلكتروني", desc: "استلام الإشعارات عبر البريد" },
                      { key: "push", label: "إشعارات المتصفح", desc: "إشعارات فورية في المتصفح" },
                      { key: "sms", label: "الرسائل النصية", desc: "استلام التنبيهات عبر SMS" },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between rounded-lg border p-4">
                        <div>
                          <p className="font-medium">{item.label}</p>
                          <p className="text-sm text-muted-foreground">{item.desc}</p>
                        </div>
                        <Switch
                          checked={notifications[item.key as keyof typeof notifications]}
                          onCheckedChange={(checked) =>
                            setNotifications({ ...notifications, [item.key]: checked })
                          }
                          disabled={loadingSettings || savingSection === "notifications"}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium">أنواع التنبيهات</h4>
                  <div className="space-y-4">
                    {[
                      { key: "profitReminder", label: "تذكير صرف الأرباح", desc: "تنبيه قبل موعد صرف الأرباح" },
                      { key: "withdrawReminder", label: "تذكير السحب", desc: "تنبيه قبل موعد السحب" },
                      { key: "newClient", label: "عميل جديد", desc: "تنبيه عند إضافة عميل جديد" },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between rounded-lg border p-4">
                        <div>
                          <p className="font-medium">{item.label}</p>
                          <p className="text-sm text-muted-foreground">{item.desc}</p>
                        </div>
                        <Switch
                          checked={notifications[item.key as keyof typeof notifications]}
                          onCheckedChange={(checked) =>
                            setNotifications({ ...notifications, [item.key]: checked })
                          }
                          disabled={loadingSettings || savingSection === "notifications"}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <Button
                  className="gradient-primary"
                  onClick={handleNotificationsSave}
                  disabled={loadingSettings || savingSection === "notifications"}
                >
                  <Save className="ml-2 h-4 w-4" />
                  {savingSection === "notifications" ? "جارٍ الحفظ..." : "حفظ التغييرات"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>المظهر</CardTitle>
                <CardDescription>
                  تخصيص مظهر واجهة النظام
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>حجم الخط</Label>
                    <Select
                      value={appearance.fontSize}
                      onValueChange={(value) =>
                        setAppearance((prev) => ({ ...prev, fontSize: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">صغير</SelectItem>
                        <SelectItem value="medium">متوسط</SelectItem>
                        <SelectItem value="large">كبير</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>اللغة</Label>
                    <Select
                      value={appearance.language}
                      onValueChange={(value) =>
                        setAppearance((prev) => ({ ...prev, language: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ar">العربية</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button
                  className="gradient-primary"
                  onClick={handleAppearanceSave}
                  disabled={loadingSettings || savingSection === "appearance"}
                >
                  <Save className="ml-2 h-4 w-4" />
                  {savingSection === "appearance" ? "جارٍ الحفظ..." : "حفظ التغييرات"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Tab */}
          <TabsContent value="system" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>إعدادات النظام</CardTitle>
                <CardDescription>
                  إعدادات عامة للنظام (للمدير فقط)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {loadingSettings || !systemSettings ? (
                  <div className="space-y-4">
                    <div className="h-10 w-full animate-pulse rounded-md bg-muted"></div>
                    <div className="h-10 w-full animate-pulse rounded-md bg-muted"></div>
                    <div className="h-10 w-full animate-pulse rounded-md bg-muted"></div>
                    <div className="h-10 w-full animate-pulse rounded-md bg-muted"></div>
                  </div>
                ) : (
                  <>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>نسبة العمولة الافتراضية</Label>
                        <Input
                          type="number"
                          value={systemSettings.defaultCommissionRate}
                          onChange={(e) =>
                            setSystemSettings((prev) => ({
                              ...prev!,
                              defaultCommissionRate: Number(e.target.value || 0),
                            }))
                          }
                          disabled={!isAdmin() || savingSection === "system"}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>نسبة الربح الافتراضية</Label>
                        <Input
                          type="number"
                          value={systemSettings.defaultProfitRate}
                          onChange={(e) =>
                            setSystemSettings((prev) => ({
                              ...prev!,
                              defaultProfitRate: Number(e.target.value || 0),
                            }))
                          }
                          disabled={!isAdmin() || savingSection === "system"}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>أيام التنبيه قبل الموعد</Label>
                        <Input
                          type="number"
                          value={systemSettings.reminderDays}
                          onChange={(e) =>
                            setSystemSettings((prev) => ({
                              ...prev!,
                              reminderDays: Number(e.target.value || 0),
                            }))
                          }
                          disabled={!isAdmin() || savingSection === "system"}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>العملة</Label>
                        <Select
                          value={systemSettings.currency}
                          onValueChange={(value) =>
                            setSystemSettings((prev) => ({ ...prev!, currency: value }))
                          }
                          disabled={!isAdmin() || savingSection === "system"}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="egp">جنيه مصري (ج.م)</SelectItem>
                            <SelectItem value="usd">دولار أمريكي ($)</SelectItem>
                            <SelectItem value="sar">ريال سعودي (ر.س)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button
                      className="gradient-primary"
                      onClick={handleSystemSave}
                      disabled={!isAdmin() || savingSection === "system"}
                    >
                      <Save className="ml-2 h-4 w-4" />
                      {savingSection === "system" ? "جارٍ الحفظ..." : "حفظ التغييرات"}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}


