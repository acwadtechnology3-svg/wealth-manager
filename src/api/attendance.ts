/**
 * API functions for attendance operations
 * Pure functions that interact with Supabase
 */

import { supabase } from '@/integrations/supabase/client';
import { ApiError } from '@/lib/errors';

export interface Attendance {
  id: string;
  employee_id: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  status: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AttendanceWithProfile extends Attendance {
  profiles?: {
    full_name: string | null;
    email: string;
    employee_code: string | null;
    department: string | null;
  };
}

export interface AttendanceInsert {
  employee_id: string;
  date: string;
  check_in?: string;
  check_out?: string;
  status?: string;
  notes?: string;
}

export interface AttendanceUpdate {
  check_in?: string;
  check_out?: string;
  status?: string;
  notes?: string;
}

export const attendanceApi = {
  async list(filters?: {
    employeeId?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
  }): Promise<AttendanceWithProfile[]> {
    try {
      let query = supabase
        .from('attendance')
        .select(`
          *,
          profiles!attendance_employee_id_fkey(
            full_name,
            email,
            employee_code,
            department
          )
        `)
        .order('date', { ascending: false });

      if (filters?.employeeId) {
        query = query.eq('employee_id', filters.employeeId);
      }
      if (filters?.startDate) {
        query = query.gte('date', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('date', filters.endDate);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;
      if (error) throw new ApiError(error.message, error.code, error.details);
      return (data || []) as AttendanceWithProfile[];
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في تحميل سجلات الحضور', 'UNKNOWN_ERROR');
    }
  },

  async getById(id: string): Promise<AttendanceWithProfile> {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          *,
          profiles!attendance_employee_id_fkey(
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
      return data as AttendanceWithProfile;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في تحميل سجل الحضور', 'UNKNOWN_ERROR');
    }
  },

  async create(attendance: AttendanceInsert): Promise<Attendance> {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .insert(attendance)
        .select()
        .single();

      if (error) throw new ApiError(error.message, error.code, error.details);
      if (!data) throw new ApiError('فشل في إنشاء سجل الحضور', 'CREATE_FAILED');
      return data as Attendance;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في إنشاء سجل الحضور', 'UNKNOWN_ERROR');
    }
  },

  async update(id: string, updates: AttendanceUpdate): Promise<Attendance> {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw new ApiError(error.message, error.code, error.details);
      if (!data) throw new ApiError('السجل غير موجود', 'NOT_FOUND');
      return data as Attendance;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في تحديث سجل الحضور', 'UNKNOWN_ERROR');
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('attendance')
        .delete()
        .eq('id', id);

      if (error) throw new ApiError(error.message, error.code, error.details);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في حذف سجل الحضور', 'UNKNOWN_ERROR');
    }
  },

  async checkIn(employeeId: string, time: string): Promise<Attendance> {
    const today = new Date().toISOString().split('T')[0];

    try {
      // Check if record exists for today
      const { data: existing } = await supabase
        .from('attendance')
        .select('id')
        .eq('employee_id', employeeId)
        .eq('date', today)
        .single();

      if (existing) {
        return this.update(existing.id, { check_in: time, status: 'present' });
      } else {
        return this.create({
          employee_id: employeeId,
          date: today,
          check_in: time,
          status: 'present',
        });
      }
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في تسجيل الحضور', 'UNKNOWN_ERROR');
    }
  },

  async checkOut(employeeId: string, time: string): Promise<Attendance> {
    const today = new Date().toISOString().split('T')[0];

    try {
      const { data: existing } = await supabase
        .from('attendance')
        .select('id')
        .eq('employee_id', employeeId)
        .eq('date', today)
        .single();

      if (!existing) {
        throw new ApiError('لم يتم تسجيل الحضور اليوم', 'NOT_FOUND');
      }

      return this.update(existing.id, { check_out: time });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في تسجيل الانصراف', 'UNKNOWN_ERROR');
    }
  },
};
