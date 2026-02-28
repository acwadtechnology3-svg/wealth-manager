/**
 * React Query hooks for client calls operations
 * Provides type-safe hooks with caching and optimistic updates
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { callsApi } from '@/api/calls';
import type { ClientCallInsert, ClientCallUpdate } from '@/types/database';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { handleApiError } from '@/lib/errors';

/**
 * Hook to fetch list of client calls
 */
export function useCalls(filters?: {
  calledBy?: string;
  callStatus?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}) {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.calls.list(filters),
    queryFn: () => callsApi.list(filters),
    enabled: !!user,
  });
}

/**
 * Hook to fetch single call by ID
 */
export function useCall(id: string | undefined) {
  return useQuery({
    queryKey: [...queryKeys.calls.all, 'detail', id],
    queryFn: () => callsApi.getById(id!),
    enabled: !!id,
  });
}

/**
 * Hook to fetch calls by employee
 */
export function useEmployeeCalls(employeeId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.calls.byEmployee(employeeId!),
    queryFn: () => callsApi.getByEmployee(employeeId!),
    enabled: !!employeeId,
  });
}

/**
 * Hook to fetch today's calls
 */
export function useTodayCalls(employeeId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: [...queryKeys.calls.all, 'today', employeeId ?? 'all'],
    queryFn: () => callsApi.getTodayCalls(employeeId),
    enabled: !!user,
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
  });
}

/**
 * Hook to fetch call statistics
 */
export function useCallStats(employeeId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.calls.stats(employeeId),
    queryFn: () => callsApi.getStats(employeeId),
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook to fetch call statistics by date range
 */
export function useCallStatsByDateRange(
  startDate: string | undefined,
  endDate: string | undefined,
  employeeId?: string
) {
  const { user } = useAuth();

  return useQuery({
    queryKey: [...queryKeys.calls.all, 'stats-range', startDate, endDate, employeeId],
    queryFn: () => callsApi.getStatsByDateRange(startDate!, endDate!, employeeId),
    enabled: !!user && !!startDate && !!endDate,
    staleTime: 1000 * 60 * 10,
  });
}

/**
 * Mutation hook to create a call record
 */
export function useCreateCall() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (call: ClientCallInsert) => callsApi.create(call),

    onSuccess: (newCall) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: queryKeys.calls.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.calls.byEmployee(newCall.called_by) });
      queryClient.invalidateQueries({ queryKey: queryKeys.calls.stats() });

      toast({
        title: 'تم بنجاح',
        description: 'تم تسجيل المكالمة بنجاح',
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
 * Mutation hook to update a call record
 */
export function useUpdateCall() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: ClientCallUpdate }) =>
      callsApi.update(id, updates),

    onSuccess: (updatedCall) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.calls.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.calls.byEmployee(updatedCall.called_by) });

      toast({
        title: 'تم بنجاح',
        description: 'تم تحديث المكالمة بنجاح',
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
 * Mutation hook to delete a call record
 */
export function useDeleteCall() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => callsApi.delete(id),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.calls.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.calls.stats() });

      toast({
        title: 'تم بنجاح',
        description: 'تم حذف المكالمة',
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
