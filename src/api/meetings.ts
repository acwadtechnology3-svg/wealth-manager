/**
 * API functions for meetings operations
 */

import { supabase } from '@/integrations/supabase/client';
import type { Meeting, MeetingInsert, MeetingUpdate } from '@/types/database';
import { ApiError } from '@/lib/errors';

export interface MeetingWithProfile extends Meeting {
  responsible_employee?: {
    full_name: string | null;
    email: string;
    employee_code: string | null;
  };
  creator?: {
    full_name: string | null;
    email: string;
  };
}

export const meetingsApi = {
  async list(filters?: {
    startDate?: string;
    endDate?: string;
    responsibleEmployeeId?: string;
  }): Promise<MeetingWithProfile[]> {
    try {
      let query = supabase
        .from('meetings')
        .select(`
          *,
          responsible_employee:profiles!meetings_responsible_employee_id_fkey(
            full_name,
            email,
            employee_code
          ),
          creator:profiles!meetings_created_by_fkey(
            full_name,
            email
          )
        `)
        .order('meeting_date', { ascending: true });

      if (filters?.startDate) {
        query = query.gte('meeting_date', filters.startDate);
      }

      if (filters?.endDate) {
        query = query.lte('meeting_date', filters.endDate);
      }

      if (filters?.responsibleEmployeeId) {
        query = query.eq('responsible_employee_id', filters.responsibleEmployeeId);
      }

      const { data, error } = await query;

      if (error) throw new ApiError(error.message, error.code, error.details);
      return (data || []) as MeetingWithProfile[];
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في تحميل الاجتماعات', 'UNKNOWN_ERROR');
    }
  },

  async getById(id: string): Promise<MeetingWithProfile> {
    try {
      const { data, error } = await supabase
        .from('meetings')
        .select(`
          *,
          responsible_employee:profiles!meetings_responsible_employee_id_fkey(
            full_name,
            email,
            employee_code
          ),
          creator:profiles!meetings_created_by_fkey(
            full_name,
            email
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw new ApiError(error.message, error.code, error.details);
      if (!data) throw new ApiError('الاجتماع غير موجود', 'NOT_FOUND');

      return data as MeetingWithProfile;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في تحميل الاجتماع', 'UNKNOWN_ERROR');
    }
  },

  async create(meeting: MeetingInsert): Promise<Meeting> {
    try {
      const { data, error } = await supabase
        .from('meetings')
        .insert(meeting)
        .select()
        .single();

      if (error) throw new ApiError(error.message, error.code, error.details);
      if (!data) throw new ApiError('فشل في إنشاء الاجتماع', 'CREATE_FAILED');

      return data;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في إضافة الاجتماع', 'UNKNOWN_ERROR');
    }
  },

  async update(id: string, updates: MeetingUpdate): Promise<Meeting> {
    try {
      const { data, error } = await supabase
        .from('meetings')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw new ApiError(error.message, error.code, error.details);
      if (!data) throw new ApiError('الاجتماع غير موجود', 'NOT_FOUND');

      return data;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في تحديث الاجتماع', 'UNKNOWN_ERROR');
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('meetings')
        .delete()
        .eq('id', id);

      if (error) throw new ApiError(error.message, error.code, error.details);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في حذف الاجتماع', 'UNKNOWN_ERROR');
    }
  },
};
