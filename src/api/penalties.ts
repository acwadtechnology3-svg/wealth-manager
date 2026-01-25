/**
 * API functions for employee penalties operations
 */

import { supabase } from '@/integrations/supabase/client';
import { ApiError } from '@/lib/errors';

export type PenaltyType = 'warning' | 'suspension' | 'fine' | 'other';

export interface EmployeePenalty {
  id: string;
  employee_id: string;
  penalty_type: PenaltyType;
  title: string;
  description: string | null;
  amount: number;
  penalty_date: string;
  issued_by: string;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PenaltyWithProfile extends EmployeePenalty {
  profiles?: {
    full_name: string | null;
    email: string;
    employee_code: string | null;
    department: string | null;
  };
  issued_by_profile?: {
    full_name: string | null;
    email: string;
  };
}

export interface PenaltyInsert {
  employee_id: string;
  penalty_type: PenaltyType;
  title: string;
  description?: string;
  amount?: number;
  penalty_date: string;
  issued_by: string;
  notes?: string;
}

export interface PenaltyUpdate {
  penalty_type?: PenaltyType;
  title?: string;
  description?: string;
  amount?: number;
  penalty_date?: string;
  is_active?: boolean;
  notes?: string;
}

export const penaltiesApi = {
  async list(filters?: {
    employeeId?: string;
    penaltyType?: PenaltyType;
    isActive?: boolean;
  }): Promise<PenaltyWithProfile[]> {
    try {
      let query = supabase
        .from('employee_penalties')
        .select(`
          *,
          profiles!employee_penalties_employee_id_fkey(
            full_name,
            email,
            employee_code,
            department
          )
        `)
        .order('penalty_date', { ascending: false });

      if (filters?.employeeId) {
        query = query.eq('employee_id', filters.employeeId);
      }
      if (filters?.penaltyType) {
        query = query.eq('penalty_type', filters.penaltyType);
      }
      if (filters?.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive);
      }

      const { data, error } = await query;
      if (error) throw new ApiError(error.message, error.code, error.details);
      return (data || []) as PenaltyWithProfile[];
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في تحميل الجزاءات', 'UNKNOWN_ERROR');
    }
  },

  async getById(id: string): Promise<PenaltyWithProfile> {
    try {
      const { data, error } = await supabase
        .from('employee_penalties')
        .select(`
          *,
          profiles!employee_penalties_employee_id_fkey(
            full_name,
            email,
            employee_code,
            department
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw new ApiError(error.message, error.code, error.details);
      if (!data) throw new ApiError('الجزاء غير موجود', 'NOT_FOUND');
      return data as PenaltyWithProfile;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في تحميل الجزاء', 'UNKNOWN_ERROR');
    }
  },

  async create(penalty: PenaltyInsert): Promise<EmployeePenalty> {
    try {
      const { data, error } = await supabase
        .from('employee_penalties')
        .insert(penalty)
        .select()
        .single();

      if (error) throw new ApiError(error.message, error.code, error.details);
      if (!data) throw new ApiError('فشل في إنشاء الجزاء', 'CREATE_FAILED');
      return data as EmployeePenalty;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في إنشاء الجزاء', 'UNKNOWN_ERROR');
    }
  },

  async update(id: string, updates: PenaltyUpdate): Promise<EmployeePenalty> {
    try {
      const { data, error } = await supabase
        .from('employee_penalties')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw new ApiError(error.message, error.code, error.details);
      if (!data) throw new ApiError('الجزاء غير موجود', 'NOT_FOUND');
      return data as EmployeePenalty;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في تحديث الجزاء', 'UNKNOWN_ERROR');
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('employee_penalties')
        .delete()
        .eq('id', id);

      if (error) throw new ApiError(error.message, error.code, error.details);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في حذف الجزاء', 'UNKNOWN_ERROR');
    }
  },

  async deactivate(id: string): Promise<EmployeePenalty> {
    return this.update(id, { is_active: false });
  },

  async activate(id: string): Promise<EmployeePenalty> {
    return this.update(id, { is_active: true });
  },
};
