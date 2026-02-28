import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Target, Plus, Search, Loader2, TrendingUp, Users, Phone, DollarSign } from "lucide-react";
import { format, startOfMonth } from "date-fns";
import { ar } from "date-fns/locale";

type TargetType = "calls" | "clients" | "deposits" | "amount";
type TargetStatus = "active" | "completed" | "failed";

interface EmployeeTarget {
  id: string;
  employee_id: string;
  target_type: TargetType;
  target_value: number;
  current_value: number;
  month: string;
  status: TargetStatus;
  created_at: string;
  employee_profile?: {
    first_name: string;
    last_name: string;
    department: string;
  };
}

interface Profile {
  user_id: string;
  first_name: string;
  last_name: string;
  department: string;
}

const targetTypeConfig: Record<TargetType, { label: string; icon: React.ReactNode; unit: string }> = {
  calls: { label: "عدد المكالمات", icon: <Phone className="h-4 w-4" />, unit: "مكالمة" },
  clients: { label: "عدد العملاء", icon: <Users className="h-4 w-4" />, unit: "عميل" },
  deposits: { label: "عدد الإيداعات", icon: <TrendingUp className="h-4 w-4" />, unit: "إيداع" },
  amount: { label: "مبلغ الإيداعات", icon: <DollarSign className="h-4 w-4" />, unit: "ج.م" },
};

const statusConfig: Record<TargetStatus, { label: string; color: string }> = {
  active: { label: "نشط", color: "bg-blue-500" },
  completed: { label: "مكتمل", color: "bg-green-500" },
  failed: { label: "لم يكتمل", color: "bg-red-500" },
};

const EmployeeTargets = () => {
  const [targets, setTargets] = useState<EmployeeTarget[]>([]);
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newTarget, setNewTarget] = useState({
    employee_id: "",
    target_type: "calls" as TargetType,
    target_value: "",
    month: format(startOfMonth(new Date()), "yyyy-MM-dd"),
  });
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch targets
      const { data: targetsData, error: targetsError } = await supabase
        .from("employee_targets")
        .select("*")
        .order("created_at", { ascending: false });

      if (targetsError) throw targetsError;

      // Fetch all profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, first_name, last_name, department");

      if (profilesError) throw profilesError;

      setEmployees(profilesData || []);

      const targetsWithProfiles = (targetsData || []).map((target) => ({
        ...target,
        employee_profile: profilesData?.find((p) => p.user_id === target.employee_id),
      }));

      setTargets(targetsWithProfiles as EmployeeTarget[]);
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: "فشل في تحميل البيانات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddTarget = async () => {
    if (!newTarget.employee_id || !newTarget.target_value) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase.from("employee_targets").insert({
        employee_id: newTarget.employee_id,
        target_type: newTarget.target_type,
        target_value: parseInt(newTarget.target_value),
        month: newTarget.month,
        created_by: user?.id,
      });

      if (error) throw error;

      toast({
        title: "تم بنجاح",
        description: "تم إضافة التارجت",
      });

      setShowAddDialog(false);
      setNewTarget({
        employee_id: "",
        target_type: "calls",
        target_value: "",
        month: format(startOfMonth(new Date()), "yyyy-MM-dd"),
      });
      fetchData();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "فشل في إضافة التارجت",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateProgress = async (targetId: string, newValue: number) => {
    try {
      const target = targets.find((t) => t.id === targetId);
      if (!target) return;

      const status: TargetStatus = newValue >= target.target_value ? "completed" : "active";

      const { error } = await supabase
        .from("employee_targets")
        .update({ current_value: newValue, status })
        .eq("id", targetId);

      if (error) throw error;

      toast({
        title: "تم بنجاح",
        description: "تم تحديث التقدم",
      });
      fetchData();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: "فشل في تحديث التقدم",
        variant: "destructive",
      });
    }
  };

  const filteredTargets = targets.filter((target) =>
    target.employee_profile?.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    target.employee_profile?.last_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeTargets = targets.filter((t) => t.status === "active");
  const completedTargets = targets.filter((t) => t.status === "completed");

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">تارجت الموظفين</h1>
            <p className="text-muted-foreground">تحديد ومتابعة أهداف كل موظف</p>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="ml-2 h-4 w-4" />
                إضافة تارجت
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إضافة تارجت جديد</DialogTitle>
                <DialogDescription>حدد الهدف المطلوب من الموظف</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>الموظف *</Label>
                  <Select
                    value={newTarget.employee_id}
                    onValueChange={(value) => setNewTarget({ ...newTarget, employee_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الموظف" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((emp) => (
                        <SelectItem key={emp.user_id} value={emp.user_id}>
                          {emp.first_name} {emp.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>نوع التارجت *</Label>
                  <Select
                    value={newTarget.target_type}
                    onValueChange={(value: TargetType) => setNewTarget({ ...newTarget, target_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(targetTypeConfig).map(([value, { label }]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>القيمة المستهدفة *</Label>
                  <Input
                    type="number"
                    value={newTarget.target_value}
                    onChange={(e) => setNewTarget({ ...newTarget, target_value: e.target.value })}
                    placeholder="100"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label>الشهر</Label>
                  <Input
                    type="month"
                    value={newTarget.month.substring(0, 7)}
                    onChange={(e) => setNewTarget({ ...newTarget, month: e.target.value + "-01" })}
                    dir="ltr"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>إلغاء</Button>
                <Button onClick={handleAddTarget} disabled={submitting}>
                  {submitting ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : null}
                  إضافة التارجت
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي التارجتات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{targets.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">نشطة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{activeTargets.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">مكتملة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{completedTargets.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">نسبة الإنجاز</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {targets.length > 0 ? Math.round((completedTargets.length / targets.length) * 100) : 0}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث بالاسم..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Targets Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              قائمة التارجتات
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
                    <TableHead>الموظف</TableHead>
                    <TableHead>نوع التارجت</TableHead>
                    <TableHead>المستهدف</TableHead>
                    <TableHead>الإنجاز</TableHead>
                    <TableHead>التقدم</TableHead>
                    <TableHead>الشهر</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>تحديث</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTargets.map((target) => {
                    const progress = Math.min((target.current_value / target.target_value) * 100, 100);
                    const config = targetTypeConfig[target.target_type];
                    
                    return (
                      <TableRow key={target.id}>
                        <TableCell className="font-medium">
                          {target.employee_profile?.first_name} {target.employee_profile?.last_name}
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center gap-2">
                            {config.icon}
                            {config.label}
                          </span>
                        </TableCell>
                        <TableCell>
                          {target.target_value.toLocaleString()} {config.unit}
                        </TableCell>
                        <TableCell>
                          {target.current_value.toLocaleString()} {config.unit}
                        </TableCell>
                        <TableCell className="w-40">
                          <div className="space-y-1">
                            <Progress value={progress} className="h-2" />
                            <span className="text-xs text-muted-foreground">{Math.round(progress)}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {format(new Date(target.month), "MMMM yyyy", { locale: ar })}
                        </TableCell>
                        <TableCell>
                          <Badge className={`${statusConfig[target.status].color} text-white`}>
                            {statusConfig[target.status].label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            className="w-24"
                            value={target.current_value}
                            onChange={(e) => handleUpdateProgress(target.id, parseInt(e.target.value) || 0)}
                            dir="ltr"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default EmployeeTargets;
