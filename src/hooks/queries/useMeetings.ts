/**
 * React Query hooks for meetings operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { meetingsApi } from '@/api/meetings';
import type { MeetingInsert, MeetingUpdate } from '@/types/database';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { handleApiError } from '@/lib/errors';

export function useMeetings(filters?: {
  startDate?: string;
  endDate?: string;
  responsibleEmployeeId?: string;
}) {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.meetings.list(filters),
    queryFn: () => meetingsApi.list(filters),
    enabled: !!user,
  });
}

export function useMeeting(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.meetings.detail(id!),
    queryFn: () => meetingsApi.getById(id!),
    enabled: !!id,
  });
}

export function useCreateMeeting() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (meeting: MeetingInsert) => meetingsApi.create(meeting),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.meetings.lists() });
      toast({
        title: 'تم بنجاح',
        description: 'تم إضافة الاجتماع بنجاح',
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

export function useUpdateMeeting() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: MeetingUpdate }) =>
      meetingsApi.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.meetings.lists() });
      toast({
        title: 'تم بنجاح',
        description: 'تم تحديث الاجتماع بنجاح',
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

export function useDeleteMeeting() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => meetingsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.meetings.lists() });
      toast({
        title: 'تم بنجاح',
        description: 'تم حذف الاجتماع',
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
