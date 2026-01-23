// Admin Types

export type UserRole = "super_admin" | "admin" | "hr_manager" | "hr_officer" | "tele_sales" | "accountant" | "support";

export interface JobTitle {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  department: Department;
}

export type Department = "admin" | "hr" | "tele_sales" | "finance" | "support";

export interface Permission {
  id: string;
  name: string;
  description: string;
  category: PermissionCategory;
}

export type PermissionCategory = 
  | "clients" 
  | "employees" 
  | "reports" 
  | "commissions" 
  | "hr" 
  | "system" 
  | "chat";

export interface AuditLogEntry {
  id: string;
  entityType: "client" | "employee" | "transaction" | "system";
  entityId: string;
  action: "create" | "update" | "delete" | "view";
  field?: string;
  oldValue?: string;
  newValue?: string;
  performedBy: {
    id: string;
    name: string;
    role: string;
  };
  timestamp: string;
  reason?: string;
  ipAddress?: string;
}

export interface DataEntryLog {
  id: string;
  field: string;
  fieldLabel: string;
  value: string;
  enteredBy: {
    id: string;
    name: string;
    code: string;
  };
  timestamp: string;
}

export interface ClientFullProfile {
  // Basic Info
  id: string;
  code: string;
  name: string;
  phone: string;
  email?: string;
  nationalId?: string;
  status: "active" | "late" | "suspended" | "inactive";
  createdAt: string;
  
  // Financial Info
  deposits: ClientDeposit[];
  totalInvestment: number;
  profitRate: number;
  monthlyProfit: number;
  totalProfit: number;
  
  // Assigned Employee
  assignedEmployee: {
    id: string;
    code: string;
    name: string;
    department: string;
    commissionRate: number;
    phone: string;
  };
  
  // Logs
  dataEntryLogs: DataEntryLog[];
  auditHistory: AuditLogEntry[];
  
  // Attachments
  attachments: ClientAttachment[];
}

export interface ClientDeposit {
  id: string;
  depositNumber: string;
  amount: number;
  depositDate: string;
  profitRate: number;
  withdrawalDates: WithdrawalSchedule[];
}

export interface WithdrawalSchedule {
  id: string;
  dueDate: string;
  amount: number;
  status: "completed" | "upcoming" | "overdue";
  completedDate?: string;
}

export interface ClientAttachment {
  id: string;
  name: string;
  type: "contract" | "deposit_receipt" | "id_card" | "other";
  url: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface AdminNotification {
  id: string;
  type: "deposit_change" | "profit_change" | "new_user" | "permission_change" | "failed_login" | "employee_suspended";
  title: string;
  message: string;
  entityId?: string;
  isRead: boolean;
  createdAt: string;
}
