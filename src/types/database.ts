/**
 * Database type exports for easier use throughout the application
 * Re-exports Supabase generated types with convenient aliases
 */

import { Database } from '@/integrations/supabase/types';

// Helper types for accessing table types
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T];

// ============================================================================
// Core Entity Types
// ============================================================================

// Clients
export type Client = Tables<'clients'>;
export type ClientInsert = TablesInsert<'clients'>;
export type ClientUpdate = TablesUpdate<'clients'>;

// Client Deposits
export type ClientDeposit = Tables<'client_deposits'>;
export type ClientDepositInsert = TablesInsert<'client_deposits'>;
export type ClientDepositUpdate = TablesUpdate<'client_deposits'>;

// Withdrawal Schedules
export type WithdrawalSchedule = Tables<'withdrawal_schedules'>;
export type WithdrawalScheduleInsert = TablesInsert<'withdrawal_schedules'>;
export type WithdrawalScheduleUpdate = TablesUpdate<'withdrawal_schedules'>;

// Profiles
export type Profile = Tables<'profiles'>;
export type ProfileInsert = TablesInsert<'profiles'>;
export type ProfileUpdate = TablesUpdate<'profiles'>;

// User Roles
export type UserRole = Tables<'user_roles'>;
export type UserRoleInsert = TablesInsert<'user_roles'>;
export type UserRoleUpdate = TablesUpdate<'user_roles'>;

// User Permissions
export type UserPermission = Tables<'user_permissions'>;
export type UserPermissionInsert = TablesInsert<'user_permissions'>;
export type UserPermissionUpdate = TablesUpdate<'user_permissions'>;

// Team Messages
export type TeamMessage = Tables<'team_messages'>;
export type TeamMessageInsert = TablesInsert<'team_messages'>;
export type TeamMessageUpdate = TablesUpdate<'team_messages'>;

// Client Calls
export type ClientCall = Tables<'client_calls'>;
export type ClientCallInsert = TablesInsert<'client_calls'>;
export type ClientCallUpdate = TablesUpdate<'client_calls'>;

// Employee Targets
export type EmployeeTarget = Tables<'employee_targets'>;
export type EmployeeTargetInsert = TablesInsert<'employee_targets'>;
export type EmployeeTargetUpdate = TablesUpdate<'employee_targets'>;

// Audit Log
export type AuditLog = Tables<'audit_log'>;
export type AuditLogInsert = TablesInsert<'audit_log'>;
export type AuditLogUpdate = TablesUpdate<'audit_log'>;

// App Settings
export type AppSetting = Tables<'app_settings'>;
export type AppSettingInsert = TablesInsert<'app_settings'>;
export type AppSettingUpdate = TablesUpdate<'app_settings'>;

// User Settings
export type UserSettings = Tables<'user_settings'>;
export type UserSettingsInsert = TablesInsert<'user_settings'>;
export type UserSettingsUpdate = TablesUpdate<'user_settings'>;

// Meetings
export type Meeting = Tables<'meetings'>;
export type MeetingInsert = TablesInsert<'meetings'>;
export type MeetingUpdate = TablesUpdate<'meetings'>;

// Marketing Posters
export type MarketingPoster = Tables<'marketing_posters'>;
export type MarketingPosterInsert = TablesInsert<'marketing_posters'>;
export type MarketingPosterUpdate = TablesUpdate<'marketing_posters'>;

// Phone Number Batches
export type PhoneNumberBatch = Tables<'phone_number_batches'>;
export type PhoneNumberBatchInsert = TablesInsert<'phone_number_batches'>;
export type PhoneNumberBatchUpdate = TablesUpdate<'phone_number_batches'>;

// Phone Numbers
export type PhoneNumber = Tables<'phone_numbers'> & {
  task_type: TaskType;
  priority: TaskPriority;
  due_date: string | null;
  completed_at: string | null;
};
export type PhoneNumberInsert = TablesInsert<'phone_numbers'>;
export type PhoneNumberUpdate = TablesUpdate<'phone_numbers'>;

// ============================================================================
// Enum Types
// ============================================================================

export type AppRole = Enums<'app_role'>;
export type Department = Enums<'department'>;
export type PermissionCategory = Enums<'permission_category'>;

// Task management types
export type TaskType = 'call' | 'follow_up' | 'meeting' | 'other';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus =
  | 'pending'
  | 'in_progress'
  | 'called'
  | 'interested'
  | 'not_interested'
  | 'callback'
  | 'converted'
  | 'completed'
  | 'cancelled';

// ============================================================================
// Extended Types with Relations
// ============================================================================

/**
 * Client with related deposits
 */
export type ClientWithDeposits = Client & {
  client_deposits: ClientDeposit[];
};

/**
 * Client deposit with withdrawal schedules
 */
export type ClientDepositWithWithdrawals = ClientDeposit & {
  withdrawal_schedules: WithdrawalSchedule[];
};

/**
 * Client with full details including deposits and withdrawal schedules
 */
export type ClientFullDetails = Client & {
  client_deposits: ClientDepositWithWithdrawals[];
  assigned_employee?: Profile;
};

/**
 * Profile with user roles
 */
export type ProfileWithRoles = Profile & {
  user_roles: UserRole[];
};

/**
 * Profile with permissions
 */
export type ProfileWithPermissions = Profile & {
  user_permissions: UserPermission[];
};

/**
 * Employee target with profile information
 */
export type EmployeeTargetWithProfile = EmployeeTarget & {
  profile: Profile;
};

/**
 * Message with sender and recipient profiles
 */
export type TeamMessageWithProfiles = TeamMessage & {
  sender: Profile;
  recipient?: Profile;
};

/**
 * Meeting with profile information
 */
export type MeetingWithProfile = Meeting & {
  responsible_employee?: Profile;
  creator?: Profile;
};

/**
 * Marketing poster with uploader profile
 */
export type MarketingPosterWithProfile = MarketingPoster & {
  uploader?: Profile;
};

/**
 * Phone number batch with details
 */
export type PhoneNumberBatchWithDetails = PhoneNumberBatch & {
  uploader?: Profile;
  phone_numbers?: PhoneNumber[];
};

/**
 * Phone number with assignee profile
 */
export type PhoneNumberWithAssignee = PhoneNumber & {
  assignee?: Profile;
};

// Task management helpers
export interface TaskCalendarDay {
  date: string;
  tasks: PhoneNumber[];
  counts: {
    pending: number;
    inProgress: number;
    completed: number;
  };
}

export interface TaskStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  overdue: number;
  completedToday: number;
}

export interface AssignmentResult {
  assigned: number;
  perEmployee?: Record<string, number>;
}

export interface AssignmentOptions {
  dueDays?: number;
  priority?: TaskPriority;
}

// ============================================================================
// Filter Types
// ============================================================================

export interface ClientFilters {
  status?: string;
  assigned_to?: string;
  search?: string;
}

export interface DepositFilters {
  client_id?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
}

export interface WithdrawalFilters {
  status?: string;
  due_date_from?: string;
  due_date_to?: string;
}

export interface ProfileFilters {
  department?: string;
  is_active?: boolean;
  search?: string;
}

export interface TargetFilters {
  employee_id?: string;
  target_type?: string;
  month?: string;
  status?: string;
}

export interface CallFilters {
  called_by?: string;
  call_status?: string;
  date_from?: string;
  date_to?: string;
}

export interface AuditFilters {
  actor_user_id?: string;
  action?: string;
  target_table?: string;
  date_from?: string;
  date_to?: string;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number;
  pageSize: number;
}

/**
 * Sort parameters
 */
export interface SortParams {
  column: string;
  ascending: boolean;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
