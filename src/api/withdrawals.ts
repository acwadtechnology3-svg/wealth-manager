/**
 * API functions for withdrawal schedules operations
 * Pure functions that interact with Supabase
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  WithdrawalSchedule,
  WithdrawalScheduleInsert,
  WithdrawalScheduleUpdate,
} from '@/types/database';
import { ApiError } from '@/lib/errors';

/**
 * Withdrawal schedule with client information
 */
export interface WithdrawalWithClient extends WithdrawalSchedule {
  client_deposits?: {
    id: string;
    client_id: string;
    amount: number;
    profit_rate: number;
    deposit_number: string;
    deposit_date: string;
    status: string;
    clients?: {
      name: string;
      code: string;
      phone: string;
    };
  };
}

/**
 * Withdrawal schedules API functions
 */
export const withdrawalsApi = {
  /**
   * List withdrawal schedules with optional filters
   */
  async list(filters?: {
    status?: string;
    depositId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<WithdrawalSchedule[]> {
    try {
      let query = supabase
        .from('withdrawal_schedules')
        .select('*')
        .order('due_date', { ascending: true });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.depositId) {
        query = query.eq('deposit_id', filters.depositId);
      }

      if (filters?.startDate) {
        query = query.gte('due_date', filters.startDate);
      }

      if (filters?.endDate) {
        query = query.lte('due_date', filters.endDate);
      }

      const { data, error } = await query;

      if (error) throw new ApiError(error.message, error.code, error.details);
      return data || [];
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في تحميل مواعيد السحب', 'UNKNOWN_ERROR');
    }
  },

  /**
   * List withdrawal schedules with client information
   */
  async listWithClients(filters?: {
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<WithdrawalWithClient[]> {
    try {
      let query = supabase
        .from('withdrawal_schedules')
        .select(`
          *,
          client_deposits(
            id,
            client_id,
            amount,
            profit_rate,
            deposit_number,
            deposit_date,
            status,
            clients(
              name,
              code,
              phone
            )
          )
        `)
        .order('due_date', { ascending: true })
        .limit(5000);

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.startDate) {
        query = query.gte('due_date', filters.startDate);
      }

      if (filters?.endDate) {
        query = query.lte('due_date', filters.endDate);
      }

      const { data, error } = await query;

      if (error) throw new ApiError(error.message, error.code, error.details);
      return (data || []) as WithdrawalWithClient[];
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في تحميل مواعيد السحب مع بيانات العملاء', 'UNKNOWN_ERROR');
    }
  },

  /**
   * Get withdrawal schedule by ID
   */
  async getById(id: string): Promise<WithdrawalSchedule> {
    try {
      const { data, error } = await supabase
        .from('withdrawal_schedules')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw new ApiError(error.message, error.code, error.details);
      if (!data) throw new ApiError('موعد السحب غير موجود', 'NOT_FOUND');

      return data;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في تحميل بيانات موعد السحب', 'UNKNOWN_ERROR');
    }
  },

  /**
   * Get upcoming withdrawals (next 30 days)
   */
  async getUpcoming(limit: number = 50): Promise<WithdrawalWithClient[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      const futureDateStr = futureDate.toISOString().split('T')[0];

      return await this.listWithClients({
        status: 'upcoming',
        startDate: today,
        endDate: futureDateStr,
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في تحميل مواعيد السحب القادمة', 'UNKNOWN_ERROR');
    }
  },

  /**
   * Get overdue withdrawals
   */
  async getOverdue(): Promise<WithdrawalWithClient[]> {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('withdrawal_schedules')
        .select(`
          *,
          client_deposits!inner(
            client_id,
            clients!inner(
              name,
              code,
              phone
            )
          )
        `)
        .in('status', ['upcoming', 'overdue'])
        .lt('due_date', today)
        .order('due_date', { ascending: true });

      if (error) throw new ApiError(error.message, error.code, error.details);
      return (data || []) as WithdrawalWithClient[];
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في تحميل مواعيد السحب المتأخرة', 'UNKNOWN_ERROR');
    }
  },

  /**
   * Get withdrawals by deposit ID
   */
  async getByDepositId(depositId: string): Promise<WithdrawalSchedule[]> {
    try {
      const { data, error } = await supabase
        .from('withdrawal_schedules')
        .select('*')
        .eq('deposit_id', depositId)
        .order('due_date', { ascending: true });

      if (error) throw new ApiError(error.message, error.code, error.details);
      return data || [];
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في تحميل مواعيد السحب للإيداع', 'UNKNOWN_ERROR');
    }
  },

  /**
   * Create withdrawal schedule
   */
  async create(withdrawal: WithdrawalScheduleInsert): Promise<WithdrawalSchedule> {
    try {
      const { data, error } = await supabase
        .from('withdrawal_schedules')
        .insert(withdrawal)
        .select()
        .single();

      if (error) throw new ApiError(error.message, error.code, error.details);
      if (!data) throw new ApiError('فشل في إنشاء موعد السحب', 'CREATE_FAILED');

      return data;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في إضافة موعد السحب', 'UNKNOWN_ERROR');
    }
  },

  /**
   * Update withdrawal schedule
   */
  async update(id: string, updates: WithdrawalScheduleUpdate): Promise<WithdrawalSchedule> {
    try {
      const { data, error } = await supabase
        .from('withdrawal_schedules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw new ApiError(error.message, error.code, error.details);
      if (!data) throw new ApiError('موعد السحب غير موجود', 'NOT_FOUND');

      return data;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في تحديث موعد السحب', 'UNKNOWN_ERROR');
    }
  },

  /**
   * Mark withdrawal as completed
   */
  async markCompleted(id: string, paidDate?: string): Promise<WithdrawalSchedule> {
    try {
      const updates: WithdrawalScheduleUpdate = {
        status: 'completed',
        completed_date: paidDate || new Date().toISOString().split('T')[0],
      };

      return await this.update(id, updates);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في تحديث حالة السحب', 'UNKNOWN_ERROR');
    }
  },

  /**
   * Cancel withdrawal schedule by removing it
   */
  async markCancelled(id: string): Promise<void> {
    try {
      await this.delete(id);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في إلغاء موعد السحب', 'UNKNOWN_ERROR');
    }
  },

  /**
   * Delete withdrawal schedule
   */
  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('withdrawal_schedules')
        .delete()
        .eq('id', id);

      if (error) throw new ApiError(error.message, error.code, error.details);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في حذف موعد السحب', 'UNKNOWN_ERROR');
    }
  },

  /**
   * Get withdrawal statistics
   */
  async getStats(): Promise<{
    total: number;
    pending: number;
    completed: number;
    overdue: number;
    totalAmount: number;
    pendingAmount: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('withdrawal_schedules')
        .select('status, amount, due_date');

      if (error) throw new ApiError(error.message, error.code, error.details);

      const today = new Date().toISOString().split('T')[0];
      const schedules = data || [];

      return {
        total: schedules.length,
        pending: schedules.filter(w => w.status === 'upcoming').length,
        completed: schedules.filter(w => w.status === 'completed').length,
        overdue: schedules.filter(
          w => w.status === 'overdue' || (w.status === 'upcoming' && w.due_date < today)
        ).length,
        totalAmount: schedules.reduce((sum, w) => sum + w.amount, 0),
        pendingAmount: schedules
          .filter(w => w.status === 'upcoming')
          .reduce((sum, w) => sum + w.amount, 0),
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في تحميل إحصائيات السحب', 'UNKNOWN_ERROR');
    }
  },
};
