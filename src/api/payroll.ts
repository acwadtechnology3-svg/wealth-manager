/**
 * API functions for payroll operations
 */

import { supabase } from '@/integrations/supabase/client';
import { ApiError } from '@/lib/errors';

export type PayrollStatus = 'draft' | 'approved' | 'paid';

export interface PayrollRecord {
  id: string;
  employee_id: string;
  period_month: number;
  period_year: number;
  base_salary: number;
  allowances: number;
  deductions: number;
  bonuses: number;
  commission: number;
  total_salary: number;
  status: PayrollStatus;
  processed_by: string | null;
  processed_at: string | null;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PayrollWithProfile extends PayrollRecord {
  profiles?: {
    full_name: string | null;
    email: string;
    employee_code: string | null;
    department: string | null;
  };
}

export interface PayrollInsert {
  employee_id: string;
  period_month: number;
  period_year: number;
  base_salary: number;
  allowances?: number;
  deductions?: number;
  bonuses?: number;
  commission?: number;
  notes?: string;
}

export interface PayrollUpdate {
  base_salary?: number;
  allowances?: number;
  deductions?: number;
  bonuses?: number;
  commission?: number;
  status?: PayrollStatus;
  processed_by?: string;
  processed_at?: string;
  paid_at?: string;
  notes?: string;
}

export const payrollApi = {
  async list(filters?: {
    employeeId?: string;
    periodMonth?: number;
    periodYear?: number;
    status?: PayrollStatus;
  }): Promise<PayrollWithProfile[]> {
    try {
      let query = supabase
        .from('payroll_records')
        .select(`
          *,
          profiles!payroll_records_employee_id_fkey(
            full_name,
            email,
            employee_code,
            department
          )
        `)
        .order('period_year', { ascending: false })
        .order('period_month', { ascending: false });

      if (filters?.employeeId) {
        query = query.eq('employee_id', filters.employeeId);
      }
      if (filters?.periodMonth) {
        query = query.eq('period_month', filters.periodMonth);
      }
      if (filters?.periodYear) {
        query = query.eq('period_year', filters.periodYear);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;
      if (error) throw new ApiError(error.message, error.code, error.details);
      return (data || []) as PayrollWithProfile[];
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في تحميل سجلات الرواتب', 'UNKNOWN_ERROR');
    }
  },

  async getById(id: string): Promise<PayrollWithProfile> {
    try {
      const { data, error } = await supabase
        .from('payroll_records')
        .select(`
          *,
          profiles!payroll_records_employee_id_fkey(
            full_name,
            email,
            employee_code,
            department
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw new ApiError(error.message, error.code, error.details);
      if (!data) throw new ApiError('السجل غير موجود', 'NOT_FOUND');
      return data as PayrollWithProfile;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في تحميل سجل الراتب', 'UNKNOWN_ERROR');
    }
  },

  async create(payroll: PayrollInsert): Promise<PayrollRecord> {
    try {
      // Calculate total salary
      const total_salary =
        payroll.base_salary +
        (payroll.allowances || 0) +
        (payroll.bonuses || 0) +
        (payroll.commission || 0) -
        (payroll.deductions || 0);

      const { data, error } = await supabase
        .from('payroll_records')
        .insert({ ...payroll, total_salary })
        .select()
        .single();

      if (error) throw new ApiError(error.message, error.code, error.details);
      if (!data) throw new ApiError('فشل في إنشاء سجل الراتب', 'CREATE_FAILED');
      return data as PayrollRecord;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في إنشاء سجل الراتب', 'UNKNOWN_ERROR');
    }
  },

  async update(id: string, updates: PayrollUpdate): Promise<PayrollRecord> {
    try {
      // If any salary components changed, recalculate total
      const { data: current } = await supabase
        .from('payroll_records')
        .select('base_salary, allowances, deductions, bonuses, commission')
        .eq('id', id)
        .single();

      if (current) {
        const base = updates.base_salary ?? current.base_salary;
        const allowances = updates.allowances ?? current.allowances;
        const deductions = updates.deductions ?? current.deductions;
        const bonuses = updates.bonuses ?? current.bonuses;
        const commission = updates.commission ?? current.commission;

        const total_salary = base + allowances + bonuses + commission - deductions;
        updates = { ...updates, total_salary };
      }

      const { data, error } = await supabase
        .from('payroll_records')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw new ApiError(error.message, error.code, error.details);
      if (!data) throw new ApiError('السجل غير موجود', 'NOT_FOUND');
      return data as PayrollRecord;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في تحديث سجل الراتب', 'UNKNOWN_ERROR');
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('payroll_records')
        .delete()
        .eq('id', id);

      if (error) throw new ApiError(error.message, error.code, error.details);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في حذف سجل الراتب', 'UNKNOWN_ERROR');
    }
  },

  async approve(id: string, processedBy: string): Promise<PayrollRecord> {
    return this.update(id, {
      status: 'approved',
      processed_by: processedBy,
      processed_at: new Date().toISOString(),
    });
  },

  async markAsPaid(id: string): Promise<PayrollRecord> {
    return this.update(id, {
      status: 'paid',
      paid_at: new Date().toISOString(),
    });
  },
};
