/**
 * API functions for employee targets operations
 * Pure functions that interact with Supabase
 */

import { supabase } from '@/integrations/supabase/client';
import type { EmployeeTarget, EmployeeTargetInsert, EmployeeTargetUpdate } from '@/types/database';
import { ApiError } from '@/lib/errors';

/**
 * Employee target with profile information
 */
export interface EmployeeTargetWithProfile extends EmployeeTarget {
  profiles?: {
    full_name: string | null;
    email: string;
    employee_code: string | null;
  };
}

/**
 * Employee targets API functions
 */
export const targetsApi = {
  /**
   * List employee targets with optional filters
   */
  async list(filters?: {
    employeeId?: string;
    month?: string;
    status?: string;
    targetType?: string;
  }): Promise<EmployeeTargetWithProfile[]> {
    try {
      let query = supabase
        .from('employee_targets')
        .select(`
          *,
          profiles!employee_targets_employee_id_fkey(
            full_name,
            email,
            employee_code
          )
        `)
        .order('month', { ascending: false });

      if (filters?.employeeId) {
        query = query.eq('employee_id', filters.employeeId);
      }

      if (filters?.month) {
        query = query.eq('month', filters.month);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.targetType) {
        query = query.eq('target_type', filters.targetType);
      }

      const { data, error } = await query;

      if (error) throw new ApiError(error.message, error.code, error.details);
      return (data || []) as EmployeeTargetWithProfile[];
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في تحميل بيانات الأهداف', 'UNKNOWN_ERROR');
    }
  },

  /**
   * Get target by ID
   */
  async getById(id: string): Promise<EmployeeTarget> {
    try {
      const { data, error } = await supabase
        .from('employee_targets')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw new ApiError(error.message, error.code, error.details);
      if (!data) throw new ApiError('الهدف غير موجود', 'NOT_FOUND');

      return data;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في تحميل بيانات الهدف', 'UNKNOWN_ERROR');
    }
  },

  /**
   * Get targets by employee ID
   */
  async getByEmployee(employeeId: string): Promise<EmployeeTarget[]> {
    try {
      const { data, error } = await supabase
        .from('employee_targets')
        .select('*')
        .eq('employee_id', employeeId)
        .order('month', { ascending: false });

      if (error) throw new ApiError(error.message, error.code, error.details);
      return data || [];
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في تحميل أهداف الموظف', 'UNKNOWN_ERROR');
    }
  },

  /**
   * Get current month targets for an employee
   */
  async getCurrentTargets(employeeId: string): Promise<EmployeeTarget[]> {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

      const { data, error } = await supabase
        .from('employee_targets')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('month', currentMonth);

      if (error) throw new ApiError(error.message, error.code, error.details);
      return data || [];
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في تحميل الأهداف الحالية', 'UNKNOWN_ERROR');
    }
  },

  /**
   * Get targets by month
   */
  async getByMonth(month: string): Promise<EmployeeTargetWithProfile[]> {
    try {
      const { data, error } = await supabase
        .from('employee_targets')
        .select(`
          *,
          profiles!employee_targets_employee_id_fkey(
            full_name,
            email,
            employee_code
          )
        `)
        .eq('month', month)
        .order('target_value', { ascending: false });

      if (error) throw new ApiError(error.message, error.code, error.details);
      return (data || []) as EmployeeTargetWithProfile[];
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في تحميل أهداف الشهر', 'UNKNOWN_ERROR');
    }
  },

  /**
   * Create target
   */
  async create(target: EmployeeTargetInsert): Promise<EmployeeTarget> {
    try {
      const { data, error } = await supabase
        .from('employee_targets')
        .insert(target)
        .select()
        .single();

      if (error) throw new ApiError(error.message, error.code, error.details);
      if (!data) throw new ApiError('فشل في إنشاء الهدف', 'CREATE_FAILED');

      return data;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في إضافة الهدف', 'UNKNOWN_ERROR');
    }
  },

  /**
   * Update target
   */
  async update(id: string, updates: EmployeeTargetUpdate): Promise<EmployeeTarget> {
    try {
      const { data, error } = await supabase
        .from('employee_targets')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw new ApiError(error.message, error.code, error.details);
      if (!data) throw new ApiError('الهدف غير موجود', 'NOT_FOUND');

      return data;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في تحديث الهدف', 'UNKNOWN_ERROR');
    }
  },

  /**
   * Update target progress
   */
  async updateProgress(id: string, currentValue: number): Promise<EmployeeTarget> {
    try {
      // Fetch target first to calculate status
      const target = await this.getById(id);
      const progress = (currentValue / target.target_value) * 100;

      let status: string = 'pending';
      if (progress >= 100) {
        status = 'achieved';
      } else if (progress >= 80) {
        status = 'in_progress';
      }

      return await this.update(id, {
        current_value: currentValue,
        status,
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في تحديث تقدم الهدف', 'UNKNOWN_ERROR');
    }
  },

  /**
   * Delete target
   */
  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('employee_targets')
        .delete()
        .eq('id', id);

      if (error) throw new ApiError(error.message, error.code, error.details);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في حذف الهدف', 'UNKNOWN_ERROR');
    }
  },

  /**
   * Get target achievement statistics
   */
  async getStats(filters?: {
    employeeId?: string;
    month?: string;
  }): Promise<{
    total: number;
    achieved: number;
    inProgress: number;
    pending: number;
    achievementRate: number;
  }> {
    try {
      let query = supabase
        .from('employee_targets')
        .select('status');

      if (filters?.employeeId) {
        query = query.eq('employee_id', filters.employeeId);
      }

      if (filters?.month) {
        query = query.eq('month', filters.month);
      }

      const { data, error } = await query;

      if (error) throw new ApiError(error.message, error.code, error.details);

      const targets = data || [];
      const achieved = targets.filter(t => t.status === 'achieved').length;

      return {
        total: targets.length,
        achieved,
        inProgress: targets.filter(t => t.status === 'in_progress').length,
        pending: targets.filter(t => t.status === 'pending').length,
        achievementRate: targets.length > 0 ? (achieved / targets.length) * 100 : 0,
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في تحميل إحصائيات الأهداف', 'UNKNOWN_ERROR');
    }
  },

  /**
   * Get top performing employees by targets achieved
   */
  async getTopPerformers(month?: string, limit: number = 10): Promise<{
    employeeId: string;
    employeeName: string;
    achievedCount: number;
    totalTargets: number;
    achievementRate: number;
  }[]> {
    try {
      let query = supabase
        .from('employee_targets')
        .select(`
          employee_id,
          status,
          profiles!employee_targets_employee_id_fkey(
            full_name,
            email
          )
        `);

      if (month) {
        query = query.eq('month', month);
      }

      const { data, error } = await query;

      if (error) throw new ApiError(error.message, error.code, error.details);

      // Aggregate by employee
      const employeeMap = new Map<string, {
        name: string;
        achieved: number;
        total: number;
      }>();

      (data || []).forEach((target: any) => {
        const employeeId = target.employee_id;
        const existing = employeeMap.get(employeeId) || {
          name: target.profiles?.full_name || target.profiles?.email || 'غير معروف',
          achieved: 0,
          total: 0,
        };

        existing.total += 1;
        if (target.status === 'achieved') {
          existing.achieved += 1;
        }

        employeeMap.set(employeeId, existing);
      });

      // Convert to array and sort
      const performers = Array.from(employeeMap.entries())
        .map(([employeeId, stats]) => ({
          employeeId,
          employeeName: stats.name,
          achievedCount: stats.achieved,
          totalTargets: stats.total,
          achievementRate: stats.total > 0 ? (stats.achieved / stats.total) * 100 : 0,
        }))
        .sort((a, b) => b.achievementRate - a.achievementRate)
        .slice(0, limit);

      return performers;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في تحميل أفضل الموظفين', 'UNKNOWN_ERROR');
    }
  },
};
