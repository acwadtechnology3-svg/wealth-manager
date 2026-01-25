/**
 * React Query hooks for employee commissions operations
 * Provides type-safe hooks with caching and optimistic updates
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import {
  commissionsApi,
  type EmployeeCommission,
  type CommissionInsert,
  type CommissionUpdate,
} from '@/api/commissions';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { handleApiError } from '@/lib/errors';

/**
 * Hook to fetch list of commissions
 */
export function useCommissions(filters?: {
  status?: string;
  employeeId?: string;
  periodMonth?: number;
  periodYear?: number;
}) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['commissions', 'list', filters],
    queryFn: () => commissionsApi.list(filters),
    enabled: !!user,
  });
}

/**
 * Hook to fetch single commission by ID
 */
export function useCommission(id: string | undefined) {
  return useQuery({
    queryKey: ['commissions', 'detail', id],
    queryFn: () => commissionsApi.getById(id!),
    enabled: !!id,
  });
}

/**
 * Hook to fetch commissions for a specific employee
 */
export function useEmployeeCommissions(employeeId: string | undefined) {
  return useQuery({
    queryKey: ['commissions', 'employee', employeeId],
    queryFn: () => commissionsApi.getByEmployeeId(employeeId!),
    enabled: !!employeeId,
  });
}

/**
 * Hook to fetch commissions for a specific period
 */
export function usePeriodCommissions(month: number, year: number) {
  return useQuery({
    queryKey: ['commissions', 'period', month, year],
    queryFn: () => commissionsApi.getByPeriod(month, year),
  });
}

/**
 * Hook to fetch commission statistics
 */
export function useCommissionStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['commissions', 'stats'],
    queryFn: () => commissionsApi.getStats(),
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Mutation hook to create a commission
 */
export function useCreateCommission() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (commission: CommissionInsert) => commissionsApi.create(commission),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissions'] });

      toast({
        title: 'تم بنجاح',
        description: 'تم إنشاء العمولة بنجاح',
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
 * Mutation hook to update a commission
 */
export function useUpdateCommission() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: CommissionUpdate }) =>
      commissionsApi.update(id, updates),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissions'] });

      toast({
        title: 'تم بنجاح',
        description: 'تم تحديث العمولة بنجاح',
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
 * Mutation hook to approve a commission
 */
export function useApproveCommission() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (id: string) => commissionsApi.approve(id, user?.id || ''),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissions'] });

      toast({
        title: 'تم بنجاح',
        description: 'تم اعتماد العمولة بنجاح',
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
 * Mutation hook to mark commission as paid
 */
export function useMarkCommissionAsPaid() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (id: string) => commissionsApi.markAsPaid(id, user?.id || ''),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissions'] });

      toast({
        title: 'تم بنجاح',
        description: 'تم تحديث حالة الدفع بنجاح',
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
 * Mutation hook to delete a commission
 */
export function useDeleteCommission() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => commissionsApi.delete(id),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissions'] });

      toast({
        title: 'تم بنجاح',
        description: 'تم حذف العمولة بنجاح',
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
 * Mutation hook to calculate commission
 */
export function useCalculateCommission() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      employeeId,
      month,
      year,
      commissionRate,
    }: {
      employeeId: string;
      month: number;
      year: number;
      commissionRate: number;
    }) => commissionsApi.calculateCommission(employeeId, month, year, commissionRate),

    onError: (error) => {
      toast({
        title: 'خطأ',
        description: handleApiError(error),
        variant: 'destructive',
      });
    },
  });
}
