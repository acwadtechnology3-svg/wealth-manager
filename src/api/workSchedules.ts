/**
 * Work Schedules API - Handles employee work schedule database operations
 */

import { supabase } from '@/integrations/supabase/client';
import { ApiError } from '@/lib/errors';

export type ShiftType = 'morning' | 'afternoon' | 'evening' | 'night' | 'flexible';

export interface WorkSchedule {
  id: string;
  employee_id: string;
  day_of_week: number; // 0=Sunday, 6=Saturday
  shift_type: ShiftType;
  start_time: string;
  end_time: string;
  is_working_day: boolean;
  break_duration: number | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  profiles?: {
    first_name: string;
    last_name: string;
    full_name: string;
    department: string;
  };
}

export interface WorkScheduleInsert {
  employee_id: string;
  day_of_week: number;
  shift_type?: ShiftType;
  start_time: string;
  end_time: string;
  is_working_day?: boolean;
  break_duration?: number;
  notes?: string;
}

export interface WorkScheduleUpdate {
  shift_type?: ShiftType;
  start_time?: string;
  end_time?: string;
  is_working_day?: boolean;
  break_duration?: number;
  notes?: string;
}

export const workSchedulesApi = {
  /**
   * List all work schedules with optional filters
   */
  async list(filters?: { employeeId?: string }): Promise<WorkSchedule[]> {
    try {
      let query = supabase
        .from('work_schedules')
        .select(`
          *,
          profiles:employee_id (
            first_name,
            last_name,
            full_name,
            department
          )
        `)
        .order('day_of_week', { ascending: true });

      if (filters?.employeeId) {
        query = query.eq('employee_id', filters.employeeId);
      }

      const { data, error } = await query;

      if (error) throw new ApiError(error);

      return (data || []) as WorkSchedule[];
    } catch (error) {
      throw new ApiError(error);
    }
  },

  /**
   * Get work schedule for a specific employee
   */
  async getByEmployee(employeeId: string): Promise<WorkSchedule[]> {
    try {
      const { data, error } = await supabase
        .from('work_schedules')
        .select('*')
        .eq('employee_id', employeeId)
        .order('day_of_week', { ascending: true });

      if (error) throw new ApiError(error);

      return (data || []) as WorkSchedule[];
    } catch (error) {
      throw new ApiError(error);
    }
  },

  /**
   * Create or update work schedule (upsert by employee_id + day_of_week)
   */
  async upsert(schedule: WorkScheduleInsert): Promise<WorkSchedule> {
    try {
      const { data, error } = await supabase
        .from('work_schedules')
        .upsert({
          ...schedule,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        }, {
          onConflict: 'employee_id,day_of_week',
        })
        .select()
        .single();

      if (error) throw new ApiError(error);
      if (!data) throw new Error('Failed to create/update work schedule');

      return data as WorkSchedule;
    } catch (error) {
      throw new ApiError(error);
    }
  },

  /**
   * Create default schedule for an employee (Mon-Fri 9-5)
   */
  async createDefaultSchedule(employeeId: string): Promise<WorkSchedule[]> {
    try {
      const schedules: WorkScheduleInsert[] = [];

      // Sunday through Saturday
      for (let day = 0; day <= 6; day++) {
        schedules.push({
          employee_id: employeeId,
          day_of_week: day,
          shift_type: 'morning',
          start_time: '09:00',
          end_time: '17:00',
          // Friday and Saturday are off in Egypt
          is_working_day: day !== 5 && day !== 6,
          break_duration: 60,
        });
      }

      const { data, error } = await supabase
        .from('work_schedules')
        .upsert(schedules.map(s => ({
          ...s,
          created_by: undefined,
        })), {
          onConflict: 'employee_id,day_of_week',
        })
        .select();

      if (error) throw new ApiError(error);

      return (data || []) as WorkSchedule[];
    } catch (error) {
      throw new ApiError(error);
    }
  },

  /**
   * Update a specific schedule
   */
  async update(id: string, updates: WorkScheduleUpdate): Promise<WorkSchedule> {
    try {
      const { data, error } = await supabase
        .from('work_schedules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw new ApiError(error);
      if (!data) throw new Error('Work schedule not found');

      return data as WorkSchedule;
    } catch (error) {
      throw new ApiError(error);
    }
  },

  /**
   * Delete a work schedule
   */
  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('work_schedules')
        .delete()
        .eq('id', id);

      if (error) throw new ApiError(error);
    } catch (error) {
      throw new ApiError(error);
    }
  },
};
