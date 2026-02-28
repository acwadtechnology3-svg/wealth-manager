import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShieldX, Home, ArrowRight } from "lucide-react";

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex justify-center">
          <div className="p-4 bg-destructive/10 rounded-full">
            <ShieldX className="h-16 w-16 text-destructive" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-foreground">غير مصرح</h1>
        <p className="text-muted-foreground">
          عذراً، ليس لديك الصلاحية للوصول إلى هذه الصفحة. تواصل مع المسؤول إذا كنت تعتقد أن هذا خطأ.
        </p>
        <div className="flex justify-center gap-4">
          <Button onClick={() => navigate(-1)} variant="outline">
            <ArrowRight className="ml-2 h-4 w-4" />
            العودة
          </Button>
          <Button onClick={() => navigate("/")}>
            <Home className="ml-2 h-4 w-4" />
            الصفحة الرئيسية
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
