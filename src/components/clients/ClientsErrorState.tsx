import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ClientsErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ClientsErrorState({ message, onRetry }: ClientsErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="h-8 w-8 text-destructive" />
      </div>
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">حدث خطأ في تحميل البيانات</h3>
        <p className="text-sm text-muted-foreground max-w-md">{message}</p>
      </div>
      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          إعادة المحاولة
        </Button>
      )}
    </div>
  );
}
