import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { logger } from "@/lib/logger";
import { UserPlus, Shield, Users, Search, Edit, Trash2, Key, Loader2, X, User } from "lucide-react";

type AppRole = "super_admin" | "admin" | "hr_manager" | "hr_officer" | "tele_sales" | "accountant" | "support";
type Department = "admin" | "hr" | "tele_sales" | "finance" | "support";

interface UserWithProfile {
  id: string;
  email: string;
  profile: {
    first_name: string;
    last_name: string;
    phone: string | null;
    department: Department;
    employee_code: string | null;
    is_active: boolean;
  } | null;
  roles: AppRole[];
}

const roleLabels: Record<AppRole, string> = {
  super_admin: "سوبر أدمن",
  admin: "أدمن",
  hr_manager: "مدير HR",
  hr_officer: "موظف HR",
  tele_sales: "تيلي سيلز",
  accountant: "محاسب",
  support: "دعم فني",
};

const departmentLabels: Record<Department, string> = {
  admin: "الإدارة",
  hr: "الموارد البشرية",
  tele_sales: "المبيعات",
  finance: "المالية",
  support: "الدعم الفني",
};

const roleColors: Record<AppRole, string> = {
  super_admin: "bg-red-500",
  admin: "bg-orange-500",
  hr_manager: "bg-blue-500",
  hr_officer: "bg-blue-400",
  tele_sales: "bg-green-500",
  accountant: "bg-purple-500",
  support: "bg-gray-500",
};

