/**
 * API functions for phone numbers operations
 */

import { supabase } from '@/integrations/supabase/client';
import { ApiError } from '@/lib/errors';
import type { PhoneNumberBatch, PhoneNumber } from '@/types/database';

export interface PhoneNumberBatchWithDetails extends PhoneNumberBatch {
  uploader?: {
    full_name: string | null;
    email: string;
  };
  phone_numbers_count?: number;
}

export interface PhoneNumberWithAssignee extends PhoneNumber {
  assignee?: {
    full_name: string | null;
    email: string;
    employee_code: string | null;
  };
}

export interface BatchInsert {
  file_name: string;
  assignment_mode: 'cold_calling' | 'targeted';
  uploaded_by: string;
  total_numbers: number;
}

export interface PhoneNumberInsert {
  batch_id: string;
  phone_number: string;
  assigned_to: string | null;
  assigned_employee_name?: string;
}

export const phoneNumbersApi = {
  /**
   * Create a new batch and assign phone numbers
   */
  async createBatchWithNumbers(
    batch: BatchInsert,
    phoneNumbers: Omit<PhoneNumberInsert, 'batch_id'>[]
  ): Promise<PhoneNumberBatch> {
    try {
      // Create batch
      const { data: batchData, error: batchError } = await supabase
        .from('phone_number_batches')
        .insert(batch)
        .select()
        .single();

      if (batchError) throw new ApiError(batchError.message, batchError.code, batchError.details);
      if (!batchData) throw new ApiError('فشل في إنشاء المجموعة', 'CREATE_FAILED');

      // Insert phone numbers in batches of 1000
      const batchSize = 1000;
      for (let i = 0; i < phoneNumbers.length; i += batchSize) {
        const chunk = phoneNumbers.slice(i, i + batchSize).map(pn => ({
          ...pn,
          batch_id: batchData.id,
        }));

        const { error: numbersError } = await supabase
          .from('phone_numbers')
          .insert(chunk);

        if (numbersError) {
          // Rollback: delete the batch
          await supabase.from('phone_number_batches').delete().eq('id', batchData.id);
          throw new ApiError(numbersError.message, numbersError.code, numbersError.details);
        }
      }

      return batchData as PhoneNumberBatch;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في رفع الأرقام', 'UNKNOWN_ERROR');
    }
  },

  /**
   * List all batches
   */
  async listBatches(): Promise<PhoneNumberBatchWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from('phone_number_batches')
        .select(`
          *,
          uploader:profiles!phone_number_batches_uploaded_by_fkey(
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw new ApiError(error.message, error.code, error.details);
      return (data || []) as PhoneNumberBatchWithDetails[];
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في تحميل المجموعات', 'UNKNOWN_ERROR');
    }
  },

  /**
   * Get phone numbers by batch ID
   */
  async getNumbersByBatch(batchId: string): Promise<PhoneNumberWithAssignee[]> {
    try {
      const { data, error } = await supabase
        .from('phone_numbers')
        .select(`
          *,
          assignee:profiles!phone_numbers_assigned_to_fkey(
            full_name,
            email,
            employee_code
          )
        `)
        .eq('batch_id', batchId)
        .order('created_at', { ascending: true });

      if (error) throw new ApiError(error.message, error.code, error.details);
      return (data || []) as PhoneNumberWithAssignee[];
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في تحميل الأرقام', 'UNKNOWN_ERROR');
    }
  },

  /**
   * Get phone numbers assigned to a specific employee
   */
  async getNumbersByEmployee(employeeId: string): Promise<PhoneNumberWithAssignee[]> {
    try {
      const { data, error } = await supabase
        .from('phone_numbers')
        .select(`
          *,
          assignee:profiles!phone_numbers_assigned_to_fkey(
            full_name,
            email,
            employee_code
          )
        `)
        .eq('assigned_to', employeeId)
        .order('created_at', { ascending: false });

      if (error) throw new ApiError(error.message, error.code, error.details);
      return (data || []) as PhoneNumberWithAssignee[];
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في تحميل الأرقام المخصصة', 'UNKNOWN_ERROR');
    }
  },

  /**
   * Assign phone numbers randomly across employees
   */
  async assignPhoneNumbersRandom(
    batchId: string,
    employeeIds: string[],
    options?: { dueDays?: number; priority?: string }
  ): Promise<{ assigned: number; perEmployee: Record<string, number> }> {
    try {
      if (employeeIds.length === 0) {
        return { assigned: 0, perEmployee: {} };
      }

      const { data, error } = await supabase
        .from('phone_numbers')
        .select('id')
        .eq('batch_id', batchId)
        .is('assigned_to', null);

      if (error) throw new ApiError(error.message, error.code, error.details);

      const unassigned = data || [];
      if (unassigned.length === 0) {
        return { assigned: 0, perEmployee: {} };
      }

      const dueDays = options?.dueDays ?? 7;
      const dueDate = new Date(Date.now() + dueDays * 24 * 60 * 60 * 1000).toISOString();
      const priority = options?.priority ?? 'medium';

      const perEmployee: Record<string, number> = {};
      const updates = unassigned.map((row, index) => {
        const employeeId = employeeIds[index % employeeIds.length];
        perEmployee[employeeId] = (perEmployee[employeeId] ?? 0) + 1;
        return {
          id: row.id,
          assigned_to: employeeId,
          due_date: dueDate,
          priority,
        };
      });

      const chunkSize = 100;
      for (let i = 0; i < updates.length; i += chunkSize) {
        const chunk = updates.slice(i, i + chunkSize);
        const { error: updateError } = await supabase
          .from('phone_numbers')
          .upsert(chunk, { onConflict: 'id' });

        if (updateError) throw new ApiError(updateError.message, updateError.code, updateError.details);
      }

      return { assigned: updates.length, perEmployee };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في توزيع الأرقام', 'UNKNOWN_ERROR');
    }
  },

  /**
   * Assign specific phone numbers to specific employees
   */
  async assignPhoneNumbersTargeted(
    batchId: string,
    assignments: Array<{ phoneNumberId: string; employeeId: string }>,
    options?: { dueDays?: number; priority?: string }
  ): Promise<{ assigned: number }> {
    try {
      if (assignments.length === 0) {
        return { assigned: 0 };
      }

      const ids = assignments.map(item => item.phoneNumberId);
      const { data: existing, error: existingError } = await supabase
        .from('phone_numbers')
        .select('id')
        .eq('batch_id', batchId)
        .in('id', ids);

      if (existingError) throw new ApiError(existingError.message, existingError.code, existingError.details);

      const validIds = new Set((existing || []).map(row => row.id));
      const validAssignments = assignments.filter(item => validIds.has(item.phoneNumberId));

      if (validAssignments.length === 0) {
        return { assigned: 0 };
      }

      const dueDays = options?.dueDays ?? 7;
      const dueDate = new Date(Date.now() + dueDays * 24 * 60 * 60 * 1000).toISOString();
      const priority = options?.priority ?? 'medium';

      const updates = validAssignments.map(item => ({
        id: item.phoneNumberId,
        assigned_to: item.employeeId,
        due_date: dueDate,
        priority,
      }));

      const chunkSize = 100;
      for (let i = 0; i < updates.length; i += chunkSize) {
        const chunk = updates.slice(i, i + chunkSize);
        const { error: updateError } = await supabase
          .from('phone_numbers')
          .upsert(chunk, { onConflict: 'id' });

        if (updateError) throw new ApiError(updateError.message, updateError.code, updateError.details);
      }

      return { assigned: updates.length };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في تعيين الأرقام', 'UNKNOWN_ERROR');
    }
  },

  /**
   * Get task calendar data for an employee
   */
  async getEmployeeTaskCalendar(
    employeeId: string,
    startDate: string,
    endDate: string
  ): Promise<
    Array<{
      date: string;
      tasks: PhoneNumber[];
      counts: { pending: number; inProgress: number; completed: number };
    }>
  > {
    try {
      const { data, error } = await supabase
        .from('phone_numbers')
        .select('*')
        .eq('assigned_to', employeeId)
        .gte('due_date', startDate)
        .lte('due_date', endDate)
        .order('due_date', { ascending: true });

      if (error) throw new ApiError(error.message, error.code, error.details);

      const tasks = (data || []) as PhoneNumber[];
      const grouped = new Map<
        string,
        { date: string; tasks: PhoneNumber[]; counts: { pending: number; inProgress: number; completed: number } }
      >();

      tasks.forEach(task => {
        if (!task.due_date) return;
        const dateKey = task.due_date.split('T')[0];
        if (!grouped.has(dateKey)) {
          grouped.set(dateKey, {
            date: dateKey,
            tasks: [],
            counts: { pending: 0, inProgress: 0, completed: 0 },
          });
        }
        const entry = grouped.get(dateKey);
        if (!entry) return;
        entry.tasks.push(task);
        if (task.call_status === 'pending') entry.counts.pending += 1;
        if (task.call_status === 'in_progress') entry.counts.inProgress += 1;
        if (task.call_status === 'completed') entry.counts.completed += 1;
      });

      return Array.from(grouped.values()).sort((a, b) => a.date.localeCompare(b.date));
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في تحميل تقويم المهام', 'UNKNOWN_ERROR');
    }
  },

  /**
   * Get upcoming tasks for an employee
   */
  async getUpcomingTasks(employeeId: string, limit: number = 10): Promise<PhoneNumber[]> {
    try {
      const { data, error } = await supabase
        .from('phone_numbers')
        .select('*')
        .eq('assigned_to', employeeId)
        .in('call_status', ['pending', 'in_progress'])
        .order('due_date', { ascending: true, nullsFirst: false })
        .limit(limit);

      if (error) throw new ApiError(error.message, error.code, error.details);
      return (data || []) as PhoneNumber[];
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في تحميل المهام القادمة', 'UNKNOWN_ERROR');
    }
  },

  /**
   * Get task statistics
   */
  async getTaskStats(employeeId?: string): Promise<{
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    overdue: number;
    completedToday: number;
  }> {
    try {
      let query = supabase
        .from('phone_numbers')
        .select('call_status, due_date, completed_at');

      if (employeeId) {
        query = query.eq('assigned_to', employeeId);
      }

      const { data, error } = await query;

      if (error) throw new ApiError(error.message, error.code, error.details);

      const tasks = (data || []) as Array<{
        call_status: string | null;
        due_date: string | null;
        completed_at: string | null;
      }>;

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const pending = tasks.filter(task => task.call_status === 'pending').length;
      const inProgress = tasks.filter(task => task.call_status === 'in_progress').length;
      const completed = tasks.filter(task => task.call_status === 'completed').length;
      const overdue = tasks.filter(task => {
        if (!task.due_date) return false;
        if (task.call_status === 'completed') return false;
        return new Date(task.due_date) < todayStart;
      }).length;
      const completedToday = tasks.filter(task => {
        if (task.call_status !== 'completed' || !task.completed_at) return false;
        const completedAt = new Date(task.completed_at);
        return completedAt >= todayStart && completedAt <= todayEnd;
      }).length;

      return {
        total: tasks.length,
        pending,
        inProgress,
        completed,
        overdue,
        completedToday,
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في تحميل إحصائيات المهام', 'UNKNOWN_ERROR');
    }
  },

  /**
   * Update task status and notes
   */
  async updateTaskStatus(
    id: string,
    updates: { call_status?: string; notes?: string; completed_at?: string }
  ): Promise<PhoneNumber> {
    try {
      const payload = { ...updates };
      if (payload.call_status === 'completed' && !payload.completed_at) {
        payload.completed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('phone_numbers')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw new ApiError(error.message, error.code, error.details);
      if (!data) throw new ApiError('الرقم غير موجود', 'NOT_FOUND');
      return data as PhoneNumber;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في تحديث حالة المهمة', 'UNKNOWN_ERROR');
    }
  },
  /**
   * Update phone number status and notes
   */
  async updateNumber(
    id: string,
    updates: {
      call_status?: string;
      notes?: string;
      called_at?: string;
    }
  ): Promise<PhoneNumber> {
    try {
      const { data, error } = await supabase
        .from('phone_numbers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw new ApiError(error.message, error.code, error.details);
      if (!data) throw new ApiError('الرقم غير موجود', 'NOT_FOUND');
      return data as PhoneNumber;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في تحديث الرقم', 'UNKNOWN_ERROR');
    }
  },

  /**
   * Delete a batch (cascades to phone numbers)
   */
  async deleteBatch(batchId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('phone_number_batches')
        .delete()
        .eq('id', batchId);

      if (error) throw new ApiError(error.message, error.code, error.details);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في حذف المجموعة', 'UNKNOWN_ERROR');
    }
  },

  /**
   * Get statistics for phone numbers
   */
  async getStats(employeeId?: string): Promise<{
    total: number;
    pending: number;
    called: number;
    interested: number;
    converted: number;
  }> {
    try {
      let query = supabase
        .from('phone_numbers')
        .select('call_status');

      if (employeeId) {
        query = query.eq('assigned_to', employeeId);
      }

      const { data, error } = await query;

      if (error) throw new ApiError(error.message, error.code, error.details);

      const numbers = data || [];

      return {
        total: numbers.length,
        pending: numbers.filter(n => n.call_status === 'pending').length,
        called: numbers.filter(n => n.call_status === 'called').length,
        interested: numbers.filter(n => n.call_status === 'interested').length,
        converted: numbers.filter(n => n.call_status === 'converted').length,
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في تحميل الإحصائيات', 'UNKNOWN_ERROR');
    }
  },
};

