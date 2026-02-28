/**
 * API functions for client deposits operations
 * Pure functions that interact with Supabase
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  ClientDeposit,
  ClientDepositInsert,
  ClientDepositUpdate,
  ClientDepositWithWithdrawals,
} from '@/types/database';
import { ApiError } from '@/lib/errors';

export interface DepositWithClient extends ClientDeposit {
  clients: {
    id: string;
    name: string;
    code: string;
    phone: string;
  } | null;
}

/**
 * List all deposits with optional filters
 */
export const depositsApi = {
  /**
   * List ALL deposits with client info — flat query (no nesting), returns every row
   */
  async listAllWithClients(): Promise<DepositWithClient[]> {
    try {
      const { data, error } = await supabase
        .from('client_deposits')
        .select('*, clients(id, name, code, phone)')
        .order('deposit_date', { ascending: false })
        .limit(5000);

      if (error) throw new ApiError(error.message, error.code, error.details);
      return (data || []) as DepositWithClient[];
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في تحميل بيانات الإيداعات', 'UNKNOWN_ERROR');
    }
  },

  async list(filters?: {
    clientId?: string;
    status?: string;
  }): Promise<ClientDeposit[]> {
    try {
      let query = supabase
        .from('client_deposits')
        .select('*')
        .order('deposit_date', { ascending: false });

      if (filters?.clientId) {
        query = query.eq('client_id', filters.clientId);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;

      if (error) throw new ApiError(error.message, error.code, error.details);
      return data || [];
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في تحميل بيانات الإيداعات', 'UNKNOWN_ERROR');
    }
  },

  /**
   * Get deposit by ID
   */
  async getById(id: string): Promise<ClientDeposit> {
    try {
      const { data, error } = await supabase
        .from('client_deposits')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw new ApiError(error.message, error.code, error.details);
      if (!data) throw new ApiError('الإيداع غير موجود', 'NOT_FOUND');

      return data;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في تحميل بيانات الإيداع', 'UNKNOWN_ERROR');
    }
  },

  /**
   * Get deposit with withdrawal schedules
   */
  async getByIdWithWithdrawals(id: string): Promise<ClientDepositWithWithdrawals> {
    try {
      const { data, error } = await supabase
        .from('client_deposits')
        .select('*, withdrawal_schedules(*)')
        .eq('id', id)
        .single();

      if (error) throw new ApiError(error.message, error.code, error.details);
      if (!data) throw new ApiError('الإيداع غير موجود', 'NOT_FOUND');

      return data as ClientDepositWithWithdrawals;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في تحميل بيانات الإيداع', 'UNKNOWN_ERROR');
    }
  },

  /**
   * Create new deposit
   */
  async create(deposit: ClientDepositInsert): Promise<ClientDeposit> {
    try {
      const { data, error } = await supabase
        .from('client_deposits')
        .insert(deposit)
        .select()
        .single();

      if (error) throw new ApiError(error.message, error.code, error.details);
      if (!data) throw new ApiError('فشل في إنشاء الإيداع', 'CREATE_FAILED');

      return data;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في إضافة الإيداع', 'UNKNOWN_ERROR');
    }
  },

  /**
   * Update deposit
   */
  async update(id: string, updates: ClientDepositUpdate): Promise<ClientDeposit> {
    try {
      const { data, error } = await supabase
        .from('client_deposits')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw new ApiError(error.message, error.code, error.details);
      if (!data) throw new ApiError('الإيداع غير موجود', 'NOT_FOUND');

      return data;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في تحديث الإيداع', 'UNKNOWN_ERROR');
    }
  },

  /**
   * Delete deposit
   */
  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('client_deposits')
        .delete()
        .eq('id', id);

      if (error) throw new ApiError(error.message, error.code, error.details);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في حذف الإيداع', 'UNKNOWN_ERROR');
    }
  },
};
