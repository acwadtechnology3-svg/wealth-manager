/**
 * API functions for client calls operations
 * Pure functions that interact with Supabase
 */

import { supabase } from '@/integrations/supabase/client';
import type { ClientCall, ClientCallInsert, ClientCallUpdate } from '@/types/database';
import { ApiError } from '@/lib/errors';

/**
 * Client calls API functions
 */
export const callsApi = {
  /**
   * List client calls with optional filters
   */
  async list(filters?: {
    calledBy?: string;
    callStatus?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }): Promise<ClientCall[]> {
    try {
      let query = supabase
        .from('client_calls')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.calledBy) {
        query = query.eq('called_by', filters.calledBy);
      }

      if (filters?.callStatus) {
        query = query.eq('call_status', filters.callStatus);
      }

      if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate);
      }

      if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate);
      }

      if (filters?.search) {
        query = query.or(
          `client_name.ilike.%${filters.search}%,client_phone.ilike.%${filters.search}%`
        );
      }

      const { data, error } = await query;

      if (error) throw new ApiError(error.message, error.code, error.details);
      return data || [];
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في تحميل بيانات المكالمات', 'UNKNOWN_ERROR');
    }
  },

  /**
   * Get call by ID
   */
  async getById(id: string): Promise<ClientCall> {
    try {
      const { data, error } = await supabase
        .from('client_calls')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw new ApiError(error.message, error.code, error.details);
      if (!data) throw new ApiError('المكالمة غير موجودة', 'NOT_FOUND');

      return data;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في تحميل بيانات المكالمة', 'UNKNOWN_ERROR');
    }
  },

  /**
   * Get calls by employee
   */
  async getByEmployee(employeeId: string): Promise<ClientCall[]> {
    try {
      const { data, error } = await supabase
        .from('client_calls')
        .select('*')
        .eq('called_by', employeeId)
        .order('created_at', { ascending: false });

      if (error) throw new ApiError(error.message, error.code, error.details);
      return data || [];
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في تحميل مكالمات الموظف', 'UNKNOWN_ERROR');
    }
  },

  /**
   * Get today's calls for an employee
   */
  async getTodayCalls(employeeId?: string): Promise<ClientCall[]> {
    try {
      const today = new Date().toISOString().split('T')[0];

      let query = supabase
        .from('client_calls')
        .select('*')
        .gte('created_at', today)
        .order('created_at', { ascending: false });

      if (employeeId) {
        query = query.eq('called_by', employeeId);
      }

      const { data, error } = await query;

      if (error) throw new ApiError(error.message, error.code, error.details);
      return data || [];
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في تحميل مكالمات اليوم', 'UNKNOWN_ERROR');
    }
  },

  /**
   * Create call record
   */
  async create(call: ClientCallInsert): Promise<ClientCall> {
    try {
      const { data, error } = await supabase
        .from('client_calls')
        .insert(call)
        .select()
        .single();

      if (error) throw new ApiError(error.message, error.code, error.details);
      if (!data) throw new ApiError('فشل في إنشاء سجل المكالمة', 'CREATE_FAILED');

      return data;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في إضافة المكالمة', 'UNKNOWN_ERROR');
    }
  },

  /**
   * Update call record
   */
  async update(id: string, updates: ClientCallUpdate): Promise<ClientCall> {
    try {
      const { data, error } = await supabase
        .from('client_calls')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw new ApiError(error.message, error.code, error.details);
      if (!data) throw new ApiError('المكالمة غير موجودة', 'NOT_FOUND');

      return data;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في تحديث المكالمة', 'UNKNOWN_ERROR');
    }
  },

  /**
   * Delete call record
   */
  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('client_calls')
        .delete()
        .eq('id', id);

      if (error) throw new ApiError(error.message, error.code, error.details);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في حذف المكالمة', 'UNKNOWN_ERROR');
    }
  },

  /**
   * Get call statistics
   */
  async getStats(employeeId?: string): Promise<{
    total: number;
    answered: number;
    noAnswer: number;
    callback: number;
    notInterested: number;
    totalDuration: number;
    averageDuration: number;
  }> {
    try {
      let query = supabase
        .from('client_calls')
        .select('call_status, call_duration');

      if (employeeId) {
        query = query.eq('called_by', employeeId);
      }

      const { data, error } = await query;

      if (error) throw new ApiError(error.message, error.code, error.details);

      const calls = data || [];
      const totalDuration = calls
        .filter(c => c.call_duration)
        .reduce((sum, c) => sum + (c.call_duration || 0), 0);

      return {
        total: calls.length,
        answered: calls.filter(c => c.call_status === 'answered').length,
        noAnswer: calls.filter(c => c.call_status === 'no_answer').length,
        callback: calls.filter(c => c.call_status === 'callback').length,
        notInterested: calls.filter(c => c.call_status === 'not_interested').length,
        totalDuration,
        averageDuration: calls.length > 0 ? totalDuration / calls.length : 0,
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في تحميل إحصائيات المكالمات', 'UNKNOWN_ERROR');
    }
  },

  /**
   * Get call statistics by date range
   */
  async getStatsByDateRange(
    startDate: string,
    endDate: string,
    employeeId?: string
  ): Promise<{
    totalCalls: number;
    successRate: number;
    callsByStatus: Record<string, number>;
    callsByDay: Array<{ date: string; count: number }>;
  }> {
    try {
      let query = supabase
        .from('client_calls')
        .select('call_status, created_at')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (employeeId) {
        query = query.eq('called_by', employeeId);
      }

      const { data, error } = await query;

      if (error) throw new ApiError(error.message, error.code, error.details);

      const calls = data || [];

      // Count by status
      const callsByStatus: Record<string, number> = {};
      calls.forEach(call => {
        callsByStatus[call.call_status] = (callsByStatus[call.call_status] || 0) + 1;
      });

      // Count by day
      const callsByDay: Record<string, number> = {};
      calls.forEach(call => {
        const date = call.created_at.split('T')[0];
        callsByDay[date] = (callsByDay[date] || 0) + 1;
      });

      const callsByDayArray = Object.entries(callsByDay).map(([date, count]) => ({
        date,
        count,
      }));

      const answered = callsByStatus['answered'] || 0;
      const successRate = calls.length > 0 ? (answered / calls.length) * 100 : 0;

      return {
        totalCalls: calls.length,
        successRate,
        callsByStatus,
        callsByDay: callsByDayArray,
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في تحميل إحصائيات المكالمات', 'UNKNOWN_ERROR');
    }
  },
};
