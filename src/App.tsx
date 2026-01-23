import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/employees" element={<Employees />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/commissions" element={<Commissions />} />
          <Route path="/calendar" element={<FinancialCalendar />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          {/* HR Routes */}
          <Route path="/hr" element={<HRDashboard />} />
          <Route path="/hr/employees" element={<HREmployees />} />
          <Route path="/hr/attendance" element={<Attendance />} />
          <Route path="/hr/leaves" element={<Leaves />} />
          <Route path="/hr/payroll" element={<Payroll />} />
          <Route path="/hr/penalties" element={<Penalties />} />
          <Route path="/hr/documents" element={<Documents />} />
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/client/:clientId" element={<ClientProfile />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
