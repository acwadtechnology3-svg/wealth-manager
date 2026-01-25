/**
 * React Query hooks for audit log operations
 * Provides type-safe hooks with caching and error handling
 */

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { auditLogApi, type AuditLogFilters } from '@/api/auditLog';
import type { AuditLog } from '@/types/database';
import { useAuth } from '@/hooks/useAuth';

/**
 * Hook to fetch list of audit logs with optional filters
 */
export function useAuditLogs(filters?: AuditLogFilters) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['auditLogs', filters],
    queryFn: () => auditLogApi.list(filters),
    enabled: !!user,
  });
}

/**
 * Hook to fetch recent audit logs
 */
export function useRecentAuditLogs(limit: number = 10) {
  const { user } = useAuth();

  return useQuery<AuditLog[]>({
    queryKey: queryKeys.auditLogs?.recent?.() || ['auditLogs', 'recent', limit],
    queryFn: () => auditLogApi.getRecent(limit),
    enabled: !!user,
  });
}

/**
 * Hook to fetch audit logs for a specific table
 */
export function useTableAuditLogs(tableName: string, limit?: number) {
  const { user } = useAuth();

  return useQuery<AuditLog[]>({
    queryKey: ['auditLogs', 'table', tableName, limit],
    queryFn: () => auditLogApi.getForTable(tableName, limit),
    enabled: !!user && !!tableName,
  });
}
