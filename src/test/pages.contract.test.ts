import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

const pageFiles = [
  "src/pages/Index.tsx",
  "src/pages/Employees.tsx",
  "src/pages/Clients.tsx",
  "src/pages/Commissions.tsx",
  "src/pages/FinancialCalendar.tsx",
  "src/pages/Chat.tsx",
  "src/pages/Reports.tsx",
  "src/pages/Settings.tsx",
  "src/pages/MyTasks.tsx",
  "src/pages/NotFound.tsx",
  "src/pages/Unauthorized.tsx",
  "src/pages/auth/Login.tsx",
  "src/pages/auth/Register.tsx",
  "src/pages/auth/ForgotPassword.tsx",
  "src/pages/auth/ResetPassword.tsx",
  "src/pages/hr/HRDashboard.tsx",
  "src/pages/hr/HREmployees.tsx",
  "src/pages/hr/Attendance.tsx",
  "src/pages/hr/Leaves.tsx",
  "src/pages/hr/Payroll.tsx",
  "src/pages/hr/Penalties.tsx",
  "src/pages/hr/Documents.tsx",
  "src/pages/admin/AdminDashboard.tsx",
  "src/pages/admin/ClientProfile.tsx",
  "src/pages/admin/UserManagement.tsx",
  "src/pages/admin/PermissionManagement.tsx",
  "src/pages/admin/ClientCalls.tsx",
  "src/pages/admin/EmployeeTargets.tsx",
  "src/pages/admin/TeamChat.tsx",
  "src/pages/admin/WorkSchedules.tsx",
  "src/pages/admin/PhoneNumbers.tsx",
  "src/pages/admin/PaymentMethods.tsx",
  "src/pages/admin/TaskManagement.tsx",
];

describe("Feature pages contract", () => {
  pageFiles.forEach((relativePath) => {
    it(`exists and exports a default component: ${relativePath}`, () => {
      const fullPath = resolve(process.cwd(), relativePath);
      expect(existsSync(fullPath)).toBe(true);
      const contents = readFileSync(fullPath, "utf-8");
      expect(contents).toMatch(/export\s+default/);
    });
  });
});
