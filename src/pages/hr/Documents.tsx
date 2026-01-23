import { useState } from "react";
import {
  FileText,
  Search,
  Plus,
  Download,
  Upload,
  Eye,
  Trash2,
  Calendar,
  AlertTriangle,
  File,
  FileCheck,
  User,
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { cn } from "@/lib/utils";
import { documents, employees } from "@/data/hrMockData";
import { toast } from "@/hooks/use-toast";

const typeConfig = {
  contract: { label: "عقد عمل", icon: FileCheck, className: "bg-primary/10 text-primary" },
  id: { label: "بطاقة شخصية", icon: User, className: "bg-success/10 text-success" },
  cv: { label: "سيرة ذاتية", icon: FileText, className: "bg-secondary/10 text-secondary-foreground" },
  other: { label: "أخرى", icon: File, className: "bg-muted text-muted-foreground" },
};

export default function Documents() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [employeeFilter, setEmployeeFilter] = useState<string>("all");
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);

  // Form states
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [documentType, setDocumentType] = useState<string>("contract");
  const [documentName, setDocumentName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.name.includes(searchQuery);
    const matchesType = typeFilter === "all" || doc.type === typeFilter;
    const matchesEmployee = employeeFilter === "all" || doc.employeeId === employeeFilter;
    return matchesSearch && matchesType && matchesEmployee;
  });

  // Check for expiring documents
  const today = new Date();
  const thirtyDaysLater = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  const expiringDocs = documents.filter((doc) => {
    if (!doc.expiryDate) return false;
    const expiry = new Date(doc.expiryDate);
    return expiry <= thirtyDaysLater && expiry >= today;
  });

  const handleUpload = () => {
    console.log({ selectedEmployee, documentType, documentName, expiryDate });
    toast({
      title: "تم الرفع",
      description: "تم رفع المستند بنجاح",
    });
    setIsUploadDialogOpen(false);
    setSelectedEmployee("");
    setDocumentType("contract");
    setDocumentName("");
    setExpiryDate("");
  };

  const getEmployeeName = (employeeId: string) => {
    return employees.find((e) => e.id === employeeId)?.name || employeeId;
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between animate-slide-right">
          <div>
            <h1 className="text-3xl font-bold text-foreground">العقود والمستندات</h1>
            <p className="text-muted-foreground mt-1">
              رفع وإدارة مستندات الموظفين
            </p>
          </div>
          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary">
                <Upload className="ml-2 h-4 w-4" />
                رفع مستند
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>رفع مستند جديد</DialogTitle>
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
                  <Label>نوع المستند</Label>
                  <Select value={documentType} onValueChange={setDocumentType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contract">عقد عمل</SelectItem>
                      <SelectItem value="id">بطاقة شخصية</SelectItem>
                      <SelectItem value="cv">سيرة ذاتية</SelectItem>
                      <SelectItem value="other">أخرى</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>اسم المستند</Label>
                  <Input
                    value={documentName}
                    onChange={(e) => setDocumentName(e.target.value)}
                    placeholder="مثال: عقد العمل 2024"
                  />
                </div>
                <div className="space-y-2">
                  <Label>تاريخ الانتهاء (اختياري)</Label>
                  <Input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>الملف</Label>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      اضغط لاختيار ملف أو اسحب الملف هنا
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PDF, DOC, DOCX, JPG, PNG (حد أقصى 10MB)
                    </p>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button className="gradient-primary" onClick={handleUpload}>
                  رفع المستند
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Expiring Documents Alert */}
        {expiringDocs.length > 0 && (
          <div className="flex items-center gap-4 rounded-xl border border-warning/30 bg-warning/5 p-4 animate-fade-in">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <p className="flex-1 text-sm">
              يوجد <span className="font-bold">{expiringDocs.length}</span> مستندات تنتهي خلال 30 يوم.
              يرجى المتابعة.
            </p>
            <Button variant="outline" size="sm" className="border-warning/30 text-warning hover:bg-warning/10">
              عرض المستندات
            </Button>
          </div>
        )}

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4 animate-slide-up">
          <div className="rounded-xl border bg-card p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">عقود العمل</p>
                <p className="text-2xl font-bold">
                  {documents.filter((d) => d.type === "contract").length}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success">
                <User className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">بطاقات شخصية</p>
                <p className="text-2xl font-bold">
                  {documents.filter((d) => d.type === "id").length}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10 text-secondary-foreground">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">السير الذاتية</p>
                <p className="text-2xl font-bold">
                  {documents.filter((d) => d.type === "cv").length}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10 text-warning">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">تنتهي قريباً</p>
                <p className="text-2xl font-bold text-warning">{expiringDocs.length}</p>
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
          <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="الموظف" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الموظفين</SelectItem>
              {employees.map((emp) => (
                <SelectItem key={emp.id} value={emp.id}>
                  {emp.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="النوع" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الأنواع</SelectItem>
              <SelectItem value="contract">عقد عمل</SelectItem>
              <SelectItem value="id">بطاقة شخصية</SelectItem>
              <SelectItem value="cv">سيرة ذاتية</SelectItem>
              <SelectItem value="other">أخرى</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-xl border bg-card shadow-card animate-slide-up">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">اسم المستند</TableHead>
                <TableHead className="text-right">الموظف</TableHead>
                <TableHead className="text-right">النوع</TableHead>
                <TableHead className="text-right">تاريخ الرفع</TableHead>
                <TableHead className="text-right">تاريخ الانتهاء</TableHead>
                <TableHead className="text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.map((doc) => {
                const TypeIcon = typeConfig[doc.type].icon;
                const isExpiring = doc.expiryDate && new Date(doc.expiryDate) <= thirtyDaysLater;
                
                return (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", typeConfig[doc.type].className)}>
                          <TypeIcon className="h-5 w-5" />
                        </div>
                        <span className="font-medium">{doc.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {getEmployeeName(doc.employeeId)}
                    </TableCell>
                    <TableCell>
                      <Badge className={typeConfig[doc.type].className}>
                        {typeConfig[doc.type].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{doc.uploadDate}</TableCell>
                    <TableCell>
                      {doc.expiryDate ? (
                        <span className={cn(
                          "font-medium",
                          isExpiring ? "text-warning" : "text-muted-foreground"
                        )}>
                          {isExpiring && <AlertTriangle className="inline h-4 w-4 ml-1" />}
                          {doc.expiryDate}
                        </span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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
