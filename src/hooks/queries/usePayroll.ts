/**
 * React Query hooks for payroll operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { payrollApi, type PayrollInsert, type PayrollUpdate, type PayrollStatus } from '@/api/payroll';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { handleApiError } from '@/lib/errors';

export function usePayroll(filters?: {
  employeeId?: string;
  periodMonth?: number;
  periodYear?: number;
  status?: PayrollStatus;
}) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['payroll', 'list', filters],
    queryFn: () => payrollApi.list(filters),
    enabled: !!user,
  });
}

export function usePayrollRecord(id: string | undefined) {
  return useQuery({
    queryKey: ['payroll', 'detail', id],
    queryFn: () => payrollApi.getById(id!),
    enabled: !!id,
  });
}

export function useCreatePayroll() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payroll: PayrollInsert) => payrollApi.create(payroll),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
      toast({ title: 'تم بنجاح', description: 'تم إنشاء سجل الراتب بنجاح' });
    },
    onError: (error) => {
      toast({ title: 'خطأ', description: handleApiError(error), variant: 'destructive' });
    },
  });
}

export function useUpdatePayroll() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: PayrollUpdate }) =>
      payrollApi.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
      toast({ title: 'تم بنجاح', description: 'تم تحديث سجل الراتب بنجاح' });
    },
    onError: (error) => {
      toast({ title: 'خطأ', description: handleApiError(error), variant: 'destructive' });
    },
  });
}

export function useDeletePayroll() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => payrollApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
      toast({ title: 'تم بنجاح', description: 'تم حذف سجل الراتب بنجاح' });
    },
    onError: (error) => {
      toast({ title: 'خطأ', description: handleApiError(error), variant: 'destructive' });
    },
  });
}

export function useApprovePayroll() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (id: string) => payrollApi.approve(id, user?.id || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
      toast({ title: 'تم بنجاح', description: 'تم اعتماد سجل الراتب' });
    },
    onError: (error) => {
      toast({ title: 'خطأ', description: handleApiError(error), variant: 'destructive' });
    },
  });
}

export function useMarkPayrollAsPaid() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => payrollApi.markAsPaid(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
      toast({ title: 'تم بنجاح', description: 'تم تحديث حالة الدفع' });
    },
    onError: (error) => {
      toast({ title: 'خطأ', description: handleApiError(error), variant: 'destructive' });
    },
  });
}
