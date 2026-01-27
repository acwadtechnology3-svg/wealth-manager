/**
 * React Query hooks for profile (employee) operations
 * Provides type-safe hooks with caching and error handling
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { profilesApi } from '@/api/profiles';
import type { Profile, ProfileUpdate } from '@/types/database';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { handleApiError } from '@/lib/errors';

/**
 * Hook to fetch list of profiles (employees) with optional filters
 */
export function useProfiles(
  filters?: {
    role?: string;
    department?: string;
    active?: boolean;
  },
  options?: { enabled?: boolean }
) {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.profiles.list(filters),
    queryFn: () => profilesApi.list(filters),
    enabled: !!user && (options?.enabled ?? true),
  });
}

/**
 * Hook to fetch all employees (active profiles)
 */
export function useEmployees() {
  return useProfiles({ active: true });
}

/**
 * Hook to fetch employees with a specific role
 */
export function useEmployeesByRole(role: string) {
  return useProfiles({ role, active: true });
}

/**
 * Hook to fetch single profile by user ID
 */
export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.profiles.detail(userId!),
    queryFn: () => profilesApi.getById(userId!),
    enabled: !!userId,
  });
}

/**
 * Hook to fetch profile statistics
 */
export function useProfileStats() {
  return useQuery({
    queryKey: queryKeys.profiles.stats(),
    queryFn: () => profilesApi.getStats(),
  });
}

/**
 * Mutation hook to update a profile
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ userId, updates }: { userId: string; updates: ProfileUpdate }) =>
      profilesApi.update(userId, updates),

    onSuccess: (updatedProfile) => {
      // Invalidate profile queries
      queryClient.invalidateQueries({ queryKey: queryKeys.profiles.detail(updatedProfile.user_id!) });
      queryClient.invalidateQueries({ queryKey: queryKeys.profiles.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.profiles.stats() });

      toast({
        title: 'تم بنجاح',
        description: 'تم تحديث بيانات الموظف',
      });
    },

    onError: (error) => {
      toast({
        title: 'خطأ',
        description: handleApiError(error),
        variant: 'destructive',
      });
    },
  });
}
