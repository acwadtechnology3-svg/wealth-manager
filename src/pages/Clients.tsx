import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  MoreHorizontal,
  UserCircle,
  TrendingUp,
  Clock,
  AlertTriangle,
  Edit,
  Trash2,
  Eye,
  Filter,
  ChevronLeft,
  ChevronRight,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { AddClientDialog } from "@/components/clients/AddClientDialog";
import { EditClientDialog } from "@/components/clients/EditClientDialog";
import { ClientsPageSkeleton } from "@/components/clients/ClientsPageSkeleton";
import { ClientsErrorState } from "@/components/clients/ClientsErrorState";
import { ClientsEmptyState } from "@/components/clients/ClientsEmptyState";
import { useClients, useClientStats, useDeleteClient } from "@/hooks/queries/useClients";
import { useAuth } from "@/hooks/useAuth";
import type { Client } from "@/api/clients";

const statusConfig = {
  active: {
    label: "نشط",
    className: "bg-success/10 text-success border-success/20",
    icon: TrendingUp,
  },
  late: {
    label: "متأخر",
    className: "bg-destructive/10 text-destructive border-destructive/20",
    icon: AlertTriangle,
  },
  suspended: {
    label: "موقوف",
    className: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    icon: AlertTriangle,
  },
  inactive: {
    label: "غير نشط",
    className: "bg-gray-500/10 text-gray-600 border-gray-500/20",
    icon: Clock,
  },
};

