/**
 * API functions for user profiles (employees) operations
 * Pure functions that interact with Supabase
 */

import { supabase } from '@/integrations/supabase/client';
import type { Profile, ProfileUpdate } from '@/types/database';
import { ApiError } from '@/lib/errors';

/**
 * List all profiles (employees) with optional filters
 */
export const profilesApi = {
  async list(filters?: {
    role?: string;
    department?: string;
    active?: boolean;
  }): Promise<Profile[]> {
    try {
      let query = supabase
        .from('profiles')
        .select('*')
        .order('full_name', { ascending: true });

      // Filter by active status
      if (filters?.active !== undefined) {
        query = query.eq('is_active', filters.active);
      }

      const { data, error } = await query;

      if (error) throw new ApiError(error.message, error.code, error.details);

      let profiles = data || [];

      // If role filter is provided, fetch from user_roles
      if (filters?.role && profiles.length > 0) {
        const userIds = profiles.map(p => p.user_id).filter(Boolean);

        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', filters.role)
          .in('user_id', userIds as string[]);

        if (roleError) throw new ApiError(roleError.message, roleError.code, roleError.details);

        const roleUserIds = new Set(roleData?.map(r => r.user_id) || []);
        profiles = profiles.filter(p => p.user_id && roleUserIds.has(p.user_id));
      }

      // Filter by department
      if (filters?.department) {
        profiles = profiles.filter(p => p.department === filters.department);
      }

      return profiles;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في تحميل بيانات الموظفين', 'UNKNOWN_ERROR');
    }
  },

  /**
   * Get profile by user ID
   */
  async getById(userId: string): Promise<Profile> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw new ApiError(error.message, error.code, error.details);
      if (!data) throw new ApiError('الملف الشخصي غير موجود', 'NOT_FOUND');

      return data;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في تحميل بيانات الملف الشخصي', 'UNKNOWN_ERROR');
    }
  },

  /**
   * Get employees with specific role (e.g., tele_sales)
   */
  async getByRole(role: string): Promise<Profile[]> {
    return this.list({ role, active: true });
  },

  /**
   * Update profile
   */
  async update(userId: string, updates: ProfileUpdate): Promise<Profile> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw new ApiError(error.message, error.code, error.details);
      if (!data) throw new ApiError('الملف الشخصي غير موجود', 'NOT_FOUND');

      return data;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في تحديث الملف الشخصي', 'UNKNOWN_ERROR');
    }
  },

  /**
   * Get employee statistics
   */
  async getStats(): Promise<{
    total: number;
    active: number;
    byDepartment: Record<string, number>;
  }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_active, department');

      if (error) throw new ApiError(error.message, error.code, error.details);

      const profiles = data || [];
      const byDepartment: Record<string, number> = {};

      profiles.forEach(profile => {
        const dept = profile.department || 'غير محدد';
        byDepartment[dept] = (byDepartment[dept] || 0) + 1;
      });

      return {
        total: profiles.length,
        active: profiles.filter(p => p.is_active).length,
        byDepartment,
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في تحميل إحصائيات الموظفين', 'UNKNOWN_ERROR');
    }
  },
};
