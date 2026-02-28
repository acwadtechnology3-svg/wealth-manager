import { useEffect, useMemo, useState } from "react";
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
  usePhoneNumbersByBatch,
} from "@/hooks/queries/usePhoneNumbers";
import { useProfiles } from "@/hooks/queries/useProfiles";
import { parseWordFile } from "@/lib/wordParser";
import type { ParsedPhoneData } from "@/lib/wordParser";
import { MyPhoneNumbers } from "@/components/phone-numbers/MyPhoneNumbers";

export default function PhoneNumbers() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedPhoneData | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [manualAssignments, setManualAssignments] = useState<Record<string, string>>({});
  const [assignmentPool, setAssignmentPool] = useState<"tele_sales" | "all">("tele_sales");
  const [assignmentStrategy, setAssignmentStrategy] = useState<"random" | "manual">("random");
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [isNumbersDialogOpen, setIsNumbersDialogOpen] = useState(false);

  const isAdminUser = isAdmin();
  const { data: batches = [], isLoading } = usePhoneNumberBatches({ enabled: isAdminUser });
  const { data: employees = [] } = useProfiles({ active: true }, { enabled: isAdminUser });
  const { data: batchNumbers = [], isLoading: isBatchNumbersLoading } = usePhoneNumbersByBatch(
    selectedBatchId ?? undefined
  );
  const createBatch = useCreatePhoneNumberBatch();
  const deleteBatch = useDeletePhoneNumberBatch();

  const teleSalesEmployees = useMemo(
    () => employees.filter((employee) => employee.department === "tele_sales"),
    [employees]
  );

  const assignmentEmployees = useMemo(() => {
    const pool = assignmentPool === "tele_sales" ? teleSalesEmployees : employees;
    return pool.filter((employee) => employee.user_id);
  }, [assignmentPool, employees, teleSalesEmployees]);

  const getEmployeeDisplayName = (employee: (typeof employees)[number]) => {
    const name =
      employee.full_name ||
      [employee.first_name, employee.last_name].filter(Boolean).join(" ").trim() ||
      employee.email;
    return employee.employee_code ? `${name} (${employee.employee_code})` : name;
  };

  const normalizeName = (value: string) =>
    value.toLowerCase().replace(/\s+/g, " ").trim();

  const selectedBatch = useMemo(
    () => batches.find((batch) => batch.id === selectedBatchId) || null,
    [batches, selectedBatchId]
  );

  const statusConfig: Record<string, { label: string; color: string }> = {
    pending: { label: "معلق", color: "bg-yellow-500" },
    called: { label: "تم الاتصال", color: "bg-blue-500" },
    interested: { label: "مهتم", color: "bg-green-500" },
    not_interested: { label: "غير مهتم", color: "bg-red-500" },
    callback: { label: "إعادة اتصال", color: "bg-purple-500" },
    converted: { label: "تم التحويل", color: "bg-success" },
    in_progress: { label: "جاري", color: "bg-orange-500" },
    completed: { label: "مكتمل", color: "bg-emerald-600" },
  };

  const openNumbersDialog = (batchId: string) => {
    setSelectedBatchId(batchId);
    setIsNumbersDialogOpen(true);
  };

  useEffect(() => {
    if (!parsedData || parsedData.assignmentMode !== "cold_calling") {
      setManualAssignments({});
      return;
    }

    if (assignmentStrategy !== "manual") {
      setManualAssignments({});
      return;
    }

    if (assignmentEmployees.length === 0) {
      setManualAssignments({});
      return;
    }

    const assignments: Record<string, string> = {};
    parsedData.assignments.forEach((assignment, index) => {
      const employeeIndex = index % assignmentEmployees.length;
      assignments[assignment.employeeName] = assignmentEmployees[employeeIndex]?.user_id || "";
    });
    setManualAssignments(assignments);
  }, [assignmentEmployees, assignmentStrategy, parsedData]);

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
      const availableEmployees = assignmentEmployees;
      const findEmployeeForTarget = (targetName: string) => {
        const normalizedTarget = normalizeName(targetName);
        if (!normalizedTarget) return null;

        return (
          availableEmployees.find((employee) => {
            const candidates = [
              employee.full_name,
              [employee.first_name, employee.last_name].filter(Boolean).join(" "),
              employee.email,
            ]
              .filter(Boolean)
              .map((name) => normalizeName(String(name)));

            return candidates.some((candidate) => candidate.includes(normalizedTarget));
          }) || null
        );
      };

      if (parsedData.assignmentMode === "cold_calling" && assignmentStrategy === "random") {
        if (availableEmployees.length === 0) {
          toast({
            title: "Error",
            description: "No active employees available for assignment.",
            variant: "destructive",
          });
          return;
        }

        let pointer = Math.floor(Math.random() * availableEmployees.length);
        const nextEmployee = () => {
          const employee = availableEmployees[pointer % availableEmployees.length];
          pointer += 1;
          return employee;
        };

        parsedData.assignments.forEach((assignment) => {
          assignment.phoneNumbers.forEach((phone) => {
            const employee = nextEmployee();
            if (!employee?.user_id) return;
            phoneNumbers.push({
              phone_number: phone,
              assigned_to: employee.user_id,
              assigned_employee_name: assignment.employeeName,
            });
          });
        });
      } else {
        for (const assignment of parsedData.assignments) {
          let assignedTo: string;

          if (parsedData.assignmentMode === "targeted") {
            if (availableEmployees.length === 0) {
              toast({
                title: "Error",
                description: "No active employees available for assignment.",
                variant: "destructive",
              });
              return;
            }

            const employee = findEmployeeForTarget(assignment.employeeName);

            if (!employee || !employee.user_id) {
              toast({
                title: "Error",
                description: `Employee not found: ${assignment.employeeName}`,
                variant: "destructive",
              });
              return;
            }

            assignedTo = employee.user_id;
          } else {
            // Cold calling - manual assignment
            assignedTo = manualAssignments[assignment.employeeName];

            if (!assignedTo) {
              toast({
                title: "Error",
                description: `Please select an employee for group: ${assignment.employeeName}`,
                variant: "destructive",
              });
              return;
            }
          }

          assignment.phoneNumbers.forEach((phone) => {
            phoneNumbers.push({
              phone_number: phone,
              assigned_to: assignedTo,
              assigned_employee_name: assignment.employeeName,
            });
          });
        }
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
      {isAdminUser ? (
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
                <div className="grid gap-2">
                  <Label>Assignment team</Label>
                  <Select
                    value={assignmentPool}
                    onValueChange={(value) => setAssignmentPool(value as "tele_sales" | "all")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tele_sales">Tele sales only</SelectItem>
                      <SelectItem value="all">All active employees</SelectItem>
                    </SelectContent>
                  </Select>
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

                                        {parsedData.assignmentMode === "cold_calling" && (
                      <div className="space-y-4">
                        <div className="grid gap-2">
                          <Label>Distribution method</Label>
                          <Select
                            value={assignmentStrategy}
                            onValueChange={(value) =>
                              setAssignmentStrategy(value as "random" | "manual")
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="random">Random distribution</SelectItem>
                              <SelectItem value="manual">Manual per group</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {assignmentStrategy === "manual" && (
                          <div className="space-y-3">
                            <Label>Group assignments</Label>
                            {assignmentEmployees.length === 0 ? (
                              <p className="text-sm text-muted-foreground">
                                No active employees found for the selected team.
                              </p>
                            ) : (
                              parsedData.assignments.map((assignment, index) => (
                                <div key={index} className="grid grid-cols-2 gap-2">
                                  <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">{assignment.employeeName}</span>
                                    <Badge variant="outline">{assignment.phoneNumbers.length} numbers</Badge>
                                  </div>
                                  <Select
                                    value={manualAssignments[assignment.employeeName]}
                                    onValueChange={(value) =>
                                      setManualAssignments((prev) => ({
                                        ...prev,
                                        [assignment.employeeName]: value,
                                      }))
                                    }
                                    disabled={assignmentEmployees.length === 0}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select employee" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {assignmentEmployees.map((employee) => (
                                        <SelectItem key={employee.user_id} value={employee.user_id!}>
                                          {getEmployeeDisplayName(employee)}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              ))
                            )}
                          </div>
                        )}
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

        <Dialog
          open={isNumbersDialogOpen}
          onOpenChange={(open) => {
            setIsNumbersDialogOpen(open);
            if (!open) {
              setSelectedBatchId(null);
            }
          }}
        >
          <DialogContent className="sm:max-w-[900px]">
            <DialogHeader>
              <DialogTitle>تفاصيل الأرقام</DialogTitle>
              <DialogDescription>
                {selectedBatch
                  ? `${selectedBatch.file_name} • ${selectedBatch.total_numbers} رقم`
                  : ""}
              </DialogDescription>
            </DialogHeader>
            {isBatchNumbersLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : batchNumbers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                لم يتم إضافة أي أرقام لهذه المجموعة
              </div>
            ) : (
              <div className="max-h-[60vh] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم الهاتف</TableHead>
                      <TableHead>الموظف</TableHead>
                      <TableHead>المجموعة</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>الملاحظات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {batchNumbers.map((number) => {
                      const statusKey = number.call_status || "pending";
                      const status = statusConfig[statusKey] || {
                        label: statusKey,
                        color: "bg-muted",
                      };
                      return (
                        <TableRow key={number.id}>
                          <TableCell className="font-medium">{number.phone_number}</TableCell>
                          <TableCell>
                            {number.assignee?.full_name || number.assignee?.email || "غير معين"}
                          </TableCell>
                          <TableCell>{number.assigned_employee_name || "-"}</TableCell>
                          <TableCell>
                            <Badge className={status.color}>{status.label}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {number.notes || "-"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </DialogContent>
        </Dialog>

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
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openNumbersDialog(batch.id)}
                          >
                            عرض الأرقام
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteBatch.mutate(batch.id)}
                          >
                            حذف
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
        </div>
      ) : (
        <MyPhoneNumbers />
      )}
    </MainLayout>
  );
}


