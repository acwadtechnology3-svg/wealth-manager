import { UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ClientsEmptyStateProps {
  hasFilters?: boolean;
  onClearFilters?: () => void;
  onAddClient?: () => void;
}

export function ClientsEmptyState({
  hasFilters,
  onClearFilters,
  onAddClient,
}: ClientsEmptyStateProps) {
  if (hasFilters) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <UserCircle className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold">لا توجد نتائج</h3>
          <p className="text-sm text-muted-foreground">
            لم يتم العثور على عملاء تطابق معايير البحث
          </p>
        </div>
        {onClearFilters && (
          <Button onClick={onClearFilters} variant="outline">
            مسح الفلاتر
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <UserCircle className="h-8 w-8 text-primary" />
      </div>
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">لا يوجد عملاء بعد</h3>
        <p className="text-sm text-muted-foreground">
          ابدأ بإضافة أول عميل لك
        </p>
      </div>
      {onAddClient && (
        <Button onClick={onAddClient}>
          إضافة عميل
        </Button>
      )}
    </div>
  );
}
