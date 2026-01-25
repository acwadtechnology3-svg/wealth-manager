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
  assigned_to: string;
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
