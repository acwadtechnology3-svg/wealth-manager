import { MoreHorizontal, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import type { Client } from "@/types/database";

const statusConfig = {
  active: { label: "نشط", variant: "default" as const, className: "bg-success/10 text-success border-success/20" },
  suspended: { label: "موقوف", variant: "secondary" as const, className: "bg-warning/10 text-warning border-warning/20" },
  late: { label: "متأخر", variant: "destructive" as const, className: "bg-destructive/10 text-destructive border-destructive/20" },
  inactive: { label: "غير نشط", variant: "secondary" as const, className: "bg-gray-500/10 text-gray-600 border-gray-500/20" },
};

interface RecentClientsProps {
  clients: Client[];
  isLoading?: boolean;
}

export function RecentClients({ clients, isLoading }: RecentClientsProps) {
  const navigate = useNavigate();
  return (
    <div className="rounded-xl border bg-card shadow-card animate-slide-up">
      <div className="flex items-center justify-between border-b p-6">
        <div>
          <h3 className="text-lg font-semibold">العملاء الجدد</h3>
          <p className="text-sm text-muted-foreground">
            آخر العملاء المضافين للنظام
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate('/admin/clients')}>
          عرض الكل
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-right">الكود</TableHead>
            <TableHead className="text-right">الاسم</TableHead>
            <TableHead className="text-right">البريد/الهاتف</TableHead>
            <TableHead className="text-right">تاريخ الإضافة</TableHead>
            <TableHead className="text-right">الحالة</TableHead>
            <TableHead className="w-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <>
              {[1, 2, 3, 4, 5].map((i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 rounded" /></TableCell>
                </TableRow>
              ))}
            </>
          ) : clients.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8">
                <div className="flex flex-col items-center gap-2">
                  <UserCircle className="h-12 w-12 text-muted-foreground" />
                  <p className="text-muted-foreground">لا يوجد عملاء حتى الآن</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            clients.map((client) => (
              <TableRow
                key={client.id}
                className="group cursor-pointer"
                onClick={() => navigate(`/admin/client/${client.id}`)}
              >
                <TableCell className="font-mono text-sm">{client.code}</TableCell>
                <TableCell className="font-medium">{client.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  <div className="text-sm">
                    {client.email || client.phone}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(client.created_at).toLocaleDateString('ar-EG', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={statusConfig[client.status as keyof typeof statusConfig]?.variant || "default"}
                    className={cn(
                      "font-medium",
                      statusConfig[client.status as keyof typeof statusConfig]?.className || ""
                    )}
                  >
                    {statusConfig[client.status as keyof typeof statusConfig]?.label || client.status}
                  </Badge>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => navigate(`/admin/client/${client.id}`)}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