const UserManagement = () => {
  const [users, setUsers] = useState<UserWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithProfile | null>(null);
  const [newUserData, setNewUserData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
    department: "support" as Department,
    role: "support" as AppRole,
  });
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const { isSuperAdmin } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch all roles
      const { data: allRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");

      if (rolesError) throw rolesError;

      // Combine data
      const usersWithRoles: UserWithProfile[] = (profiles || []).map((profile) => ({
        id: profile.user_id,
        email: profile.email,
        profile: {
          first_name: profile.first_name,
          last_name: profile.last_name,
          phone: profile.phone,
          department: profile.department as Department,
          employee_code: profile.employee_code,
          is_active: profile.is_active,
        },
        roles: (allRoles || [])
          .filter((r) => r.user_id === profile.user_id)
          .map((r) => r.role as AppRole),
      }));

      setUsers(usersWithRoles);
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: "فشل في تحميل المستخدمين",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newUserData.email || !newUserData.password || !newUserData.firstName || !newUserData.lastName) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      // Create user via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUserData.email,
        password: newUserData.password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            first_name: newUserData.firstName,
            last_name: newUserData.lastName,
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // Update profile with department and phone
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            phone: newUserData.phone,
            department: newUserData.department,
          })
          .eq("user_id", authData.user.id);

        if (profileError) logger.error("Profile update error", { error: profileError, userId: authData.user.id });

        // Add role
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({
            user_id: authData.user.id,
            role: newUserData.role,
          });

        if (roleError) logger.error("Role insert error", { error: roleError, userId: authData.user.id, role: newUserData.role });

        toast({
          title: "تم بنجاح",
          description: "تم إنشاء المستخدم بنجاح",
        });

        setShowAddDialog(false);
        setNewUserData({
          email: "",
          password: "",
          firstName: "",
          lastName: "",
          phone: "",
          department: "support",
          role: "support",
        });
        fetchUsers();
      }
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "فشل في إنشاء المستخدم",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddRole = async (userId: string, role: AppRole) => {
    try {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role });

      if (error) throw error;

      toast({
        title: "تم بنجاح",
        description: "تم إضافة الصلاحية",
      });
      fetchUsers();
      setShowRoleDialog(false);
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "فشل في إضافة الصلاحية",
        variant: "destructive",
      });
    }
  };

  const handleRemoveRole = async (userId: string, role: AppRole) => {
    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", role);

      if (error) throw error;

      toast({
        title: "تم بنجاح",
        description: "تم إزالة الصلاحية",
      });
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "فشل في إزالة الصلاحية",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (userId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_active: !isActive })
        .eq("user_id", userId);

      if (error) throw error;

      toast({
        title: "تم بنجاح",
        description: isActive ? "تم تعطيل الحساب" : "تم تفعيل الحساب",
      });
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: "فشل في تحديث حالة الحساب",
        variant: "destructive",
      });
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.profile?.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.profile?.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.profile?.employee_code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/90 via-primary to-primary/80 p-6 text-primary-foreground shadow-xl animate-slide-right">
          <div className="absolute inset-0 bg-grid-white/10" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                <Users className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">إدارة المستخدمين</h1>
                <p className="text-primary-foreground/80">إنشاء وإدارة حسابات الموظفين وصلاحياتهم</p>
              </div>
            </div>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button variant="secondary" className="shadow-lg">
                  <UserPlus className="ml-2 h-4 w-4" />
                  إضافة مستخدم
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>إضافة مستخدم جديد</DialogTitle>
                <DialogDescription>أدخل بيانات الموظف الجديد</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>الاسم الأول *</Label>
                    <Input
                      value={newUserData.firstName}
                      onChange={(e) => setNewUserData({ ...newUserData, firstName: e.target.value })}
                      placeholder="أحمد"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>الاسم الأخير *</Label>
                    <Input
                      value={newUserData.lastName}
                      onChange={(e) => setNewUserData({ ...newUserData, lastName: e.target.value })}
                      placeholder="محمد"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>البريد الإلكتروني *</Label>
                  <Input
                    type="email"
                    value={newUserData.email}
                    onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                    placeholder="employee@company.com"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label>كلمة المرور *</Label>
                  <Input
                    type="password"
                    value={newUserData.password}
                    onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                    placeholder="••••••••"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label>رقم الهاتف</Label>
                  <Input
                    value={newUserData.phone}
                    onChange={(e) => setNewUserData({ ...newUserData, phone: e.target.value })}
                    placeholder="01xxxxxxxxx"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label>القسم</Label>
                  <Select
                    value={newUserData.department}
                    onValueChange={(value: Department) => setNewUserData({ ...newUserData, department: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(departmentLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>الصلاحية</Label>
                  <Select
                    value={newUserData.role}
                    onValueChange={(value: AppRole) => setNewUserData({ ...newUserData, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(roleLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value} disabled={value === "super_admin" && !isSuperAdmin()}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>إلغاء</Button>
                <Button onClick={handleCreateUser} disabled={submitting}>
                  {submitting ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : null}
                  إنشاء المستخدم
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-slide-up">
          <Card className="shadow-lg border-0 bg-gradient-to-br from-card to-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                إجمالي المستخدمين
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{users.length}</div>
            </CardContent>
          </Card>
          <Card className="shadow-lg border-0 bg-gradient-to-br from-card to-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                نشط
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {users.filter((u) => u.profile?.is_active).length}
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-lg border-0 bg-gradient-to-br from-card to-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-red-500" />
                موقوف
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">
                {users.filter((u) => !u.profile?.is_active).length}
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-lg border-0 bg-gradient-to-br from-card to-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Shield className="h-4 w-4" />
                الأدمن
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">
                {users.filter((u) => u.roles.includes("admin") || u.roles.includes("super_admin")).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="shadow-lg border-0 animate-slide-up">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute right-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="بحث بالاسم أو البريد أو الكود..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 h-12 text-base"
              />
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="shadow-lg border-0 animate-slide-up">
          <CardHeader className="bg-muted/30">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              قائمة المستخدمين
              <Badge variant="secondary" className="mr-2">{filteredUsers.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الاسم</TableHead>
                    <TableHead>البريد الإلكتروني</TableHead>
                    <TableHead>القسم</TableHead>
                    <TableHead>الصلاحيات</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 text-primary">
                            <User className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="font-semibold">
                              {user.profile?.first_name} {user.profile?.last_name}
                            </div>
                            {user.profile?.employee_code && (
                              <div className="text-xs text-muted-foreground font-mono">{user.profile.employee_code}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell dir="ltr" className="text-left font-mono text-sm">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-normal">
                          {user.profile ? departmentLabels[user.profile.department] : "-"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.roles.length === 0 ? (
                            <Badge variant="outline" className="text-muted-foreground">بدون صلاحية</Badge>
                          ) : (
                            user.roles.map((role) => (
                              <Badge
                                key={role}
                                className={`${roleColors[role]} text-white cursor-pointer hover:opacity-80 transition-opacity`}
                                onClick={() => isSuperAdmin() && handleRemoveRole(user.id, role)}
                              >
                                {roleLabels[role]}
                              </Badge>
                            ))
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={user.profile?.is_active ? "default" : "destructive"}
                          className="shadow-sm"
                        >
                          {user.profile?.is_active ? "نشط" : "موقوف"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="hover:bg-primary/10 hover:text-primary"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowRoleDialog(true);
                            }}
                            title="إدارة الصلاحيات"
                          >
                            <Shield className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={user.profile?.is_active ? "hover:bg-destructive/10 hover:text-destructive" : "hover:bg-green-500/10 hover:text-green-600"}
                            onClick={() => handleToggleActive(user.id, user.profile?.is_active ?? true)}
                            title={user.profile?.is_active ? "إيقاف الحساب" : "تفعيل الحساب"}
                          >
                            <Key className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Add Role Dialog */}
        <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إدارة صلاحيات المستخدم</DialogTitle>
              <DialogDescription>
                {selectedUser?.profile?.first_name} {selectedUser?.profile?.last_name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>الصلاحيات الحالية</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedUser?.roles.length === 0 ? (
                    <span className="text-muted-foreground text-sm">لا توجد صلاحيات</span>
                  ) : (
                    selectedUser?.roles.map((role) => (
                      <Badge 
                        key={role} 
                        className={`${roleColors[role]} text-white flex items-center gap-1`}
                      >
                        {roleLabels[role]}
                        <button
                          onClick={() => selectedUser && handleRemoveRole(selectedUser.id, role)}
                          className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
                          disabled={role === "super_admin" && !isSuperAdmin()}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))
                  )}
                </div>
              </div>
              <div>
                <Label>إضافة صلاحية جديدة</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {(Object.keys(roleLabels) as AppRole[])
                    .filter((role) => !selectedUser?.roles.includes(role))
                    .map((role) => (
                      <Button
                        key={role}
                        variant="outline"
                        size="sm"
                        onClick={() => selectedUser && handleAddRole(selectedUser.id, role)}
                        disabled={role === "super_admin" && !isSuperAdmin()}
                      >
                        {roleLabels[role]}
                      </Button>
                    ))}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
};

export default UserManagement;
