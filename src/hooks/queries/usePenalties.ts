/**
 * React Query hooks for employee penalties operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { penaltiesApi, type PenaltyInsert, type PenaltyUpdate, type PenaltyType } from '@/api/penalties';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { handleApiError } from '@/lib/errors';

export function usePenalties(filters?: {
  employeeId?: string;
  penaltyType?: PenaltyType;
  isActive?: boolean;
}) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['penalties', 'list', filters],
    queryFn: () => penaltiesApi.list(filters),
    enabled: !!user,
  });
}

export function usePenalty(id: string | undefined) {
  return useQuery({
    queryKey: ['penalties', 'detail', id],
    queryFn: () => penaltiesApi.getById(id!),
    enabled: !!id,
  });
}

export function useCreatePenalty() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (penalty: PenaltyInsert) => penaltiesApi.create(penalty),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['penalties'] });
      toast({ title: 'تم بنجاح', description: 'تم إنشاء الجزاء بنجاح' });
    },
    onError: (error) => {
      toast({ title: 'خطأ', description: handleApiError(error), variant: 'destructive' });
    },
  });
}

export function useUpdatePenalty() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: PenaltyUpdate }) =>
      penaltiesApi.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['penalties'] });
      toast({ title: 'تم بنجاح', description: 'تم تحديث الجزاء بنجاح' });
    },
    onError: (error) => {
      toast({ title: 'خطأ', description: handleApiError(error), variant: 'destructive' });
    },
  });
}

export function useDeletePenalty() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => penaltiesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['penalties'] });
      toast({ title: 'تم بنجاح', description: 'تم حذف الجزاء بنجاح' });
    },
    onError: (error) => {
      toast({ title: 'خطأ', description: handleApiError(error), variant: 'destructive' });
    },
  });
}

export function useDeactivatePenalty() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => penaltiesApi.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['penalties'] });
      toast({ title: 'تم بنجاح', description: 'تم إلغاء تفعيل الجزاء' });
    },
    onError: (error) => {
      toast({ title: 'خطأ', description: handleApiError(error), variant: 'destructive' });
    },
  });
}
