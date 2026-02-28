import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { PermissionsProvider } from "@/hooks/usePermissions";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { queryClient } from "@/lib/queryClient";
import { ErrorBoundary } from "@/components/ErrorBoundary";
// Public Pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import Unauthorized from "./pages/Unauthorized";
// Protected Pages
import Index from "./pages/Index";
import Employees from "./pages/Employees";
import Clients from "./pages/Clients";
import Commissions from "./pages/Commissions";
import FinancialCalendar from "./pages/FinancialCalendar";
import Chat from "./pages/Chat";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import MyTasks from "./pages/MyTasks";
// HR Pages
import HRDashboard from "./pages/hr/HRDashboard";
import HREmployees from "./pages/hr/HREmployees";
import Attendance from "./pages/hr/Attendance";
import Leaves from "./pages/hr/Leaves";
import Payroll from "./pages/hr/Payroll";
import Penalties from "./pages/hr/Penalties";
import Documents from "./pages/hr/Documents";
// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import ClientProfile from "./pages/admin/ClientProfile";
import UserManagement from "./pages/admin/UserManagement";
import PermissionManagement from "./pages/admin/PermissionManagement";
import ClientCalls from "./pages/admin/ClientCalls";
import EmployeeTargets from "./pages/admin/EmployeeTargets";
import TeamChat from "./pages/admin/TeamChat";
import WorkSchedules from "./pages/admin/WorkSchedules";
import PhoneNumbers from "./pages/admin/PhoneNumbers";
import PaymentMethods from "./pages/admin/PaymentMethods";
import TaskManagement from "./pages/admin/TaskManagement";

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <PermissionsProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
            {/* Auth Routes */}
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/register" element={<Register />} />
            <Route path="/auth/forgot-password" element={<ForgotPassword />} />
            <Route path="/auth/reset-password" element={<ResetPassword />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            
            {/* Protected Routes */}
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/employees" element={<ProtectedRoute><Employees /></ProtectedRoute>} />
            <Route path="/clients" element={<ProtectedRoute><Clients /></ProtectedRoute>} />
            <Route path="/commissions" element={<ProtectedRoute><Commissions /></ProtectedRoute>} />
            <Route path="/calendar" element={<ProtectedRoute><FinancialCalendar /></ProtectedRoute>} />
            <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/my-tasks" element={<ProtectedRoute><MyTasks /></ProtectedRoute>} />
            
            {/* HR Routes - Require HR Access */}
            <Route path="/hr" element={<ProtectedRoute requireHR><HRDashboard /></ProtectedRoute>} />
            <Route path="/hr/employees" element={<ProtectedRoute requireHR><HREmployees /></ProtectedRoute>} />
            <Route path="/hr/attendance" element={<ProtectedRoute requireHR><Attendance /></ProtectedRoute>} />
            <Route path="/hr/leaves" element={<ProtectedRoute requireHR><Leaves /></ProtectedRoute>} />
            <Route path="/hr/payroll" element={<ProtectedRoute requireHR><Payroll /></ProtectedRoute>} />
            <Route path="/hr/penalties" element={<ProtectedRoute requireHR><Penalties /></ProtectedRoute>} />
            <Route path="/hr/documents" element={<ProtectedRoute requireHR><Documents /></ProtectedRoute>} />
            
            {/* Admin Routes - Require Admin Access */}
            <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/client/:clientId" element={<ProtectedRoute><ClientProfile /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute requireAdmin><UserManagement /></ProtectedRoute>} />
            <Route path="/admin/permissions" element={<ProtectedRoute requireAdmin><PermissionManagement /></ProtectedRoute>} />
            <Route path="/admin/calls" element={<ProtectedRoute><ClientCalls /></ProtectedRoute>} />
            <Route path="/admin/targets" element={<ProtectedRoute requireAdmin><EmployeeTargets /></ProtectedRoute>} />
            <Route path="/admin/team-chat" element={<ProtectedRoute requireAdmin><TeamChat /></ProtectedRoute>} />
            <Route path="/admin/work-schedules" element={<ProtectedRoute requireAdmin><WorkSchedules /></ProtectedRoute>} />
            <Route
              path="/admin/phone-numbers"
              element={
                <ProtectedRoute requiredRoles={["super_admin", "admin", "tele_sales", "support"]}>
                  <PhoneNumbers />
                </ProtectedRoute>
              }
            />
            <Route path="/admin/payment-methods" element={<ProtectedRoute requireAdmin><PaymentMethods /></ProtectedRoute>} />
            <Route path="/admin/tasks" element={<ProtectedRoute requireAdmin><TaskManagement /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          </PermissionsProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
