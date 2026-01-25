/**
 * React Query hooks for leave requests operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leavesApi, type LeaveRequestInsert, type LeaveRequestUpdate, type LeaveStatus, type LeaveType } from '@/api/leaves';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { handleApiError } from '@/lib/errors';

export function useLeaves(filters?: {
  employeeId?: string;
  status?: LeaveStatus;
  leaveType?: LeaveType;
}) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['leaves', 'list', filters],
    queryFn: () => leavesApi.list(filters),
    enabled: !!user,
  });
}

export function useLeave(id: string | undefined) {
  return useQuery({
    queryKey: ['leaves', 'detail', id],
    queryFn: () => leavesApi.getById(id!),
    enabled: !!id,
  });
}

export function useCreateLeave() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (leave: LeaveRequestInsert) => leavesApi.create(leave),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      toast({ title: 'تم بنجاح', description: 'تم إنشاء طلب الإجازة بنجاح' });
    },
    onError: (error) => {
      toast({ title: 'خطأ', description: handleApiError(error), variant: 'destructive' });
    },
  });
}

export function useUpdateLeave() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: LeaveRequestUpdate }) =>
      leavesApi.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      toast({ title: 'تم بنجاح', description: 'تم تحديث طلب الإجازة بنجاح' });
    },
    onError: (error) => {
      toast({ title: 'خطأ', description: handleApiError(error), variant: 'destructive' });
    },
  });
}

export function useDeleteLeave() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => leavesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      toast({ title: 'تم بنجاح', description: 'تم حذف طلب الإجازة بنجاح' });
    },
    onError: (error) => {
      toast({ title: 'خطأ', description: handleApiError(error), variant: 'destructive' });
    },
  });
}

export function useApproveLeave() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      leavesApi.approve(id, user?.id || '', notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      toast({ title: 'تم بنجاح', description: 'تم اعتماد طلب الإجازة' });
    },
    onError: (error) => {
      toast({ title: 'خطأ', description: handleApiError(error), variant: 'destructive' });
    },
  });
}

export function useRejectLeave() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      leavesApi.reject(id, user?.id || '', notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      toast({ title: 'تم بنجاح', description: 'تم رفض طلب الإجازة' });
    },
    onError: (error) => {
      toast({ title: 'خطأ', description: handleApiError(error), variant: 'destructive' });
    },
  });
}
