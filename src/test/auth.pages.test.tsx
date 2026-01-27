import { fireEvent, screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "./render";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import ResetPassword from "@/pages/auth/ResetPassword";
import { supabase } from "@/integrations/supabase/client";

describe("Auth pages", () => {
  it("renders login and submits credentials", async () => {
    renderWithProviders(<Login />, { route: "/auth/login" });

    fireEvent.change(screen.getByLabelText("البريد الإلكتروني"), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByLabelText("كلمة المرور"), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: "تسجيل الدخول" }));

    await waitFor(() =>
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: "user@example.com",
        password: "password123",
      })
    );
  });

  it("renders register and submits form", async () => {
    renderWithProviders(<Register />, { route: "/auth/register" });

    fireEvent.change(screen.getByLabelText("الاسم الأول"), { target: { value: "Test" } });
    fireEvent.change(screen.getByLabelText("الاسم الأخير"), { target: { value: "User" } });
    fireEvent.change(screen.getByLabelText("البريد الإلكتروني"), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByLabelText("كلمة المرور"), { target: { value: "password123" } });
    fireEvent.change(screen.getByLabelText("تأكيد كلمة المرور"), { target: { value: "password123" } });

    fireEvent.click(screen.getByRole("button", { name: "إنشاء الحساب" }));

    await waitFor(() => expect(supabase.auth.signUp).toHaveBeenCalled());
  });

  it("renders forgot password and requests reset", async () => {
    renderWithProviders(<ForgotPassword />, { route: "/auth/forgot-password" });

    fireEvent.change(screen.getByLabelText("البريد الإلكتروني"), {
      target: { value: "user@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /إرسال رابط إعادة التعيين/i }));

    await waitFor(() =>
      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        "user@example.com",
        expect.any(Object)
      )
    );
  });

  it("renders reset password and submits update", async () => {
    renderWithProviders(<ResetPassword />, { route: "/auth/reset-password" });

    const newPasswordInput = await screen.findByLabelText("كلمة المرور الجديدة");
    fireEvent.change(newPasswordInput, { target: { value: "newpassword" } });
    fireEvent.change(screen.getByLabelText("تأكيد كلمة المرور"), {
      target: { value: "newpassword" },
    });

    fireEvent.click(screen.getByRole("button", { name: "إعادة تعيين كلمة المرور" }));

    await waitFor(() =>
      expect(supabase.auth.updateUser).toHaveBeenCalledWith({ password: "newpassword" })
    );
  });
});
