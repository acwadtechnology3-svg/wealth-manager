import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Upload, FileText, Loader2, Users } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import {
  usePhoneNumberBatches,
  useCreatePhoneNumberBatch,
  useDeletePhoneNumberBatch,
} from "@/hooks/queries/usePhoneNumbers";
import { useProfiles } from "@/hooks/queries/useProfiles";
import { parseWordFile } from "@/lib/wordParser";
import type { ParsedPhoneData } from "@/lib/wordParser";

export default function PhoneNumbers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedPhoneData | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [manualAssignments, setManualAssignments] = useState<Record<string, string>>({});

  const { data: batches = [], isLoading } = usePhoneNumberBatches();
  const { data: telesalesEmployees = [] } = useProfiles({ department: 'tele_sales', active: true });
  const createBatch = useCreatePhoneNumberBatch();
  const deleteBatch = useDeletePhoneNumberBatch();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.docx')) {
      toast({
        title: 'خطأ',
        description: 'يرجى اختيار ملف Word بصيغة .docx',
        variant: 'destructive',
      });
      return;
    }

    setSelectedFile(file);
    setIsParsing(true);

    try {
      const parsed = await parseWordFile(file);
      setParsedData(parsed);

      // Initialize manual assignments for cold calling
      if (parsed.assignmentMode === 'cold_calling') {
        const assignments: Record<string, string> = {};
        parsed.assignments.forEach((assignment, index) => {
          // Round-robin assignment by default
          const employeeIndex = index % telesalesEmployees.length;
          assignments[assignment.employeeName] = telesalesEmployees[employeeIndex]?.user_id || '';
        });
        setManualAssignments(assignments);
      }

      toast({
        title: 'تم بنجاح',
        description: `تم قراءة ${parsed.assignments.reduce((sum, a) => sum + a.phoneNumbers.length, 0)} رقم`,
      });
    } catch (error) {
      toast({
        title: 'خطأ',
        description: error instanceof Error ? error.message : 'فشل في قراءة الملف',
        variant: 'destructive',
      });
      setSelectedFile(null);
    } finally {
      setIsParsing(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !parsedData || !user) return;

    try {
      const phoneNumbers: Array<{
        phone_number: string;
        assigned_to: string;
        assigned_employee_name?: string;
      }> = [];

      for (const assignment of parsedData.assignments) {
        let assignedTo: string;

        if (parsedData.assignmentMode === 'targeted') {
          // Find employee by name
          const employee = telesalesEmployees.find(
            e => e.full_name?.includes(assignment.employeeName)
          );

          if (!employee) {
            toast({
              title: 'خطأ',
              description: `لم يتم العثور على الموظف: ${assignment.employeeName}`,
              variant: 'destructive',
            });
            return;
          }

          assignedTo = employee.user_id!;
        } else {
          // Cold calling - use manual assignment
          assignedTo = manualAssignments[assignment.employeeName];

          if (!assignedTo) {
            toast({
              title: 'خطأ',
              description: `يرجى تحديد موظف للمجموعة: ${assignment.employeeName}`,
              variant: 'destructive',
            });
            return;
          }
        }

        assignment.phoneNumbers.forEach(phone => {
          phoneNumbers.push({
            phone_number: phone,
            assigned_to: assignedTo,
            assigned_employee_name: assignment.employeeName,
          });
        });
      }

      await createBatch.mutateAsync({
        batch: {
          file_name: selectedFile.name,
          assignment_mode: parsedData.assignmentMode,
          uploaded_by: user.id,
          total_numbers: phoneNumbers.length,
        },
        phoneNumbers,
      });

      setIsUploadDialogOpen(false);
      setSelectedFile(null);
      setParsedData(null);
      setManualAssignments({});
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">إدارة أرقام الهواتف</h1>
            <p className="text-muted-foreground mt-1">رفع وتوزيع أرقام الهواتف على فريق المبيعات</p>
          </div>
          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="ml-2 h-4 w-4" />
                رفع ملف جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>رفع ملف أرقام الهواتف</DialogTitle>
                <DialogDescription>
                  اختر ملف Word (.docx) يحتوي على أرقام الهواتف
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="file">ملف Word</Label>
                  <Input
                    id="file"
                    type="file"
                    accept=".docx"
                    onChange={handleFileSelect}
                    disabled={isParsing}
                  />
                </div>

                {isParsing && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>جاري قراءة الملف...</span>
                  </div>
                )}

                {parsedData && (
                  <div className="space-y-4">
                    <div className="rounded-lg border p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4" />
                        <span className="font-medium">معلومات الملف</span>
                      </div>
                      <div className="text-sm space-y-1">
                        <p>نوع التوزيع: <Badge>{parsedData.assignmentMode === 'cold_calling' ? 'اتصال بارد' : 'موجه'}</Badge></p>
                        <p>عدد المجموعات: {parsedData.assignments.length}</p>
                        <p>إجمالي الأرقام: {parsedData.assignments.reduce((sum, a) => sum + a.phoneNumbers.length, 0)}</p>
                      </div>
                    </div>

                    {parsedData.assignmentMode === 'cold_calling' && (
                      <div className="space-y-3">
                        <Label>تحديد الموظفين للمجموعات</Label>
                        {parsedData.assignments.map((assignment, index) => (
                          <div key={index} className="grid grid-cols-2 gap-2">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{assignment.employeeName}</span>
                              <Badge variant="outline">{assignment.phoneNumbers.length} رقم</Badge>
                            </div>
                            <Select
                              value={manualAssignments[assignment.employeeName]}
                              onValueChange={(value) =>
                                setManualAssignments(prev => ({
                                  ...prev,
                                  [assignment.employeeName]: value,
                                }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="اختر الموظف" />
                              </SelectTrigger>
                              <SelectContent>
                                {telesalesEmployees.map(emp => (
                                  <SelectItem key={emp.user_id} value={emp.user_id!}>
                                    {emp.full_name} ({emp.employee_code})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setIsUploadDialogOpen(false);
                  setSelectedFile(null);
                  setParsedData(null);
                }}>
                  إلغاء
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={!parsedData || createBatch.isPending}
                >
                  {createBatch.isPending ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      جاري الرفع...
                    </>
                  ) : (
                    <>
                      <Upload className="ml-2 h-4 w-4" />
                      رفع
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Batches Table */}
        <Card>
          <CardHeader>
            <CardTitle>المجموعات المرفوعة</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : batches.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                لم يتم رفع أي مجموعات بعد
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>اسم الملف</TableHead>
                    <TableHead>نوع التوزيع</TableHead>
                    <TableHead>عدد الأرقام</TableHead>
                    <TableHead>رفع بواسطة</TableHead>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batches.map(batch => (
                    <TableRow key={batch.id}>
                      <TableCell className="font-medium">{batch.file_name}</TableCell>
                      <TableCell>
                        <Badge variant={batch.assignment_mode === 'cold_calling' ? 'default' : 'secondary'}>
                          {batch.assignment_mode === 'cold_calling' ? 'اتصال بارد' : 'موجه'}
                        </Badge>
                      </TableCell>
                      <TableCell>{batch.total_numbers}</TableCell>
                      <TableCell>{batch.uploader?.full_name}</TableCell>
                      <TableCell>{format(new Date(batch.created_at), 'PPp', { locale: ar })}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteBatch.mutate(batch.id)}
                        >
                          حذف
                        </Button>
                      </TableCell>
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
}
