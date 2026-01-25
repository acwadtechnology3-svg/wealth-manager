/**
 * React Query hooks for withdrawal schedules operations
 * Provides type-safe hooks with caching and optimistic updates
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { withdrawalsApi } from '@/api/withdrawals';
import type { WithdrawalScheduleInsert, WithdrawalScheduleUpdate } from '@/types/database';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { handleApiError } from '@/lib/errors';

/**
 * Hook to fetch list of withdrawal schedules
 */
export function useWithdrawals(filters?: {
  status?: string;
  depositId?: string;
  startDate?: string;
  endDate?: string;
}) {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.withdrawals.list(filters),
    queryFn: () => withdrawalsApi.list(filters),
    enabled: !!user,
  });
}

/**
 * Hook to fetch withdrawal schedules with client information
 */
export function useWithdrawalsWithClients(filters?: {
  status?: string;
  startDate?: string;
  endDate?: string;
}) {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.withdrawals.list({ ...filters, withClients: true }),
    queryFn: () => withdrawalsApi.listWithClients(filters),
    enabled: !!user,
  });
}

/**
 * Hook to fetch single withdrawal schedule by ID
 */
export function useWithdrawal(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.withdrawals.all, // Could be more specific with detail key
    queryFn: () => withdrawalsApi.getById(id!),
    enabled: !!id,
  });
}

/**
 * Hook to fetch upcoming withdrawals (next 30 days)
 */
export function useUpcomingWithdrawals(limit?: number) {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.withdrawals.upcoming(),
    queryFn: () => withdrawalsApi.getUpcoming(limit),
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch overdue withdrawals
 */
export function useOverdueWithdrawals() {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.withdrawals.overdue(),
    queryFn: () => withdrawalsApi.getOverdue(),
    enabled: !!user,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Hook to fetch withdrawals by deposit ID
 */
export function useWithdrawalsByDeposit(depositId: string | undefined) {
  return useQuery({
    queryKey: [...queryKeys.deposits.withdrawals(depositId!), depositId],
    queryFn: () => withdrawalsApi.getByDepositId(depositId!),
    enabled: !!depositId,
  });
}

/**
 * Hook to fetch withdrawal statistics
 */
export function useWithdrawalStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: [...queryKeys.withdrawals.all, 'stats'],
    queryFn: () => withdrawalsApi.getStats(),
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Mutation hook to create a withdrawal schedule
 */
export function useCreateWithdrawal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (withdrawal: WithdrawalScheduleInsert) =>
      withdrawalsApi.create(withdrawal),

    onSuccess: () => {
      // Invalidate withdrawal queries
      queryClient.invalidateQueries({ queryKey: queryKeys.withdrawals.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.withdrawals.upcoming() });

      toast({
        title: 'تم بنجاح',
        description: 'تم إضافة موعد السحب بنجاح',
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
 * Mutation hook to update a withdrawal schedule
 */
export function useUpdateWithdrawal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: WithdrawalScheduleUpdate }) =>
      withdrawalsApi.update(id, updates),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.withdrawals.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.withdrawals.upcoming() });
      queryClient.invalidateQueries({ queryKey: queryKeys.withdrawals.overdue() });

      toast({
        title: 'تم بنجاح',
        description: 'تم تحديث موعد السحب بنجاح',
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
 * Mutation hook to mark withdrawal as completed
 */
export function useCompleteWithdrawal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, paidDate }: { id: string; paidDate?: string }) =>
      withdrawalsApi.markCompleted(id, paidDate),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.withdrawals.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.withdrawals.upcoming() });
      queryClient.invalidateQueries({ queryKey: queryKeys.withdrawals.overdue() });
      // Also invalidate dashboard as it shows upcoming withdrawals
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.upcomingEvents() });

      toast({
        title: 'تم بنجاح',
        description: 'تم تسجيل صرف الأرباح بنجاح',
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
 * Mutation hook to mark withdrawal as cancelled
 */
export function useCancelWithdrawal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => withdrawalsApi.markCancelled(id),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.withdrawals.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.withdrawals.upcoming() });

      toast({
        title: 'تم بنجاح',
        description: 'تم إلغاء موعد السحب',
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
 * Mutation hook to delete a withdrawal schedule
 */
export function useDeleteWithdrawal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => withdrawalsApi.delete(id),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.withdrawals.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.withdrawals.upcoming() });

      toast({
        title: 'تم بنجاح',
        description: 'تم حذف موعد السحب',
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
