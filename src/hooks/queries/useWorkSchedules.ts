/**
 * React Query hooks for work schedule operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workSchedulesApi, type WorkScheduleInsert, type WorkScheduleUpdate } from '@/api/workSchedules';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { handleApiError } from '@/lib/errors';

const queryKeys = {
  all: ['workSchedules'] as const,
  list: (filters?: { employeeId?: string }) => [...queryKeys.all, 'list', filters] as const,
  byEmployee: (employeeId: string) => [...queryKeys.all, 'employee', employeeId] as const,
};

/**
 * Hook to fetch all work schedules
 */
export function useWorkSchedules(filters?: { employeeId?: string }) {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.list(filters),
    queryFn: () => workSchedulesApi.list(filters),
    enabled: !!user,
  });
}

/**
 * Hook to fetch work schedules for a specific employee
 */
export function useEmployeeWorkSchedule(employeeId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.byEmployee(employeeId!),
    queryFn: () => workSchedulesApi.getByEmployee(employeeId!),
    enabled: !!employeeId,
  });
}

/**
 * Mutation hook to create/update a work schedule
 */
export function useUpsertWorkSchedule() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (schedule: WorkScheduleInsert) => workSchedulesApi.upsert(schedule),

    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.all });

      toast({
        title: 'تم بنجاح',
        description: 'تم حفظ جدول العمل',
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
 * Mutation hook to create default schedule for an employee
 */
export function useCreateDefaultSchedule() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (employeeId: string) => workSchedulesApi.createDefaultSchedule(employeeId),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.all });

      toast({
        title: 'تم بنجاح',
        description: 'تم إنشاء جدول العمل الافتراضي',
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
 * Mutation hook to update a work schedule
 */
export function useUpdateWorkSchedule() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: WorkScheduleUpdate }) =>
      workSchedulesApi.update(id, updates),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.all });

      toast({
        title: 'تم بنجاح',
        description: 'تم تحديث جدول العمل',
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
 * Mutation hook to delete a work schedule
 */
export function useDeleteWorkSchedule() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => workSchedulesApi.delete(id),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.all });

      toast({
        title: 'تم بنجاح',
        description: 'تم حذف جدول العمل',
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
