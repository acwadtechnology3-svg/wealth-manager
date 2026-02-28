/**
 * Type-safe query key factory for React Query
 * Provides consistent query keys across the application
 */

// Filter types for query keys
export interface ClientFilters {
  status?: string;
  assigned_to?: string;
  search?: string;
}

export interface ProfileFilters {
  role?: string;
  department?: string;
  active?: boolean;
  search?: string;
}

export interface MessageFilters {
  userId?: string;
  recipientId?: string;
  isGroupMessage?: boolean;
}

export interface AuditFilters {
  actorUserId?: string;
  action?: string;
  targetTable?: string;
  startDate?: string;
  endDate?: string;
}

export interface CallFilters {
  calledBy?: string;
  callStatus?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Query keys factory - ensures type safety and consistency
 * Usage: queryKeys.clients.list({ status: 'active' })
 */
export const queryKeys = {
  // Clients
  clients: {
    all: ['clients'] as const,
    lists: () => [...queryKeys.clients.all, 'list'] as const,
    list: (filters?: ClientFilters) => [...queryKeys.clients.lists(), filters ?? {}] as const,
    listWithDeposits: () => [...queryKeys.clients.all, 'list-with-deposits'] as const,
    details: () => [...queryKeys.clients.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.clients.details(), id] as const,
    deposits: (clientId: string) => [...queryKeys.clients.detail(clientId), 'deposits'] as const,
    stats: () => [...queryKeys.clients.all, 'stats'] as const,
  },

  // Deposits
  deposits: {
    all: ['deposits'] as const,
    lists: () => [...queryKeys.deposits.all, 'list'] as const,
    list: (filters?: { clientId?: string }) => [...queryKeys.deposits.lists(), filters ?? {}] as const,
    detail: (id: string) => [...queryKeys.deposits.all, 'detail', id] as const,
    byClient: (clientId: string) => [...queryKeys.deposits.all, 'client', clientId] as const,
    withdrawals: (depositId: string) => [...queryKeys.deposits.all, depositId, 'withdrawals'] as const,
  },

  // Withdrawal Schedules
  withdrawals: {
    all: ['withdrawals'] as const,
    lists: () => [...queryKeys.withdrawals.all, 'list'] as const,
    list: (filters?: { status?: string; dueDate?: string }) => [...queryKeys.withdrawals.lists(), filters ?? {}] as const,
    upcoming: () => [...queryKeys.withdrawals.all, 'upcoming'] as const,
    overdue: () => [...queryKeys.withdrawals.all, 'overdue'] as const,
  },

  // Employees/Profiles
  profiles: {
    all: ['profiles'] as const,
    lists: () => [...queryKeys.profiles.all, 'list'] as const,
    list: (filters?: ProfileFilters) => [...queryKeys.profiles.lists(), filters ?? {}] as const,
    detail: (userId: string) => [...queryKeys.profiles.all, 'detail', userId] as const,
    stats: () => [...queryKeys.profiles.all, 'stats'] as const,
  },

  // Team Messages (realtime)
  messages: {
    all: ['messages'] as const,
    lists: () => [...queryKeys.messages.all, 'list'] as const,
    list: (filters?: MessageFilters) => [...queryKeys.messages.lists(), filters ?? {}] as const,
    unread: (userId: string) => [...queryKeys.messages.all, 'unread', userId] as const,
    conversation: (userId1: string, userId2: string) =>
      [...queryKeys.messages.all, 'conversation', [userId1, userId2].sort()] as const,
  },

  // Employee Targets
  targets: {
    all: ['targets'] as const,
    lists: () => [...queryKeys.targets.all, 'list'] as const,
    list: (filters?: { employeeId?: string; month?: string }) =>
      [...queryKeys.targets.lists(), filters ?? {}] as const,
    byEmployee: (employeeId: string) => [...queryKeys.targets.all, 'employee', employeeId] as const,
    byMonth: (month: string) => [...queryKeys.targets.all, 'month', month] as const,
    current: (employeeId: string) => [...queryKeys.targets.byEmployee(employeeId), 'current'] as const,
  },

  // Audit Log
  auditLog: {
    all: ['audit-log'] as const,
    lists: () => [...queryKeys.auditLog.all, 'list'] as const,
    list: (filters?: AuditFilters) => [...queryKeys.auditLog.lists(), filters ?? {}] as const,
  },

  // Client Calls
  calls: {
    all: ['calls'] as const,
    lists: () => [...queryKeys.calls.all, 'list'] as const,
    list: (filters?: CallFilters) => [...queryKeys.calls.lists(), filters ?? {}] as const,
    byEmployee: (employeeId: string) => [...queryKeys.calls.all, 'employee', employeeId] as const,
    stats: (employeeId?: string) => [...queryKeys.calls.all, 'stats', employeeId ?? 'all'] as const,
  },

  // Commissions (to be implemented when table is created)
  commissions: {
    all: ['commissions'] as const,
    lists: () => [...queryKeys.commissions.all, 'list'] as const,
    list: (filters?: { employeeId?: string; month?: string; status?: string }) =>
      [...queryKeys.commissions.lists(), filters ?? {}] as const,
    byEmployee: (employeeId: string) => [...queryKeys.commissions.all, 'employee', employeeId] as const,
    stats: (month?: string) => [...queryKeys.commissions.all, 'stats', month ?? 'current'] as const,
  },

  // Dashboard statistics
  dashboard: {
    all: ['dashboard'] as const,
    stats: () => [...queryKeys.dashboard.all, 'stats'] as const,
    performanceChart: () => [...queryKeys.dashboard.all, 'performance'] as const,
    topEmployees: () => [...queryKeys.dashboard.all, 'top-employees'] as const,
    recentClients: () => [...queryKeys.dashboard.all, 'recent-clients'] as const,
    upcomingEvents: () => [...queryKeys.dashboard.all, 'upcoming-events'] as const,
  },

  // Meetings
  meetings: {
    all: ['meetings'] as const,
    lists: () => [...queryKeys.meetings.all, 'list'] as const,
    list: (filters?: { startDate?: string; endDate?: string; responsibleEmployeeId?: string }) =>
      [...queryKeys.meetings.lists(), filters ?? {}] as const,
    detail: (id: string) => [...queryKeys.meetings.all, 'detail', id] as const,
  },

  // Marketing Posters
  posters: {
    all: ['posters'] as const,
    lists: () => [...queryKeys.posters.all, 'list'] as const,
    list: (filters?: { startDate?: string; endDate?: string }) =>
      [...queryKeys.posters.lists(), filters ?? {}] as const,
    detail: (id: string) => [...queryKeys.posters.all, 'detail', id] as const,
  },

  // Phone Numbers
  phoneNumbers: {
    all: ['phone-numbers'] as const,
    batches: () => [...queryKeys.phoneNumbers.all, 'batches'] as const,
    byBatch: (batchId: string) => [...queryKeys.phoneNumbers.all, 'batch', batchId] as const,
    byEmployee: (employeeId: string) => [...queryKeys.phoneNumbers.all, 'employee', employeeId] as const,
    stats: (employeeId?: string) => [...queryKeys.phoneNumbers.all, 'stats', employeeId ?? 'all'] as const,
  },
} as const;
