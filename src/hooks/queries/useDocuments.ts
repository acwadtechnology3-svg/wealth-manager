/**
 * React Query hooks for employee documents operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentsApi, type DocumentInsert, type DocumentUpdate, type DocumentType } from '@/api/documents';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { handleApiError } from '@/lib/errors';

export function useDocuments(filters?: {
  employeeId?: string;
  documentType?: DocumentType;
  isVerified?: boolean;
}) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['documents', 'list', filters],
    queryFn: () => documentsApi.list(filters),
    enabled: !!user,
  });
}

export function useDocument(id: string | undefined) {
  return useQuery({
    queryKey: ['documents', 'detail', id],
    queryFn: () => documentsApi.getById(id!),
    enabled: !!id,
  });
}

export function useCreateDocument() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (document: DocumentInsert) => documentsApi.create(document),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast({ title: 'تم بنجاح', description: 'تم إضافة المستند بنجاح' });
    },
    onError: (error) => {
      toast({ title: 'خطأ', description: handleApiError(error), variant: 'destructive' });
    },
  });
}

export function useUpdateDocument() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: DocumentUpdate }) =>
      documentsApi.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast({ title: 'تم بنجاح', description: 'تم تحديث المستند بنجاح' });
    },
    onError: (error) => {
      toast({ title: 'خطأ', description: handleApiError(error), variant: 'destructive' });
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => documentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast({ title: 'تم بنجاح', description: 'تم حذف المستند بنجاح' });
    },
    onError: (error) => {
      toast({ title: 'خطأ', description: handleApiError(error), variant: 'destructive' });
    },
  });
}

export function useVerifyDocument() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (id: string) => documentsApi.verify(id, user?.id || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast({ title: 'تم بنجاح', description: 'تم التحقق من المستند' });
    },
    onError: (error) => {
      toast({ title: 'خطأ', description: handleApiError(error), variant: 'destructive' });
    },
  });
}
