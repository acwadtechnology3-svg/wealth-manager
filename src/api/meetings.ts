/**
 * API functions for meetings operations
 */

import { supabase } from '@/integrations/supabase/client';
import type { Meeting, MeetingInsert, MeetingUpdate, Profile } from '@/types/database';
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

const attachMeetingProfiles = async (meetings: Meeting[]): Promise<MeetingWithProfile[]> => {
  if (meetings.length === 0) return meetings as MeetingWithProfile[];

  const userIds = Array.from(
    new Set(
      meetings
        .flatMap((meeting) => [meeting.responsible_employee_id, meeting.created_by])
        .filter(Boolean)
    )
  );

  if (userIds.length === 0) return meetings as MeetingWithProfile[];

  const { data: profilesData, error: profilesError } = await supabase
    .from('profiles')
    .select('user_id, full_name, email, employee_code')
    .in('user_id', userIds);

  if (profilesError || !profilesData) {
    return meetings as MeetingWithProfile[];
  }

  const profileMap = new Map<string, Profile>();
  profilesData.forEach((profile) => {
    if (profile.user_id) {
      profileMap.set(profile.user_id, profile as Profile);
    }
  });

  return meetings.map((meeting) => {
    const responsibleProfile = profileMap.get(meeting.responsible_employee_id);
    const creatorProfile = profileMap.get(meeting.created_by);

    return {
      ...meeting,
      responsible_employee: responsibleProfile
        ? {
            full_name: responsibleProfile.full_name,
            email: responsibleProfile.email,
            employee_code: responsibleProfile.employee_code,
          }
        : undefined,
      creator: creatorProfile
        ? {
            full_name: creatorProfile.full_name,
            email: creatorProfile.email,
          }
        : undefined,
    };
  });
};

export const meetingsApi = {
  async list(filters?: {
    startDate?: string;
    endDate?: string;
    responsibleEmployeeId?: string;
  }): Promise<MeetingWithProfile[]> {
    try {
      let query = supabase
        .from('meetings')
        .select('*')
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
      return await attachMeetingProfiles((data || []) as Meeting[]);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في تحميل الاجتماعات', 'UNKNOWN_ERROR');
    }
  },

  async getById(id: string): Promise<MeetingWithProfile> {
    try {
      const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw new ApiError(error.message, error.code, error.details);
      if (!data) throw new ApiError('الاجتماع غير موجود', 'NOT_FOUND');

      const [meeting] = await attachMeetingProfiles([data as Meeting]);
      return meeting || (data as MeetingWithProfile);
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
