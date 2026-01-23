import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
// Public Pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Auth Routes */}
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/register" element={<Register />} />
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
            <Route path="/admin/client/:clientId" element={<ProtectedRoute requireAdmin><ClientProfile /></ProtectedRoute>} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