export default function Clients() {
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Debounce search to avoid refetch on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const [deleteClientId, setDeleteClientId] = useState<string | null>(null);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 25;

  const formatCreatedAt = (value?: string | null) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("ar-EG");
  };

  // Reset to page 1 when filters or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter]);

  // Prepare filters for the query (uses debounced search to avoid per-keystroke refetch)
  const filters = useMemo(() => {
    const f: { status?: string; assigned_to?: string; search?: string } = {};

    if (statusFilter !== "all") {
      f.status = statusFilter;
    }

    if (debouncedSearch) {
      f.search = debouncedSearch;
    }

    // Tele sales users can only see their assigned clients
    if (hasRole("tele_sales") && user) {
      f.assigned_to = user.id;
    }

    return f;
  }, [statusFilter, debouncedSearch, hasRole, user]);

  // Fetch clients and stats
  const { data: clients = [], isLoading, error, refetch } = useClients(filters);
  const { data: stats } = useClientStats();
  const deleteClientMutation = useDeleteClient();

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(clients.length / PAGE_SIZE));
  const paginatedClients = useMemo(
    () => clients.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [clients, currentPage, PAGE_SIZE]
  );

  // Calculate late clients count
  const lateClientsCount = stats?.late || 0;

  // Handle delete client
  const handleDeleteClient = () => {
    if (deleteClientId) {
      deleteClientMutation.mutate(deleteClientId, {
        onSuccess: () => {
          setDeleteClientId(null);
        },
      });
    }
  };

  // Clear filters
  const handleClearFilters = () => {
    setSearchQuery("");
    setDebouncedSearch("");
    setStatusFilter("all");
    setCurrentPage(1);
  };

  // Show loading state
  if (isLoading) {
    return (
      <MainLayout>
        <ClientsPageSkeleton />
      </MainLayout>
    );
  }

  // Show error state
  if (error) {
    return (
      <MainLayout>
        <ClientsErrorState
          message={error.message || "فشل في تحميل بيانات العملاء"}
          onRetry={refetch}
        />
      </MainLayout>
    );
  }

  const hasFilters = searchQuery !== "" || statusFilter !== "all";

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between animate-slide-right">
          <div>
            <h1 className="text-3xl font-bold text-foreground">العملاء</h1>
            <p className="text-muted-foreground mt-1">
              إدارة العملاء المستثمرين ومتابعة استثماراتهم
            </p>
          </div>
          <AddClientDialog />
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4 animate-slide-up">
          <div className="rounded-xl border bg-card p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <UserCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">إجمالي العملاء</p>
                <p className="text-2xl font-bold">{stats?.total || 0}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">العملاء النشطين</p>
                <p className="text-2xl font-bold">{stats?.active || 0}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10 text-warning">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">موقوف</p>
                <p className="text-2xl font-bold">{stats?.suspended || 0}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">متأخرين</p>
                <p className="text-2xl font-bold">{lateClientsCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Late Clients Alert */}
        {lateClientsCount > 0 && (
          <div className="flex items-center gap-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4 animate-fade-in">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <p className="flex-1 text-sm">
              يوجد <span className="font-bold">{lateClientsCount}</span> عملاء
              متأخرين عن موعد صرف الأرباح. يرجى المتابعة فوراً.
            </p>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setStatusFilter("late")}
            >
              عرض المتأخرين
            </Button>
          </div>
        )}

        {/* Search and Filters */}
        <div className="flex items-center gap-4 animate-fade-in">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="بحث بالاسم أو الكود أو الهاتف..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <Filter className="ml-2 h-4 w-4" />
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              <SelectItem value="active">نشط</SelectItem>
              <SelectItem value="late">متأخر</SelectItem>
              <SelectItem value="suspended">موقوف</SelectItem>
              <SelectItem value="inactive">غير نشط</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">تصدير</Button>
        </div>

        {/* Table or Empty State */}
        {clients.length === 0 ? (
          <ClientsEmptyState
            hasFilters={hasFilters}
            onClearFilters={handleClearFilters}
          />
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border bg-card shadow-card animate-slide-up">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">الكود</TableHead>
                    <TableHead className="text-right">العميل</TableHead>
                    <TableHead className="text-right">تاريخ الإنشاء</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedClients.map((client) => {
                    const StatusIcon =
                      statusConfig[client.status as keyof typeof statusConfig]?.icon || Clock;
                    return (
                      <TableRow
                        key={client.id}
                        className={cn(
                          "group cursor-pointer",
                          client.status === "late" && "bg-destructive/5"
                        )}
                        onClick={() => navigate(`/admin/client/${client.id}`)}
                      >
                        <TableCell className="font-mono text-sm">
                          {client.code}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{client.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {client.phone}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatCreatedAt(client.created_at)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={cn(
                              "font-medium",
                              statusConfig[client.status as keyof typeof statusConfig]
                                ?.className || "bg-gray-500/10 text-gray-600"
                            )}
                          >
                            <StatusIcon className="ml-1 h-3 w-3" />
                            {
                              statusConfig[client.status as keyof typeof statusConfig]
                                ?.label || client.status
                            }
                          </Badge>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              <DropdownMenuItem
                                onClick={() => navigate(`/admin/client/${client.id}`)}
                              >
                                <Eye className="ml-2 h-4 w-4" />
                                عرض التفاصيل
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditClient(client);
                                  setIsEditDialogOpen(true);
                                }}
                              >
                                <Edit className="ml-2 h-4 w-4" />
                                تعديل
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setDeleteClientId(client.id)}
                              >
                                <Trash2 className="ml-2 h-4 w-4" />
                                حذف
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-2">
                <p className="text-sm text-muted-foreground">
                  عرض {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, clients.length)} من {clients.length} عميل
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((page) =>
                      page === 1 ||
                      page === totalPages ||
                      Math.abs(page - currentPage) <= 2
                    )
                    .reduce<(number | "...")[]>((acc, page, idx, arr) => {
                      if (idx > 0 && page - (arr[idx - 1] as number) > 1) acc.push("...");
                      acc.push(page);
                      return acc;
                    }, [])
                    .map((item, idx) =>
                      item === "..." ? (
                        <span key={`dots-${idx}`} className="px-2 text-muted-foreground">…</span>
                      ) : (
                        <Button
                          key={item}
                          variant={currentPage === item ? "default" : "outline"}
                          size="icon"
                          onClick={() => setCurrentPage(item as number)}
                          className="w-9 h-9 text-sm"
                        >
                          {item}
                        </Button>
                      )
                    )}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={deleteClientId !== null}
          onOpenChange={(open) => !open && setDeleteClientId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
              <AlertDialogDescription>
                هل أنت متأكد من حذف هذا العميل؟ هذا الإجراء لا يمكن التراجع عنه.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteClient}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={deleteClientMutation.isPending}
              >
                {deleteClientMutation.isPending ? "جاري الحذف..." : "حذف"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Edit Client Dialog */}
        <EditClientDialog
          client={editClient}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
        />
      </div>
    </MainLayout>
  );
}

