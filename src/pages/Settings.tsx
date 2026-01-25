import { useEffect, useState } from "react";
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

export default function Settings() {
  const { user, profile, roles } = useAuth();
  const updateProfile = useUpdateProfile();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    profitReminder: true,
    withdrawReminder: true,
    newClient: true,
  });

  useEffect(() => {
    const derivedName =
      profile?.full_name ||
      [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
      "";
    setFullName(derivedName);
    setEmail(user?.email || profile?.email || "");
    setPhone(profile?.phone || "");
  }, [profile, user?.email]);

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
                    <Input id="currentPassword" type="password" />
                  </div>
                  <div></div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
                    <Input id="newPassword" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
                    <Input id="confirmPassword" type="password" />
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
                  <Switch />
                </div>
                <Button className="gradient-primary">
                  <Save className="ml-2 h-4 w-4" />
                  حفظ التغييرات
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
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <Button className="gradient-primary">
                  <Save className="ml-2 h-4 w-4" />
                  حفظ التغييرات
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
                    <Select defaultValue="medium">
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
                    <Select defaultValue="ar">
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
                <Button className="gradient-primary">
                  <Save className="ml-2 h-4 w-4" />
                  حفظ التغييرات
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
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>نسبة العمولة الافتراضية</Label>
                    <Input type="number" defaultValue="5" />
                  </div>
                  <div className="space-y-2">
                    <Label>نسبة الربح الافتراضية</Label>
                    <Input type="number" defaultValue="10" />
                  </div>
                  <div className="space-y-2">
                    <Label>أيام التنبيه قبل الموعد</Label>
                    <Input type="number" defaultValue="3" />
                  </div>
                  <div className="space-y-2">
                    <Label>العملة</Label>
                    <Select defaultValue="egp">
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
                <Button className="gradient-primary">
                  <Save className="ml-2 h-4 w-4" />
                  حفظ التغييرات
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}


