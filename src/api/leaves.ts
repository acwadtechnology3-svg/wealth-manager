/**
 * API functions for leave requests operations
 */

import { supabase } from '@/integrations/supabase/client';
import { ApiError } from '@/lib/errors';

export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type LeaveType = 'vacation' | 'sick' | 'personal' | 'maternity' | 'paternity' | 'unpaid';

export interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  days_count: number;
  reason: string | null;
  status: LeaveStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeaveRequestWithProfile extends LeaveRequest {
  profiles?: {
    full_name: string | null;
    email: string;
    employee_code: string | null;
    department: string | null;
  };
}

export interface LeaveRequestInsert {
  employee_id: string;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  days_count: number;
  reason?: string;
}

export interface LeaveRequestUpdate {
  leave_type?: LeaveType;
  start_date?: string;
  end_date?: string;
  days_count?: number;
  reason?: string;
  status?: LeaveStatus;
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
}

export const leavesApi = {
  async list(filters?: {
    employeeId?: string;
    status?: LeaveStatus;
    leaveType?: LeaveType;
  }): Promise<LeaveRequestWithProfile[]> {
    try {
      let query = supabase
        .from('leave_requests')
        .select(`
          *,
          profiles!leave_requests_employee_id_fkey(
            full_name,
            email,
            employee_code,
            department
          )
        `)
        .order('created_at', { ascending: false });

      if (filters?.employeeId) {
        query = query.eq('employee_id', filters.employeeId);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.leaveType) {
        query = query.eq('leave_type', filters.leaveType);
      }

      const { data, error } = await query;
      if (error) throw new ApiError(error.message, error.code, error.details);
      return (data || []) as LeaveRequestWithProfile[];
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في تحميل طلبات الإجازات', 'UNKNOWN_ERROR');
    }
  },

  async getById(id: string): Promise<LeaveRequestWithProfile> {
    try {
      const { data, error } = await supabase
        .from('leave_requests')
        .select(`
          *,
          profiles!leave_requests_employee_id_fkey(
            full_name,
            email,
            employee_code,
            department
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw new ApiError(error.message, error.code, error.details);
      if (!data) throw new ApiError('الطلب غير موجود', 'NOT_FOUND');
      return data as LeaveRequestWithProfile;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في تحميل طلب الإجازة', 'UNKNOWN_ERROR');
    }
  },

  async create(leave: LeaveRequestInsert): Promise<LeaveRequest> {
    try {
      const { data, error } = await supabase
        .from('leave_requests')
        .insert(leave)
        .select()
        .single();

      if (error) throw new ApiError(error.message, error.code, error.details);
      if (!data) throw new ApiError('فشل في إنشاء طلب الإجازة', 'CREATE_FAILED');
      return data as LeaveRequest;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في إنشاء طلب الإجازة', 'UNKNOWN_ERROR');
    }
  },

  async update(id: string, updates: LeaveRequestUpdate): Promise<LeaveRequest> {
    try {
      const { data, error } = await supabase
        .from('leave_requests')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw new ApiError(error.message, error.code, error.details);
      if (!data) throw new ApiError('الطلب غير موجود', 'NOT_FOUND');
      return data as LeaveRequest;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في تحديث طلب الإجازة', 'UNKNOWN_ERROR');
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('leave_requests')
        .delete()
        .eq('id', id);

      if (error) throw new ApiError(error.message, error.code, error.details);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في حذف طلب الإجازة', 'UNKNOWN_ERROR');
    }
  },

  async approve(id: string, reviewedBy: string, notes?: string): Promise<LeaveRequest> {
    return this.update(id, {
      status: 'approved',
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
      review_notes: notes,
    });
  },

  async reject(id: string, reviewedBy: string, notes?: string): Promise<LeaveRequest> {
    return this.update(id, {
      status: 'rejected',
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
      review_notes: notes,
    });
  },
};
