/**
 * React Query hooks for employee targets operations
 * Provides type-safe hooks with caching and optimistic updates
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { targetsApi } from '@/api/targets';
import type { EmployeeTargetInsert, EmployeeTargetUpdate } from '@/types/database';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { handleApiError } from '@/lib/errors';

/**
 * Hook to fetch list of employee targets
 */
export function useTargets(filters?: {
  employeeId?: string;
  month?: string;
  status?: string;
  targetType?: string;
}) {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.targets.list(filters),
    queryFn: () => targetsApi.list(filters),
    enabled: !!user,
  });
}

/**
 * Hook to fetch single target by ID
 */
export function useTarget(id: string | undefined) {
  return useQuery({
    queryKey: [...queryKeys.targets.all, 'detail', id],
    queryFn: () => targetsApi.getById(id!),
    enabled: !!id,
  });
}

/**
 * Hook to fetch targets by employee ID
 */
export function useEmployeeTargets(employeeId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.targets.byEmployee(employeeId!),
    queryFn: () => targetsApi.getByEmployee(employeeId!),
    enabled: !!employeeId,
  });
}

/**
 * Hook to fetch current month targets for an employee
 */
export function useCurrentTargets(employeeId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.targets.current(employeeId!),
    queryFn: () => targetsApi.getCurrentTargets(employeeId!),
    enabled: !!employeeId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch targets by month
 */
export function useMonthTargets(month: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.targets.byMonth(month!),
    queryFn: () => targetsApi.getByMonth(month!),
    enabled: !!user && !!month,
  });
}

/**
 * Hook to fetch target statistics
 */
export function useTargetStats(filters?: {
  employeeId?: string;
  month?: string;
}) {
  const { user } = useAuth();

  return useQuery({
    queryKey: [...queryKeys.targets.all, 'stats', filters ?? {}],
    queryFn: () => targetsApi.getStats(filters),
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook to fetch top performers by target achievement
 */
export function useTopPerformers(month?: string, limit?: number) {
  const { user } = useAuth();

  return useQuery({
    queryKey: [...queryKeys.targets.all, 'top-performers', month, limit],
    queryFn: () => targetsApi.getTopPerformers(month, limit),
    enabled: !!user,
    staleTime: 1000 * 60 * 10,
  });
}

/**
 * Mutation hook to create a target
 */
export function useCreateTarget() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (target: EmployeeTargetInsert) => targetsApi.create(target),

    onSuccess: (newTarget) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: queryKeys.targets.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.targets.byEmployee(newTarget.employee_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.targets.byMonth(newTarget.month) });

      toast({
        title: 'تم بنجاح',
        description: 'تم إضافة الهدف بنجاح',
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

/**
 * Mutation hook to update a target
 */
export function useUpdateTarget() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: EmployeeTargetUpdate }) =>
      targetsApi.update(id, updates),

    onSuccess: (updatedTarget) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: queryKeys.targets.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.targets.byEmployee(updatedTarget.employee_id) });

      toast({
        title: 'تم بنجاح',
        description: 'تم تحديث الهدف بنجاح',
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

/**
 * Mutation hook to update target progress
 */
export function useUpdateTargetProgress() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, currentValue }: { id: string; currentValue: number }) =>
      targetsApi.updateProgress(id, currentValue),

    onSuccess: (updatedTarget) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.targets.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.targets.byEmployee(updatedTarget.employee_id) });

      // Show achievement message if target is achieved
      if (updatedTarget.status === 'achieved') {
        toast({
          title: '🎉 تهانينا!',
          description: 'تم تحقيق الهدف بنجاح',
        });
      } else {
        toast({
          title: 'تم بنجاح',
          description: 'تم تحديث التقدم',
        });
      }
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

/**
 * Mutation hook to delete a target
 */
export function useDeleteTarget() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => targetsApi.delete(id),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.targets.lists() });

      toast({
        title: 'تم بنجاح',
        description: 'تم حذف الهدف',
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
