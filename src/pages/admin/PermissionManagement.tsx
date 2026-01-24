import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Shield, Search, User, Save, Loader2, Check, X } from "lucide-react";
import { ALL_PERMISSIONS, CATEGORY_LABELS, Permission, PermissionCategory } from "@/types/permissions";

type Department = "admin" | "hr" | "tele_sales" | "finance" | "support";

interface UserWithPermissions {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  department: Department;
  employee_code: string | null;
  is_active: boolean;
  permissions: string[];
}

const departmentLabels: Record<Department, string> = {
  admin: "الإدارة",
  hr: "الموارد البشرية",
  tele_sales: "المبيعات",
  finance: "المالية",
  support: "الدعم الفني",
};

const PermissionManagement = () => {
  const [users, setUsers] = useState<UserWithPermissions[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserWithPermissions | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

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

      // Fetch all permissions
      const { data: allPermissions, error: permissionsError } = await supabase
        .from("user_permissions")
        .select("*");

      if (permissionsError) throw permissionsError;

      // Combine data
      const usersWithPermissions: UserWithPermissions[] = (profiles || []).map((profile) => ({
        id: profile.user_id,
        email: profile.email,
        first_name: profile.first_name,
        last_name: profile.last_name,
        department: profile.department as Department,
        employee_code: profile.employee_code,
        is_active: profile.is_active,
        permissions: (allPermissions || [])
          .filter((p) => p.user_id === profile.user_id)
          .map((p) => p.permission),
      }));

      setUsers(usersWithPermissions);
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

  const openPermissionsDialog = (user: UserWithPermissions) => {
    setSelectedUser(user);
    setSelectedPermissions(new Set(user.permissions));
  };

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(permissionId)) {
        newSet.delete(permissionId);
      } else {
        newSet.add(permissionId);
      }
      return newSet;
    });
  };

  const toggleCategory = (category: PermissionCategory, checked: boolean) => {
    const categoryPermissions = ALL_PERMISSIONS.filter((p) => p.category === category);
    setSelectedPermissions((prev) => {
      const newSet = new Set(prev);
      categoryPermissions.forEach((p) => {
        if (checked) {
          newSet.add(p.id);
        } else {
          newSet.delete(p.id);
        }
      });
      return newSet;
    });
  };

  const isCategoryFullySelected = (category: PermissionCategory): boolean => {
    const categoryPermissions = ALL_PERMISSIONS.filter((p) => p.category === category);
    return categoryPermissions.every((p) => selectedPermissions.has(p.id));
  };

  const isCategoryPartiallySelected = (category: PermissionCategory): boolean => {
    const categoryPermissions = ALL_PERMISSIONS.filter((p) => p.category === category);
    const selectedCount = categoryPermissions.filter((p) => selectedPermissions.has(p.id)).length;
    return selectedCount > 0 && selectedCount < categoryPermissions.length;
  };

  const savePermissions = async () => {
    if (!selectedUser) return;

    setSaving(true);
    try {
      // Delete existing permissions
      const { error: deleteError } = await supabase
        .from("user_permissions")
        .delete()
        .eq("user_id", selectedUser.id);

      if (deleteError) throw deleteError;

      // Insert new permissions
      if (selectedPermissions.size > 0) {
        const permissionsToInsert = Array.from(selectedPermissions).map((permission) => {
          const permissionDef = ALL_PERMISSIONS.find((p) => p.id === permission);
          return {
            user_id: selectedUser.id,
            permission: permission,
            category: permissionDef?.category || "dashboard",
          };
        });

        const { error: insertError } = await supabase
          .from("user_permissions")
          .insert(permissionsToInsert);

        if (insertError) throw insertError;
      }

      toast({
        title: "تم بنجاح",
        description: "تم حفظ الصلاحيات",
      });

      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "فشل في حفظ الصلاحيات",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const selectAllPermissions = () => {
    setSelectedPermissions(new Set(ALL_PERMISSIONS.map((p) => p.id)));
  };

  const clearAllPermissions = () => {
    setSelectedPermissions(new Set());
  };

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.employee_code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = Object.keys(CATEGORY_LABELS) as PermissionCategory[];

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            إدارة الصلاحيات
          </h1>
          <p className="text-muted-foreground">تحديد صلاحيات مخصصة لكل مستخدم</p>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث بالاسم أو البريد أو الكود..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Users Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredUsers.map((user) => (
              <Card key={user.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base">
                          {user.first_name} {user.last_name}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {user.email}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant={user.is_active ? "default" : "secondary"}>
                      {user.is_active ? "نشط" : "موقوف"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">القسم:</span>
                    <span>{departmentLabels[user.department]}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">الصلاحيات:</span>
                    <Badge variant="outline">{user.permissions.length} صلاحية</Badge>
                  </div>
                  {user.permissions.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {user.permissions.slice(0, 3).map((perm) => (
                        <Badge key={perm} variant="secondary" className="text-xs">
                          {ALL_PERMISSIONS.find((p) => p.id === perm)?.name || perm}
                        </Badge>
                      ))}
                      {user.permissions.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{user.permissions.length - 3} أخرى
                        </Badge>
                      )}
                    </div>
                  )}
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => openPermissionsDialog(user)}
                  >
                    <Shield className="ml-2 h-4 w-4" />
                    تعديل الصلاحيات
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Permissions Dialog */}
        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>
                صلاحيات: {selectedUser?.first_name} {selectedUser?.last_name}
              </DialogTitle>
              <DialogDescription>
                حدد الصلاحيات التي تريد منحها لهذا المستخدم
              </DialogDescription>
            </DialogHeader>

            <div className="flex gap-2 mb-4">
              <Button variant="outline" size="sm" onClick={selectAllPermissions}>
                <Check className="ml-1 h-4 w-4" />
                تحديد الكل
              </Button>
              <Button variant="outline" size="sm" onClick={clearAllPermissions}>
                <X className="ml-1 h-4 w-4" />
                إلغاء الكل
              </Button>
              <Badge variant="secondary" className="mr-auto">
                {selectedPermissions.size} صلاحية محددة
              </Badge>
            </div>

            <Tabs defaultValue={categories[0]} className="w-full">
              <TabsList className="flex flex-wrap h-auto gap-1 mb-4">
                {categories.map((category) => (
                  <TabsTrigger key={category} value={category} className="text-xs">
                    {CATEGORY_LABELS[category]}
                    {isCategoryFullySelected(category) && (
                      <Check className="mr-1 h-3 w-3 text-primary" />
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>

              <ScrollArea className="h-[400px] rounded-md border p-4">
                {categories.map((category) => (
                  <TabsContent key={category} value={category} className="mt-0">
                    <div className="space-y-4">
                      {/* Category header with select all */}
                      <div className="flex items-center gap-2 pb-2 border-b">
                        <Checkbox
                          id={`category-${category}`}
                          checked={isCategoryFullySelected(category)}
                          onCheckedChange={(checked) => toggleCategory(category, !!checked)}
                        />
                        <label
                          htmlFor={`category-${category}`}
                          className="text-sm font-medium cursor-pointer"
                        >
                          تحديد كل صلاحيات {CATEGORY_LABELS[category]}
                        </label>
                      </div>

                      {/* Permissions list */}
                      <div className="grid gap-3 md:grid-cols-2">
                        {ALL_PERMISSIONS.filter((p) => p.category === category).map((permission) => (
                          <div
                            key={permission.id}
                            className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                          >
                            <Checkbox
                              id={permission.id}
                              checked={selectedPermissions.has(permission.id)}
                              onCheckedChange={() => togglePermission(permission.id)}
                            />
                            <div className="flex-1">
                              <label
                                htmlFor={permission.id}
                                className="text-sm font-medium cursor-pointer block"
                              >
                                {permission.name}
                              </label>
                              <p className="text-xs text-muted-foreground">
                                {permission.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                ))}
              </ScrollArea>
            </Tabs>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedUser(null)}>
                إلغاء
              </Button>
              <Button onClick={savePermissions} disabled={saving}>
                {saving ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Save className="ml-2 h-4 w-4" />}
                حفظ الصلاحيات
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
};

export default PermissionManagement;
