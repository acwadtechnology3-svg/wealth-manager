/**
 * API functions for employee commissions operations
 * Pure functions that interact with Supabase
 */

import { supabase } from '@/integrations/supabase/client';
import { ApiError } from '@/lib/errors';

/**
 * Employee commission record
 */
export interface EmployeeCommission {
  id: string;
  employee_id: string;
  period_month: number;
  period_year: number;
  total_clients: number;
  total_investments: number;
  commission_rate: number;
  commission_amount: number;
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
  approved_by: string | null;
  approved_at: string | null;
  paid_by: string | null;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Commission with employee profile information
 */
export interface CommissionWithProfile extends EmployeeCommission {
  profiles?: {
    full_name: string | null;
    email: string;
    employee_code: string | null;
    department: string | null;
  };
}

/**
 * Commission insert data
 */
export interface CommissionInsert {
  employee_id: string;
  period_month: number;
  period_year: number;
  total_clients?: number;
  total_investments?: number;
  commission_rate?: number;
  commission_amount?: number;
  status?: 'pending' | 'approved' | 'paid' | 'cancelled';
  notes?: string;
}

/**
 * Commission update data
 */
export interface CommissionUpdate {
  total_clients?: number;
  total_investments?: number;
  commission_rate?: number;
  commission_amount?: number;
  status?: 'pending' | 'approved' | 'paid' | 'cancelled';
  approved_by?: string;
  approved_at?: string;
  paid_by?: string;
  paid_at?: string;
  notes?: string;
}

/**
 * Commission statistics
 */
export interface CommissionStats {
  total_pending: number;
  total_approved: number;
  total_paid: number;
  total_pending_amount: number;
  total_approved_amount: number;
  total_paid_amount: number;
  count_pending: number;
  count_approved: number;
  count_paid: number;
}

/**
 * Employee commissions API functions
 */
export const commissionsApi = {
  /**
   * List commissions with optional filters
   */
  async list(filters?: {
    status?: string;
    employeeId?: string;
    periodMonth?: number;
    periodYear?: number;
  }): Promise<CommissionWithProfile[]> {
    try {
      let query = supabase
        .from('employee_commissions')
        .select(`
          *,
          profiles!employee_commissions_employee_id_fkey(
            full_name,
            email,
            employee_code,
            department
          )
        `)
        .order('period_year', { ascending: false })
        .order('period_month', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.employeeId) {
        query = query.eq('employee_id', filters.employeeId);
      }

      if (filters?.periodMonth) {
        query = query.eq('period_month', filters.periodMonth);
      }

      if (filters?.periodYear) {
        query = query.eq('period_year', filters.periodYear);
      }

      const { data, error } = await query;

      if (error) throw new ApiError(error.message, error.code, error.details);
      return (data || []) as CommissionWithProfile[];
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في تحميل العمولات', 'UNKNOWN_ERROR');
    }
  },

  /**
   * Get commission by ID
   */
  async getById(id: string): Promise<CommissionWithProfile> {
    try {
      const { data, error } = await supabase
        .from('employee_commissions')
        .select(`
          *,
          profiles!employee_commissions_employee_id_fkey(
            full_name,
            email,
            employee_code,
            department
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw new ApiError(error.message, error.code, error.details);
      if (!data) throw new ApiError('العمولة غير موجودة', 'NOT_FOUND');

      return data as CommissionWithProfile;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في تحميل بيانات العمولة', 'UNKNOWN_ERROR');
    }
  },

  /**
   * Get commissions for a specific employee
   */
  async getByEmployeeId(employeeId: string): Promise<CommissionWithProfile[]> {
    return this.list({ employeeId });
  },

  /**
   * Get commissions for a specific period
   */
  async getByPeriod(month: number, year: number): Promise<CommissionWithProfile[]> {
    return this.list({ periodMonth: month, periodYear: year });
  },

  /**
   * Create a new commission
   */
  async create(commission: CommissionInsert): Promise<EmployeeCommission> {
    try {
      const { data, error } = await supabase
        .from('employee_commissions')
        .insert(commission)
        .select()
        .single();

      if (error) throw new ApiError(error.message, error.code, error.details);
      if (!data) throw new ApiError('فشل في إنشاء العمولة', 'CREATE_FAILED');

      return data as EmployeeCommission;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في إنشاء العمولة', 'UNKNOWN_ERROR');
    }
  },

  /**
   * Update commission
   */
  async update(id: string, updates: CommissionUpdate): Promise<EmployeeCommission> {
    try {
      const { data, error } = await supabase
        .from('employee_commissions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw new ApiError(error.message, error.code, error.details);
      if (!data) throw new ApiError('العمولة غير موجودة', 'NOT_FOUND');

      return data as EmployeeCommission;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في تحديث العمولة', 'UNKNOWN_ERROR');
    }
  },

  /**
   * Approve commission
   */
  async approve(id: string, approvedBy: string): Promise<EmployeeCommission> {
    try {
      return await this.update(id, {
        status: 'approved',
        approved_by: approvedBy,
        approved_at: new Date().toISOString(),
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في اعتماد العمولة', 'UNKNOWN_ERROR');
    }
  },

  /**
   * Mark commission as paid
   */
  async markAsPaid(id: string, paidBy: string): Promise<EmployeeCommission> {
    try {
      return await this.update(id, {
        status: 'paid',
        paid_by: paidBy,
        paid_at: new Date().toISOString(),
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في تحديث حالة الدفع', 'UNKNOWN_ERROR');
    }
  },

  /**
   * Delete commission
   */
  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('employee_commissions')
        .delete()
        .eq('id', id);

      if (error) throw new ApiError(error.message, error.code, error.details);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في حذف العمولة', 'UNKNOWN_ERROR');
    }
  },

  /**
   * Get commission statistics
   */
  async getStats(): Promise<CommissionStats> {
    try {
      const { data, error } = await supabase
        .from('employee_commissions')
        .select('status, commission_amount');

      if (error) throw new ApiError(error.message, error.code, error.details);

      const stats: CommissionStats = {
        total_pending: 0,
        total_approved: 0,
        total_paid: 0,
        total_pending_amount: 0,
        total_approved_amount: 0,
        total_paid_amount: 0,
        count_pending: 0,
        count_approved: 0,
        count_paid: 0,
      };

      (data || []).forEach((item: any) => {
        if (item.status === 'pending') {
          stats.count_pending++;
          stats.total_pending_amount += Number(item.commission_amount) || 0;
        } else if (item.status === 'approved') {
          stats.count_approved++;
          stats.total_approved_amount += Number(item.commission_amount) || 0;
        } else if (item.status === 'paid') {
          stats.count_paid++;
          stats.total_paid_amount += Number(item.commission_amount) || 0;
        }
      });

      stats.total_pending = stats.total_pending_amount;
      stats.total_approved = stats.total_approved_amount;
      stats.total_paid = stats.total_paid_amount;

      return stats;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في تحميل إحصائيات العمولات', 'UNKNOWN_ERROR');
    }
  },

  /**
   * Calculate commission for an employee for a period
   * This calculates based on client deposits for the period
   */
  async calculateCommission(
    employeeId: string,
    month: number,
    year: number,
    commissionRate: number
  ): Promise<{
    total_clients: number;
    total_investments: number;
    commission_amount: number;
  }> {
    try {
      // Get start and end dates for the period
      const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];

      // Query client deposits for the employee in this period
      const { data: deposits, error } = await supabase
        .from('client_deposits')
        .select(`
          id,
          amount,
          deposit_date,
          clients!inner(
            id,
            assigned_to
          )
        `)
        .eq('clients.assigned_to', employeeId)
        .gte('deposit_date', startDate)
        .lte('deposit_date', endDate);

      if (error) throw new ApiError(error.message, error.code, error.details);

      // Calculate totals
      const total_clients = new Set((deposits || []).map((d: any) => d.clients.id)).size;
      const total_investments = (deposits || []).reduce(
        (sum: number, d: any) => sum + Number(d.amount),
        0
      );
      const commission_amount = (total_investments * commissionRate) / 100;

      return {
        total_clients,
        total_investments,
        commission_amount,
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في حساب العمولة', 'UNKNOWN_ERROR');
    }
  },
};
