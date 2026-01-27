import { ErrorInfo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ErrorFallbackProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  onReset?: () => void;
}

export function ErrorFallback({ error, errorInfo, onReset }: ErrorFallbackProps) {
  const navigate = useNavigate();
  const isDev = import.meta.env.DEV;

  const handleReload = () => {
    if (onReset) {
      onReset();
    }
    window.location.reload();
  };

  const handleGoHome = () => {
    if (onReset) {
      onReset();
    }
    navigate("/");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-xl">عذراً، حدث خطأ ما</CardTitle>
              <CardDescription>
                حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {isDev && error && (
            <div className="rounded-lg bg-muted p-4">
              <p className="mb-2 font-mono text-sm font-semibold text-destructive">
                {error.name}: {error.message}
              </p>
              {error.stack && (
                <pre className="overflow-auto text-xs text-muted-foreground">
                  {error.stack}
                </pre>
              )}
            </div>
          )}

          {isDev && errorInfo && (
            <div className="rounded-lg bg-muted p-4">
              <p className="mb-2 text-sm font-semibold">Component Stack:</p>
              <pre className="overflow-auto text-xs text-muted-foreground">
                {errorInfo.componentStack}
              </pre>
            </div>
          )}

          {!isDev && (
            <p className="text-sm text-muted-foreground">
              تم تسجيل الخطأ وسيتم العمل على إصلاحه. إذا استمرت المشكلة، يرجى الاتصال بالدعم الفني.
            </p>
          )}
        </CardContent>

        <CardFooter className="flex gap-3">
          <Button onClick={handleReload} className="flex-1" variant="default">
            <RefreshCw className="ml-2 h-4 w-4" />
            إعادة تحميل الصفحة
          </Button>
          <Button onClick={handleGoHome} className="flex-1" variant="outline">
            <Home className="ml-2 h-4 w-4" />
            العودة للصفحة الرئيسية
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
