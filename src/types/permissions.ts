// Permission Types

export type PermissionCategory = 
  | "dashboard"
  | "clients"
  | "employees"
  | "commissions"
  | "calendar"
  | "hr"
  | "reports"
  | "settings"
  | "admin"
  | "chat";

export interface Permission {
  id: string;
  name: string;
  description: string;
  category: PermissionCategory;
}

export interface UserPermission {
  id: string;
  user_id: string;
  permission: string;
  category: PermissionCategory;
  granted_by: string | null;
  created_at: string;
}

// All available permissions in the system
export const ALL_PERMISSIONS: Permission[] = [
  // Dashboard
  { id: "view_dashboard", name: "عرض لوحة التحكم", description: "الوصول للوحة التحكم الرئيسية", category: "dashboard" },
  
  // Clients
  { id: "view_clients", name: "عرض العملاء", description: "مشاهدة قائمة العملاء", category: "clients" },
  { id: "create_clients", name: "إضافة عميل", description: "إنشاء عملاء جدد", category: "clients" },
  { id: "edit_clients", name: "تعديل العملاء", description: "تعديل بيانات العملاء", category: "clients" },
  { id: "delete_clients", name: "حذف العملاء", description: "حذف العملاء من النظام", category: "clients" },
  
  // Employees
  { id: "view_employees", name: "عرض الموظفين", description: "مشاهدة قائمة الموظفين", category: "employees" },
  { id: "create_employees", name: "إضافة موظف", description: "إنشاء موظفين جدد", category: "employees" },
  { id: "edit_employees", name: "تعديل الموظفين", description: "تعديل بيانات الموظفين", category: "employees" },
  
  // Commissions
  { id: "view_commissions", name: "عرض العمولات", description: "مشاهدة العمولات", category: "commissions" },
  { id: "manage_commissions", name: "إدارة العمولات", description: "تعديل وإضافة العمولات", category: "commissions" },
  
  // Calendar
  { id: "view_calendar", name: "عرض التقويم", description: "مشاهدة التقويم المالي", category: "calendar" },
  { id: "manage_calendar", name: "إدارة التقويم", description: "إضافة وتعديل المواعيد", category: "calendar" },
  
  // HR
  { id: "view_hr", name: "عرض الموارد البشرية", description: "الوصول لقسم HR", category: "hr" },
  { id: "manage_attendance", name: "إدارة الحضور", description: "تسجيل ومراجعة الحضور", category: "hr" },
  { id: "manage_leaves", name: "إدارة الإجازات", description: "قبول ورفض طلبات الإجازة", category: "hr" },
  { id: "manage_payroll", name: "إدارة المرتبات", description: "إعداد وصرف المرتبات", category: "hr" },
  { id: "manage_penalties", name: "إدارة الجزاءات", description: "تطبيق الجزاءات والخصومات", category: "hr" },
  
  // Reports
  { id: "view_reports", name: "عرض التقارير", description: "مشاهدة التقارير", category: "reports" },
  { id: "export_reports", name: "تصدير التقارير", description: "تصدير التقارير PDF/Excel", category: "reports" },
  
  // Settings
  { id: "view_settings", name: "عرض الإعدادات", description: "مشاهدة الإعدادات", category: "settings" },
  { id: "manage_settings", name: "إدارة الإعدادات", description: "تعديل إعدادات النظام", category: "settings" },
  
  // Admin
  { id: "view_admin", name: "عرض الأدمن", description: "الوصول للوحة الأدمن", category: "admin" },
  { id: "manage_users", name: "إدارة المستخدمين", description: "إنشاء وتعديل المستخدمين", category: "admin" },
  { id: "manage_permissions", name: "إدارة الصلاحيات", description: "تعديل صلاحيات المستخدمين", category: "admin" },
  { id: "view_audit_logs", name: "عرض سجل التدقيق", description: "مراجعة سجل التغييرات", category: "admin" },
  { id: "manage_targets", name: "إدارة التارجت", description: "تحديد أهداف الموظفين", category: "admin" },
  
  // Chat
  { id: "view_chat", name: "عرض الشات", description: "الوصول للمحادثات", category: "chat" },
  { id: "send_messages", name: "إرسال رسائل", description: "إرسال رسائل للفريق", category: "chat" },
  { id: "view_team_chat", name: "عرض شات الفريق", description: "مراقبة محادثات الفريق", category: "chat" },
];

export const CATEGORY_LABELS: Record<PermissionCategory, string> = {
  dashboard: "لوحة التحكم",
  clients: "العملاء",
  employees: "الموظفين",
  commissions: "العمولات",
  calendar: "التقويم",
  hr: "الموارد البشرية",
  reports: "التقارير",
  settings: "الإعدادات",
  admin: "الإدارة",
  chat: "المحادثات",
};

// Map pages to required permissions
export const PAGE_PERMISSIONS: Record<string, string[]> = {
  "/": ["view_dashboard"],
  "/employees": ["view_employees"],
  "/clients": ["view_clients"],
  "/commissions": ["view_commissions"],
  "/calendar": ["view_calendar"],
  "/hr": ["view_hr"],
  "/hr/employees": ["view_hr"],
  "/hr/attendance": ["view_hr", "manage_attendance"],
  "/hr/leaves": ["view_hr", "manage_leaves"],
  "/hr/payroll": ["view_hr", "manage_payroll"],
  "/hr/penalties": ["view_hr", "manage_penalties"],
  "/hr/documents": ["view_hr"],
  "/chat": ["view_chat"],
  "/reports": ["view_reports"],
  "/settings": ["view_settings"],
  "/admin": ["view_admin"],
  "/admin/users": ["manage_users"],
  "/admin/calls": ["view_clients"],
  "/admin/targets": ["manage_targets"],
  "/admin/team-chat": ["view_team_chat"],
};
