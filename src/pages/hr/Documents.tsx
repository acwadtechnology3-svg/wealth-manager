import { useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  FileText,
  Search,
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
import { Skeleton } from "@/components/ui/skeleton";
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
import { documentsApi } from "@/api/documents";
import {
  useDocuments,
  useCreateDocument,
  useDeleteDocument,
} from "@/hooks/queries/useDocuments";
import { useEmployees } from "@/hooks/queries/useProfiles";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

const typeConfig = {
  contract: { label: "عقد عمل", icon: FileCheck, className: "bg-primary/10 text-primary" },
  id_card: { label: "بطاقة شخصية", icon: User, className: "bg-success/10 text-success" },
  certificate: { label: "شهادة", icon: FileText, className: "bg-secondary/10 text-secondary-foreground" },
  resume: { label: "سيرة ذاتية", icon: FileText, className: "bg-secondary/10 text-secondary-foreground" },
  other: { label: "أخرى", icon: File, className: "bg-muted text-muted-foreground" },
};

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  return value.split("T")[0];
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
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { user } = useAuth();
  const { data: employees = [] } = useEmployees();
  const {
    data: documents = [],
    isLoading,
    error,
    refetch,
  } = useDocuments();
  const createDocument = useCreateDocument();
  const deleteDocument = useDeleteDocument();

  const employeeNameById = useMemo(() => {
    return new Map(
      employees.map((employee) => [
        employee.user_id,
        employee.full_name || employee.email || employee.user_id,
      ])
    );
  }, [employees]);

  const filteredDocuments = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return documents.filter((doc) => {
      const title = doc.title?.toLowerCase() || "";
      const matchesSearch = !normalizedQuery || title.includes(normalizedQuery);
      const matchesType = typeFilter === "all" || doc.document_type === typeFilter;
      const matchesEmployee = employeeFilter === "all" || doc.employee_id === employeeFilter;
      return matchesSearch && matchesType && matchesEmployee;
    });
  }, [documents, employeeFilter, searchQuery, typeFilter]);

  // Check for expiring documents
  const today = new Date();
  const thirtyDaysLater = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  const expiringDocs = useMemo(() => {
    return documents.filter((doc) => {
      if (!doc.expiry_date) return false;
      const expiry = new Date(doc.expiry_date);
      return expiry <= thirtyDaysLater && expiry >= today;
    });
  }, [documents, thirtyDaysLater, today]);

  const counts = useMemo(() => {
    return {
      contract: documents.filter((d) => d.document_type === "contract").length,
      id_card: documents.filter((d) => d.document_type === "id_card").length,
      resume: documents.filter((d) => d.document_type === "resume").length,
      expiring: expiringDocs.length,
    };
  }, [documents, expiringDocs.length]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
  };

  const resetUploadForm = () => {
    setIsUploadDialogOpen(false);
    setSelectedEmployee("");
    setDocumentType("contract");
    setDocumentName("");
    setExpiryDate("");
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpload = async () => {
    if (!selectedEmployee || !documentName || !user?.id) return;

    setIsUploading(true);
    let uploadedPath: string | null = null;

    try {
      if (selectedFile) {
        const uploadResult = await documentsApi.uploadFile(selectedFile, selectedEmployee);
        uploadedPath = uploadResult.path;
      }

      await createDocument.mutateAsync({
        employee_id: selectedEmployee,
        document_type: documentType as keyof typeof typeConfig,
        title: documentName,
        description: undefined,
        uploaded_by: user.id,
        expiry_date: expiryDate || undefined,
        file_name: selectedFile?.name || documentName,
        file_size: selectedFile?.size,
        file_url: uploadedPath || undefined,
      });

      resetUploadForm();
    } catch (error) {
      if (selectedFile && uploadedPath) {
        await documentsApi.removeFile(uploadedPath);
      } else if (selectedFile && !uploadedPath) {
        toast({
          title: "خطأ",
          description: "فشل رفع الملف",
          variant: "destructive",
        });
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleOpen = async (url?: string | null) => {
    if (!url) {
      toast({
        title: "الملف غير متوفر",
        description: "لم يتم رفع ملف المستند بعد",
        variant: "destructive",
      });
      return;
    }

    try {
      const signedUrl = await documentsApi.createSignedUrl(url);
      window.open(signedUrl, "_blank");
    } catch (error) {
      toast({
        title: "خطأ",
        description: "تعذر فتح المستند",
        variant: "destructive",
      });
    }
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("هل أنت متأكد من حذف المستند؟")) return;
    deleteDocument.mutate(id);
  };

  const getEmployeeName = (employeeId: string) => {
    return employeeNameById.get(employeeId) || employeeId;
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div>
            <Skeleton className="h-8 w-56 mb-2" />
            <Skeleton className="h-4 w-72" />
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-xl border bg-card p-4 shadow-card">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-6 w-12" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-xl border bg-card shadow-card p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">حدث خطأ في تحميل المستندات</h3>
            <p className="text-sm text-muted-foreground">{error.message}</p>
          </div>
          <Button onClick={() => refetch()} variant="outline">
            إعادة المحاولة
          </Button>
        </div>
      </MainLayout>
    );
  }

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
          <Dialog open={isUploadDialogOpen} onOpenChange={(open) => (open ? setIsUploadDialogOpen(true) : resetUploadForm())}>
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
                        <SelectItem key={emp.user_id} value={emp.user_id}>
                          {emp.full_name || emp.email}
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
                      <SelectItem value="id_card">بطاقة شخصية</SelectItem>
                      <SelectItem value="certificate">شهادة</SelectItem>
                      <SelectItem value="resume">سيرة ذاتية</SelectItem>
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
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,image/jpeg,image/png"
                  />
                  <div
                    className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      اضغط لاختيار ملف أو اسحب الملف هنا
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PDF, DOC, DOCX, JPG, PNG (حد أقصى 10MB)
                    </p>
                  </div>
                  {selectedFile ? (
                    <p className="text-xs text-muted-foreground">
                      {selectedFile.name} ({Math.max(1, Math.ceil(selectedFile.size / 1024))} KB)
                    </p>
                  ) : null}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={resetUploadForm}>
                  إلغاء
                </Button>
                <Button
                  className="gradient-primary"
                  onClick={handleUpload}
                  disabled={!selectedEmployee || !documentName || !user?.id || isUploading || createDocument.isPending}
                >
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
                  {counts.contract}
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
                  {counts.id_card}
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
                  {counts.resume}
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
                <p className="text-2xl font-bold text-warning">{counts.expiring}</p>
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
                <SelectItem key={emp.user_id} value={emp.user_id}>
                  {emp.full_name || emp.email}
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
              <SelectItem value="id_card">بطاقة شخصية</SelectItem>
              <SelectItem value="certificate">شهادة</SelectItem>
              <SelectItem value="resume">سيرة ذاتية</SelectItem>
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
                const TypeIcon = typeConfig[doc.document_type].icon;
                const isExpiring = doc.expiry_date && new Date(doc.expiry_date) <= thirtyDaysLater;
                const employeeName = doc.profiles?.full_name || doc.profiles?.email || getEmployeeName(doc.employee_id);

                return (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", typeConfig[doc.document_type].className)}>
                          <TypeIcon className="h-5 w-5" />
                        </div>
                        <span className="font-medium">{doc.title}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {employeeName}
                    </TableCell>
                    <TableCell>
                      <Badge className={typeConfig[doc.document_type].className}>
                        {typeConfig[doc.document_type].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(doc.created_at)}</TableCell>
                    <TableCell>
                      {doc.expiry_date ? (
                        <span className={cn(
                          "font-medium",
                          isExpiring ? "text-warning" : "text-muted-foreground"
                        )}>
                          {isExpiring && <AlertTriangle className="inline h-4 w-4 ml-1" />}
                          {formatDate(doc.expiry_date)}
                        </span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost" onClick={() => handleOpen(doc.file_url)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleOpen(doc.file_url)}>
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(doc.id)}
                        >
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








