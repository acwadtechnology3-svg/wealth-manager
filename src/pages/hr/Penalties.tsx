import { useState } from "react";
import {
  AlertTriangle,
  Search,
  Plus,
  Download,
  Filter,
  AlertCircle,
  MinusCircle,
  FileText,
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { penalties, employees } from "@/data/hrMockData";
import { toast } from "@/hooks/use-toast";

const typeConfig = {
  warning: { 
    label: "إنذار", 
    className: "bg-warning/10 text-warning border-warning/20",
    icon: AlertCircle,
  },
  deduction: { 
    label: "خصم", 
    className: "bg-destructive/10 text-destructive border-destructive/20",
    icon: MinusCircle,
  },
  note: { 
    label: "ملاحظة", 
    className: "bg-secondary/10 text-secondary-foreground border-secondary/20",
    icon: FileText,
  },
};

export default function Penalties() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Form states
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [penaltyType, setPenaltyType] = useState<string>("warning");
  const [reason, setReason] = useState("");
  const [amount, setAmount] = useState("");

  const filteredPenalties = penalties.filter((penalty) => {
    const matchesSearch = penalty.employeeName.includes(searchQuery);
    const matchesType = typeFilter === "all" || penalty.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const warningCount = penalties.filter((p) => p.type === "warning").length;
  const deductionCount = penalties.filter((p) => p.type === "deduction").length;
  const noteCount = penalties.filter((p) => p.type === "note").length;
  const totalDeductions = penalties
    .filter((p) => p.type === "deduction")
    .reduce((acc, p) => acc + (p.amount || 0), 0);

  const handleSubmit = () => {
    console.log({ selectedEmployee, penaltyType, reason, amount });
    toast({
      title: "تم التسجيل",
      description: "تم تسجيل الجزاء/الملاحظة بنجاح",
    });
    setIsAddDialogOpen(false);
    setSelectedEmployee("");
    setPenaltyType("warning");
    setReason("");
    setAmount("");
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between animate-slide-right">
          <div>
            <h1 className="text-3xl font-bold text-foreground">الجزاءات والملاحظات</h1>
            <p className="text-muted-foreground mt-1">
              الإنذارات والخصومات والملاحظات الإدارية
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary">
                <Plus className="ml-2 h-4 w-4" />
                إضافة جزاء/ملاحظة
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>تسجيل جزاء أو ملاحظة</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>الموظف</Label>
                  <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الموظف" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>النوع</Label>
                  <Select value={penaltyType} onValueChange={setPenaltyType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="warning">إنذار</SelectItem>
                      <SelectItem value="deduction">خصم</SelectItem>
                      <SelectItem value="note">ملاحظة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {penaltyType === "deduction" && (
                  <div className="space-y-2">
                    <Label>مبلغ الخصم (ج.م)</Label>
                    <Input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>السبب</Label>
                  <Textarea
                    placeholder="اكتب السبب أو التفاصيل..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button className="gradient-primary" onClick={handleSubmit}>
                  تسجيل
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4 animate-slide-up">
          <div className="rounded-xl border bg-card p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10 text-warning">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">الإنذارات</p>
                <p className="text-2xl font-bold text-warning">{warningCount}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                <MinusCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">الخصومات</p>
                <p className="text-2xl font-bold text-destructive">{deductionCount}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10 text-secondary-foreground">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">الملاحظات</p>
                <p className="text-2xl font-bold">{noteCount}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الخصومات</p>
                <p className="text-2xl font-bold text-destructive">{totalDeductions} ج.م</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 animate-fade-in flex-wrap">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="بحث بالاسم..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-36">
              <Filter className="ml-2 h-4 w-4" />
              <SelectValue placeholder="النوع" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="warning">إنذار</SelectItem>
              <SelectItem value="deduction">خصم</SelectItem>
              <SelectItem value="note">ملاحظة</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="ml-2 h-4 w-4" />
            تصدير
          </Button>
        </div>

        {/* Table */}
        <div className="rounded-xl border bg-card shadow-card animate-slide-up">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">الموظف</TableHead>
                <TableHead className="text-right">النوع</TableHead>
                <TableHead className="text-right">التاريخ</TableHead>
                <TableHead className="text-right">السبب</TableHead>
                <TableHead className="text-right">المبلغ</TableHead>
                <TableHead className="text-right">بواسطة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPenalties.map((penalty) => {
                const TypeIcon = typeConfig[penalty.type].icon;
                return (
                  <TableRow key={penalty.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-primary/10 text-primary text-sm">
                            {penalty.employeeName.split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{penalty.employeeName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("font-medium", typeConfig[penalty.type].className)}>
                        <TypeIcon className="ml-1 h-3 w-3" />
                        {typeConfig[penalty.type].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{penalty.date}</TableCell>
                    <TableCell className="max-w-[300px]">
                      <p className="text-sm text-muted-foreground truncate">{penalty.reason}</p>
                    </TableCell>
                    <TableCell>
                      {penalty.amount ? (
                        <span className="text-destructive font-semibold">
                          -{penalty.amount} ج.م
                        </span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {penalty.issuedBy}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </MainLayout>
  );
}
