import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, ArrowRight } from "lucide-react";
import fisLogo from "@/assets/fis-logo.jpg";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { toast } = useToast();

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;

      setEmailSent(true);
      toast({
        title: "تم إرسال البريد الإلكتروني",
        description: "تحقق من بريدك الإلكتروني لإعادة تعيين كلمة المرور",
      });
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "فشل في إرسال رابط إعادة التعيين",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <img src={fisLogo} alt="FiS Logo" className="h-16 w-16 rounded-full object-cover" />
          </div>
          <CardTitle className="text-2xl font-bold">نسيت كلمة المرور؟</CardTitle>
          <CardDescription>
            {emailSent
              ? "تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني"
              : "أدخل بريدك الإلكتروني وسنرسل لك رابط لإعادة تعيين كلمة المرور"}
          </CardDescription>
        </CardHeader>

        {!emailSent ? (
          <form onSubmit={handleResetRequest}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <div className="relative">
                  <Mail className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pr-10"
                    required
                    dir="ltr"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    جاري الإرسال...
                  </>
                ) : (
                  <>
                    إرسال رابط إعادة التعيين
                    <ArrowRight className="mr-2 h-4 w-4" />
                  </>
                )}
              </Button>
              <p className="text-sm text-muted-foreground text-center">
                تذكرت كلمة المرور؟{" "}
                <Link to="/auth/login" className="text-primary hover:underline">
                  تسجيل الدخول
                </Link>
              </p>
            </CardFooter>
          </form>
        ) : (
          <CardFooter className="flex flex-col gap-4">
            <div className="rounded-lg bg-success/10 border border-success/20 p-4 text-center">
              <p className="text-sm text-success">
                تم إرسال البريد الإلكتروني بنجاح. يرجى التحقق من صندوق الوارد الخاص بك.
              </p>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setEmailSent(false);
                setEmail("");
              }}
            >
              إرسال مرة أخرى
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              <Link to="/auth/login" className="text-primary hover:underline">
                العودة لتسجيل الدخول
              </Link>
            </p>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default ForgotPassword;
