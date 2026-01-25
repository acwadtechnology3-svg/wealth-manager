/**
 * React Query hooks for phone numbers operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { phoneNumbersApi } from '@/api/phoneNumbers';
import type { BatchInsert, PhoneNumberInsert } from '@/api/phoneNumbers';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { handleApiError } from '@/lib/errors';

export function usePhoneNumberBatches() {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.phoneNumbers.batches(),
    queryFn: () => phoneNumbersApi.listBatches(),
    enabled: !!user,
  });
}

export function usePhoneNumbersByBatch(batchId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.phoneNumbers.byBatch(batchId!),
    queryFn: () => phoneNumbersApi.getNumbersByBatch(batchId!),
    enabled: !!batchId,
  });
}

export function usePhoneNumbersByEmployee(employeeId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.phoneNumbers.byEmployee(employeeId!),
    queryFn: () => phoneNumbersApi.getNumbersByEmployee(employeeId!),
    enabled: !!employeeId,
  });
}

export function usePhoneNumberStats(employeeId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.phoneNumbers.stats(employeeId),
    queryFn: () => phoneNumbersApi.getStats(employeeId),
    enabled: !!user,
  });
}

export function useCreatePhoneNumberBatch() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      batch,
      phoneNumbers,
    }: {
      batch: BatchInsert;
      phoneNumbers: Omit<PhoneNumberInsert, 'batch_id'>[];
    }) => phoneNumbersApi.createBatchWithNumbers(batch, phoneNumbers),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.phoneNumbers.batches() });
      toast({
        title: 'تم بنجاح',
        description: 'تم رفع الأرقام بنجاح',
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

export function useUpdatePhoneNumber() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: { call_status?: string; notes?: string; called_at?: string };
    }) => phoneNumbersApi.updateNumber(id, updates),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.phoneNumbers.all });
      toast({
        title: 'تم بنجاح',
        description: 'تم تحديث الرقم بنجاح',
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

export function useDeletePhoneNumberBatch() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (batchId: string) => phoneNumbersApi.deleteBatch(batchId),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.phoneNumbers.batches() });
      toast({
        title: 'تم بنجاح',
        description: 'تم حذف المجموعة',
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
