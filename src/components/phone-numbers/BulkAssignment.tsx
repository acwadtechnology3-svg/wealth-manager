import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import { useAssignPhoneNumbersRandom, useAssignPhoneNumbersTargeted } from "@/hooks/queries/usePhoneNumbers";
import { useEmployees } from "@/hooks/queries/useProfiles";
import type { PhoneNumber, Profile } from "@/types/database";

interface BulkAssignmentProps {
  batchId: string;
  phoneNumbers: PhoneNumber[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssignmentComplete?: () => void;
}

function formatDateInput(value: Date) {
  return value.toISOString().split("T")[0];
}

function computeDueDays(dateString: string) {
  if (!dateString) return undefined;
  const selected = new Date(dateString);
  selected.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.max(0, Math.ceil((selected.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
}

function normalizeName(value: string | null | undefined) {
  return (value || "").toLowerCase().replace(/\s+/g, " ").trim();
}

export function BulkAssignment({
  batchId,
  phoneNumbers,
  open,
  onOpenChange,
  onAssignmentComplete,
}: BulkAssignmentProps) {
  const { data: employees = [], isLoading: employeesLoading } = useEmployees();
  const assignRandom = useAssignPhoneNumbersRandom();
  const assignTargeted = useAssignPhoneNumbersTargeted();

  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [randomDueDate, setRandomDueDate] = useState(() =>
    formatDateInput(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
  );
  const [randomPriority, setRandomPriority] = useState<string>("medium");
  const [targetedDueDate, setTargetedDueDate] = useState(() =>
    formatDateInput(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
  );
  const [targetedPriority, setTargetedPriority] = useState<string>("medium");
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [resultMessage, setResultMessage] = useState<string>("");

  const employeeOptions = useMemo(() => {
    return employees.filter((employee) => employee.user_id) as Profile[];
  }, [employees]);

  const handleToggleEmployee = (id: string) => {
    setSelectedEmployeeIds((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]
    );
  };

  const handleAutoMatch = () => {
    const map = new Map<string, string>();
    employeeOptions.forEach((employee) => {
      map.set(normalizeName(employee.full_name || employee.email || ""), employee.user_id!);
    });

    const nextAssignments: Record<string, string> = { ...assignments };
    phoneNumbers.forEach((number) => {
      const key = normalizeName(number.assigned_employee_name || "");
      const matchId = map.get(key);
      if (matchId) {
        nextAssignments[number.id] = matchId;
      }
    });

    setAssignments(nextAssignments);
  };

  const handleAssignRandom = async () => {
    setResultMessage("");
    const dueDays = computeDueDays(randomDueDate);
    const result = await assignRandom.mutateAsync({
      batchId,
      employeeIds: selectedEmployeeIds,
      options: { dueDays, priority: randomPriority },
    });
    setResultMessage(`تم توزيع ${result.assigned} رقم على ${selectedEmployeeIds.length} موظفين`);
    onAssignmentComplete?.();
  };

  const handleAssignTargeted = async () => {
    setResultMessage("");
    const dueDays = computeDueDays(targetedDueDate);
    const assignmentList = Object.entries(assignments)
      .filter(([, employeeId]) => employeeId)
      .map(([phoneNumberId, employeeId]) => ({ phoneNumberId, employeeId }));

    const result = await assignTargeted.mutateAsync({
      batchId,
      assignments: assignmentList,
      options: { dueDays, priority: targetedPriority },
    });

    setResultMessage(`تم تعيين ${result.assigned} رقم بنجاح`);
    onAssignmentComplete?.();
  };

  const randomPreview = useMemo(() => {
    if (selectedEmployeeIds.length === 0) return "يرجى اختيار موظفين";
    const total = phoneNumbers.length;
    const perEmployee = Math.ceil(total / selectedEmployeeIds.length);
    return `${total} رقم سيتم توزيعه على ${selectedEmployeeIds.length} موظفين (~${perEmployee} لكل موظف)`;
  }, [phoneNumbers.length, selectedEmployeeIds.length]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>توزيع الأرقام</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="random">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="random">توزيع عشوائي</TabsTrigger>
            <TabsTrigger value="targeted">توزيع محدد</TabsTrigger>
          </TabsList>

          <TabsContent value="random" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="text-sm font-medium">اختيار الموظفين</div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      {selectedEmployeeIds.length > 0
                        ? `تم اختيار ${selectedEmployeeIds.length} موظف`
                        : "اختر الموظفين"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-2">
                    {employeesLoading ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="h-5 w-5 animate-spin" />
                      </div>
                    ) : (
                      <ScrollArea className="h-48">
                        <div className="space-y-2">
                          {employeeOptions.map((employee) => (
                            <label
                              key={employee.user_id}
                              className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 hover:bg-muted"
                            >
                              <Checkbox
                                checked={selectedEmployeeIds.includes(employee.user_id!)}
                                onCheckedChange={() => handleToggleEmployee(employee.user_id!)}
                              />
                              <span className="text-sm">
                                {employee.full_name || employee.email || "بدون اسم"}
                              </span>
                            </label>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">تاريخ الاستحقاق</div>
                <Input type="date" value={randomDueDate} onChange={(e) => setRandomDueDate(e.target.value)} />
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">الأولوية</div>
                <Select value={randomPriority} onValueChange={setRandomPriority}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الأولوية" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">منخفضة</SelectItem>
                    <SelectItem value="medium">متوسطة</SelectItem>
                    <SelectItem value="high">عالية</SelectItem>
                    <SelectItem value="urgent">عاجلة</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">معاينة التوزيع</div>
                <div className="rounded-md border border-dashed border-border/60 p-3 text-sm text-muted-foreground">
                  {randomPreview}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-muted-foreground">{resultMessage}</div>
              <Button
                onClick={handleAssignRandom}
                disabled={assignRandom.isLoading || selectedEmployeeIds.length === 0}
              >
                {assignRandom.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                تنفيذ التوزيع
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="targeted" className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm font-medium">توزيع مخصص حسب الاسم</div>
              <Button variant="outline" onClick={handleAutoMatch}>
                مطابقة تلقائية للأسماء
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="text-sm font-medium">تاريخ الاستحقاق</div>
                <Input
                  type="date"
                  value={targetedDueDate}
                  onChange={(e) => setTargetedDueDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">الأولوية</div>
                <Select value={targetedPriority} onValueChange={setTargetedPriority}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الأولوية" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">منخفضة</SelectItem>
                    <SelectItem value="medium">متوسطة</SelectItem>
                    <SelectItem value="high">عالية</SelectItem>
                    <SelectItem value="urgent">عاجلة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-lg border">
              <ScrollArea className="h-80">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم الهاتف</TableHead>
                      <TableHead>الموظف في الملف</TableHead>
                      <TableHead>تعيين الموظف</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {phoneNumbers.map((number) => {
                      const matched = !!assignments[number.id];
                      return (
                        <TableRow key={number.id}>
                          <TableCell className="font-medium">{number.phone_number}</TableCell>
                          <TableCell className={matched ? "" : "text-red-600"}>
                            {number.assigned_employee_name || "غير محدد"}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={assignments[number.id] || ""}
                              onValueChange={(value) =>
                                setAssignments((prev) => ({ ...prev, [number.id]: value }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="اختر موظف" />
                              </SelectTrigger>
                              <SelectContent>
                                {employeeOptions.map((employee) => (
                                  <SelectItem key={employee.user_id} value={employee.user_id!}>
                                    {employee.full_name || employee.email || "بدون اسم"}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-muted-foreground">{resultMessage}</div>
              <Button
                onClick={handleAssignTargeted}
                disabled={assignTargeted.isLoading || phoneNumbers.length === 0}
              >
                {assignTargeted.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                تنفيذ التعيين
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
