import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Phone, Plus, Search, Filter, Loader2, Clock, User } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

type CallStatus = "pending" | "interested" | "not_interested" | "callback" | "closed";

interface ClientCall {
  id: string;
  client_name: string;
  client_phone: string;
  call_notes: string | null;
  call_status: CallStatus;
  call_duration: number | null;
  called_by: string;
  created_at: string;
  caller_profile?: {
    first_name: string;
    last_name: string;
  };
}

const statusConfig: Record<CallStatus, { label: string; color: string }> = {
  pending: { label: "قيد المتابعة", color: "bg-yellow-500" },
  interested: { label: "مهتم", color: "bg-green-500" },
  not_interested: { label: "غير مهتم", color: "bg-red-500" },
  callback: { label: "إعادة الاتصال", color: "bg-blue-500" },
  closed: { label: "تم الإغلاق", color: "bg-gray-500" },
};

const ClientCalls = () => {
  const [calls, setCalls] = useState<ClientCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<CallStatus | "all">("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newCall, setNewCall] = useState({
    client_name: "",
    client_phone: "",
    call_notes: "",
    call_status: "pending" as CallStatus,
    call_duration: "",
  });
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    fetchCalls();
  }, []);

  const fetchCalls = async () => {
    try {
      const { data, error } = await supabase
        .from("client_calls")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch caller profiles
      const callerIds = [...new Set((data || []).map((c) => c.called_by))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, first_name, last_name")
        .in("user_id", callerIds);

      const callsWithProfiles = (data || []).map((call) => ({
        ...call,
        caller_profile: profiles?.find((p) => p.user_id === call.called_by),
      }));

      setCalls(callsWithProfiles as ClientCall[]);
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: "فشل في تحميل المكالمات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddCall = async () => {
    if (!newCall.client_name || !newCall.client_phone) {
      toast({
        title: "خطأ",
        description: "يرجى ملء اسم العميل ورقم الهاتف",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase.from("client_calls").insert({
        client_name: newCall.client_name.trim(),
        client_phone: newCall.client_phone.trim(),
        call_notes: newCall.call_notes.trim() || null,
        call_status: newCall.call_status,
        call_duration: newCall.call_duration ? parseInt(newCall.call_duration) : null,
        called_by: user?.id,
      });

      if (error) throw error;

      toast({
        title: "تم بنجاح",
        description: "تم تسجيل المكالمة",
      });

      setShowAddDialog(false);
      setNewCall({
        client_name: "",
        client_phone: "",
        call_notes: "",
        call_status: "pending",
        call_duration: "",
      });
      fetchCalls();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "فشل في تسجيل المكالمة",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (callId: string, newStatus: CallStatus) => {
    try {
      const { error } = await supabase
        .from("client_calls")
        .update({ call_status: newStatus })
        .eq("id", callId);

      if (error) throw error;

      toast({
        title: "تم بنجاح",
        description: "تم تحديث حالة المكالمة",
      });
      fetchCalls();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: "فشل في تحديث الحالة",
        variant: "destructive",
      });
    }
  };

  const filteredCalls = calls.filter((call) => {
    const matchesSearch =
      call.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      call.client_phone.includes(searchQuery);
    const matchesStatus = statusFilter === "all" || call.call_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const todayCalls = calls.filter(
    (c) => new Date(c.created_at).toDateString() === new Date().toDateString()
  );

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">مكالمات العملاء</h1>
            <p className="text-muted-foreground">سجل جميع مكالمات فريق المبيعات</p>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="ml-2 h-4 w-4" />
                تسجيل مكالمة
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>تسجيل مكالمة جديدة</DialogTitle>
                <DialogDescription>أدخل بيانات المكالمة مع العميل</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>اسم العميل *</Label>
                  <Input
                    value={newCall.client_name}
                    onChange={(e) => setNewCall({ ...newCall, client_name: e.target.value })}
                    placeholder="أحمد محمد"
                  />
                </div>
                <div className="space-y-2">
                  <Label>رقم الهاتف *</Label>
                  <Input
                    value={newCall.client_phone}
                    onChange={(e) => setNewCall({ ...newCall, client_phone: e.target.value })}
                    placeholder="01xxxxxxxxx"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label>حالة المكالمة</Label>
                  <Select
                    value={newCall.call_status}
                    onValueChange={(value: CallStatus) => setNewCall({ ...newCall, call_status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusConfig).map(([value, { label }]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>مدة المكالمة (بالثواني)</Label>
                  <Input
                    type="number"
                    value={newCall.call_duration}
                    onChange={(e) => setNewCall({ ...newCall, call_duration: e.target.value })}
                    placeholder="120"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label>ملاحظات</Label>
                  <Textarea
                    value={newCall.call_notes}
                    onChange={(e) => setNewCall({ ...newCall, call_notes: e.target.value })}
                    placeholder="تفاصيل المكالمة..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>إلغاء</Button>
                <Button onClick={handleAddCall} disabled={submitting}>
                  {submitting ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : null}
                  تسجيل المكالمة
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي المكالمات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{calls.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">مكالمات اليوم</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{todayCalls.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">مهتمين</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {calls.filter((c) => c.call_status === "interested").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">إعادة اتصال</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {calls.filter((c) => c.call_status === "callback").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">مغلقة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">
                {calls.filter((c) => c.call_status === "closed").length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث بالاسم أو الهاتف..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={(value: CallStatus | "all") => setStatusFilter(value)}>
                <SelectTrigger className="w-full md:w-48">
                  <Filter className="h-4 w-4 ml-2" />
                  <SelectValue placeholder="كل الحالات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الحالات</SelectItem>
                  {Object.entries(statusConfig).map(([value, { label }]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Calls Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              سجل المكالمات
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
                    <TableHead>العميل</TableHead>
                    <TableHead>رقم الهاتف</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>المدة</TableHead>
                    <TableHead>الموظف</TableHead>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>ملاحظات</TableHead>
                    {isAdmin() && <TableHead>تغيير الحالة</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCalls.map((call) => (
                    <TableRow key={call.id}>
                      <TableCell className="font-medium">{call.client_name}</TableCell>
                      <TableCell dir="ltr" className="text-left">{call.client_phone}</TableCell>
                      <TableCell>
                        <Badge className={`${statusConfig[call.call_status].color} text-white`}>
                          {statusConfig[call.call_status].label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {call.call_duration ? (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {Math.floor(call.call_duration / 60)}:{(call.call_duration % 60).toString().padStart(2, "0")}
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {call.caller_profile ? (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {call.caller_profile.first_name} {call.caller_profile.last_name}
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(call.created_at), "dd/MM/yyyy HH:mm", { locale: ar })}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{call.call_notes || "-"}</TableCell>
                      {isAdmin() && (
                        <TableCell>
                          <Select
                            value={call.call_status}
                            onValueChange={(value: CallStatus) => handleUpdateStatus(call.id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(statusConfig).map(([value, { label }]) => (
                                <SelectItem key={value} value={value}>{label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default ClientCalls;
