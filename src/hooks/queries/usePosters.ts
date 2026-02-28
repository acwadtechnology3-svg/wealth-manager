/**
 * React Query hooks for marketing posters operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { postersApi, type PosterInsert } from '@/api/posters';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { handleApiError } from '@/lib/errors';

export function usePosters(filters?: {
  startDate?: string;
  endDate?: string;
}) {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.posters.list(filters),
    queryFn: () => postersApi.list(filters),
    enabled: !!user,
  });
}

export function usePoster(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.posters.detail(id!),
    queryFn: () => postersApi.getById(id!),
    enabled: !!id,
  });
}

export function useCreatePoster() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      file,
      poster,
    }: {
      file: File;
      poster: Omit<PosterInsert, 'file_url' | 'file_name' | 'file_size'>;
    }) => {
      const uploadResult = await postersApi.uploadFile(file);
      return postersApi.create({
        ...poster,
        file_url: uploadResult.path,
        file_name: uploadResult.fileName,
        file_size: uploadResult.fileSize,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.posters.lists() });
      toast({
        title: 'تم بنجاح',
        description: 'تم رفع الملصق بنجاح',
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

export function useDeletePoster() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => postersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.posters.lists() });
      toast({
        title: 'تم بنجاح',
        description: 'تم حذف الملصق',
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
