/**
 * React Query hooks for attendance operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceApi, type AttendanceInsert, type AttendanceUpdate } from '@/api/attendance';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { handleApiError } from '@/lib/errors';

export function useAttendance(filters?: {
  employeeId?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['attendance', 'list', filters],
    queryFn: () => attendanceApi.list(filters),
    enabled: !!user,
  });
}

export function useAttendanceRecord(id: string | undefined) {
  return useQuery({
    queryKey: ['attendance', 'detail', id],
    queryFn: () => attendanceApi.getById(id!),
    enabled: !!id,
  });
}

export function useCreateAttendance() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (attendance: AttendanceInsert) => attendanceApi.create(attendance),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast({ title: 'تم بنجاح', description: 'تم تسجيل الحضور بنجاح' });
    },
    onError: (error) => {
      toast({ title: 'خطأ', description: handleApiError(error), variant: 'destructive' });
    },
  });
}

export function useUpdateAttendance() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: AttendanceUpdate }) =>
      attendanceApi.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast({ title: 'تم بنجاح', description: 'تم تحديث الحضور بنجاح' });
    },
    onError: (error) => {
      toast({ title: 'خطأ', description: handleApiError(error), variant: 'destructive' });
    },
  });
}

export function useDeleteAttendance() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => attendanceApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast({ title: 'تم بنجاح', description: 'تم حذف السجل بنجاح' });
    },
    onError: (error) => {
      toast({ title: 'خطأ', description: handleApiError(error), variant: 'destructive' });
    },
  });
}

export function useCheckIn() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ employeeId, time }: { employeeId: string; time: string }) =>
      attendanceApi.checkIn(employeeId, time),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast({ title: 'تم بنجاح', description: 'تم تسجيل الحضور بنجاح' });
    },
    onError: (error) => {
      toast({ title: 'خطأ', description: handleApiError(error), variant: 'destructive' });
    },
  });
}

export function useCheckOut() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ employeeId, time }: { employeeId: string; time: string }) =>
      attendanceApi.checkOut(employeeId, time),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast({ title: 'تم بنجاح', description: 'تم تسجيل الانصراف بنجاح' });
    },
    onError: (error) => {
      toast({ title: 'خطأ', description: handleApiError(error), variant: 'destructive' });
    },
  });
}
