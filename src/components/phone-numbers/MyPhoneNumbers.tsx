import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Phone, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  usePhoneNumbersByEmployee,
  useUpdatePhoneNumber,
  usePhoneNumberStats,
} from "@/hooks/queries/usePhoneNumbers";

export function MyPhoneNumbers() {
  const { user } = useAuth();
  const { data: phoneNumbers = [], isLoading } = usePhoneNumbersByEmployee(user?.id);
  const { data: stats } = usePhoneNumberStats(user?.id);
  const updateNumber = useUpdatePhoneNumber();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');

  const handleEdit = (number: any) => {
    setEditingId(number.id);
    setEditStatus(number.call_status);
    setEditNotes(number.notes || '');
  };

  const handleSave = async (id: string) => {
    await updateNumber.mutateAsync({
      id,
      updates: {
        call_status: editStatus,
        notes: editNotes,
        called_at: new Date().toISOString(),
      },
    });
    setEditingId(null);
  };

  const statusConfig: Record<string, { label: string; color: string }> = {
    pending: { label: 'معلق', color: 'bg-yellow-500' },
    called: { label: 'تم الاتصال', color: 'bg-blue-500' },
    interested: { label: 'مهتم', color: 'bg-green-500' },
    not_interested: { label: 'غير مهتم', color: 'bg-red-500' },
    callback: { label: 'إعادة اتصال', color: 'bg-purple-500' },
    converted: { label: 'تم التحويل', color: 'bg-success' },
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">إجمالي الأرقام</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">معلقة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">تم الاتصال</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.called}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">مهتمين</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.interested}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">تحويلات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{stats.converted}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Phone Numbers Table */}
      <Card>
        <CardHeader>
          <CardTitle>أرقامي</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : phoneNumbers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لم يتم تخصيص أي أرقام لك بعد
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم الهاتف</TableHead>
                  <TableHead>المجموعة</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الملاحظات</TableHead>
                  <TableHead>إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {phoneNumbers.map(number => (
                  <TableRow key={number.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {number.phone_number}
                      </div>
                    </TableCell>
                    <TableCell>{number.assigned_employee_name}</TableCell>
                    <TableCell>
                      {editingId === number.id ? (
                        <Select value={editStatus} onValueChange={setEditStatus}>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(statusConfig).map(([value, config]) => (
                              <SelectItem key={value} value={value}>
                                {config.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge className={statusConfig[number.call_status]?.color}>
                          {statusConfig[number.call_status]?.label}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === number.id ? (
                        <Textarea
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          className="min-h-[60px]"
                        />
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          {number.notes || '-'}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === number.id ? (
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleSave(number.id)}>
                            حفظ
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingId(null)}
                          >
                            إلغاء
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(number)}>
                          تعديل
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
