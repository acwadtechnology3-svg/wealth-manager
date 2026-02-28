/**
 * Audit Log API - Handles audit log database operations
 * Provides pure functions that interact with Supabase
 */

import { supabase } from '@/integrations/supabase/client';
import type { AuditLog } from '@/types/database';
import { ApiError } from '@/lib/errors';

export interface AuditLogFilters {
  action?: string;
  targetTable?: string;
  actorUserId?: string;
  limit?: number;
  offset?: number;
}

export const auditLogApi = {
  /**
   * Fetch audit logs with optional filters
   */
  async list(filters?: AuditLogFilters): Promise<AuditLog[]> {
    try {
      let query = supabase
        .from('audit_log')
        .select(`
          *,
          profiles:actor_user_id (
            first_name,
            last_name,
            id
          )
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.action) {
        query = query.eq('action', filters.action);
      }

      if (filters?.targetTable) {
        query = query.eq('target_table', filters.targetTable);
      }

      if (filters?.actorUserId) {
        query = query.eq('actor_user_id', filters.actorUserId);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      if (filters?.offset) {
        query = query.range(filters.offset, (filters.offset + (filters.limit || 10)) - 1);
      }

      const { data, error } = await query;

      if (error) throw new ApiError(error);

      return data || [];
    } catch (error) {
      throw new ApiError(error);
    }
  },

  /**
   * Get recent audit logs (last 10)
   */
  async getRecent(limit: number = 10): Promise<AuditLog[]> {
    return this.list({ limit });
  },

  /**
   * Get audit logs for a specific table
   */
  async getForTable(tableName: string, limit?: number): Promise<AuditLog[]> {
    return this.list({ targetTable: tableName, limit });
  },

  /**
   * Create audit log entry
   */
  async create(log: Omit<AuditLog, 'id' | 'created_at'>): Promise<AuditLog> {
    try {
      const { data, error } = await supabase
        .from('audit_log')
        .insert([log])
        .select()
        .single();

      if (error) throw new ApiError(error);
      if (!data) throw new Error('Failed to create audit log');

      return data;
    } catch (error) {
      throw new ApiError(error);
    }
  },
};
