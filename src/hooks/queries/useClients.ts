/**
 * React Query hooks for client operations
 * Provides type-safe hooks with caching, optimistic updates, and error handling
 */

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { clientsApi } from '@/api/clients';
import type {
  Client,
  ClientInsert,
  ClientUpdate,
  ClientWithDeposits,
  ClientFullDetails,
  ClientFilters,
} from '@/types/database';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { handleApiError } from '@/lib/errors';

/**
 * Hook to fetch list of clients with optional filters
 */
export function useClients(filters?: ClientFilters) {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.clients.list(filters),
    queryFn: () => clientsApi.list(filters),
    enabled: !!user, // Only fetch when authenticated
    placeholderData: keepPreviousData, // Keep showing old data while fetching new (prevents page flash on search)
  });
}

/**
 * Hook to fetch single client by ID
 */
export function useClient(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.clients.detail(id!),
    queryFn: () => clientsApi.getById(id!),
    enabled: !!id,
  });
}

/**
 * Hook to fetch client with deposits
 */
export function useClientWithDeposits(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.clients.deposits(id!),
    queryFn: () => clientsApi.getByIdWithDeposits(id!),
    enabled: !!id,
  });
}

/**
 * Hook to fetch client with full details (deposits + withdrawal schedules)
 */
export function useClientFullDetails(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.clients.detail(id!),
    queryFn: () => clientsApi.getFullDetails(id!),
    enabled: !!id,
  });
}

/**
 * Hook to fetch client statistics
 */
export function useClientStats() {
  return useQuery({
    queryKey: queryKeys.clients.stats(),
    queryFn: () => clientsApi.getStats(),
  });
}

/**
 * Hook to fetch all clients with their deposits (for selection dialogs)
 */
export function useClientsWithDeposits() {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.clients.listWithDeposits(),
    queryFn: () => clientsApi.listWithDeposits(),
    enabled: !!user,
  });
}

/**
 * Hook to fetch clients by employee
 */
export function useClientsByEmployee(employeeId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.clients.list({ assigned_to: employeeId }),
    queryFn: () => clientsApi.getByEmployee(employeeId!),
    enabled: !!employeeId,
  });
}

/**
 * Mutation hook to create a new client
 */
export function useCreateClient() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (client: ClientInsert) => clientsApi.create(client),

    onSuccess: (newClient) => {
      // Invalidate all client list queries
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.lists() });

      // Invalidate stats
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.stats() });

      toast({
        title: 'تم بنجاح',
        description: `تم إضافة العميل ${newClient.name} بنجاح`,
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
 * Mutation hook to create a client with initial deposit and schedules
 */
export function useCreateClientWithDeposit() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (params: {
      client: Omit<ClientInsert, 'code'>;
      deposit: {
        amount: number;
        profitRate: number;
        depositDate: string;
        depositNumber?: string;
      };
      investment: {
        duration: number;
        commissionRate: number;
      };
    }) => clientsApi.createWithDeposit(params),

    onSuccess: (newClient) => {
      // Invalidate all client list queries
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.lists() });

      // Invalidate stats
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.stats() });

      toast({
        title: 'تم بنجاح',
        description: `تم إضافة العميل ${newClient.name} وتسجيل إيداعه بنجاح`,
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
 * Mutation hook to update a client with optimistic updates
 */
export function useUpdateClient() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: ClientUpdate }) =>
      clientsApi.update(id, updates),

    // Optimistic update
    onMutate: async ({ id, updates }) => {
      // Cancel outgoing refetches to avoid race conditions
      await queryClient.cancelQueries({ queryKey: queryKeys.clients.detail(id) });

      // Snapshot previous value for rollback
      const previousClient = queryClient.getQueryData<Client>(
        queryKeys.clients.detail(id)
      );

      // Optimistically update cache
      if (previousClient) {
        queryClient.setQueryData(queryKeys.clients.detail(id), {
          ...previousClient,
          ...updates,
        });
      }

      return { previousClient };
    },

    onError: (error, { id }, context) => {
      // Rollback on error
      if (context?.previousClient) {
        queryClient.setQueryData(
          queryKeys.clients.detail(id),
          context.previousClient
        );
      }

      toast({
        title: 'خطأ',
        description: handleApiError(error),
        variant: 'destructive',
      });
    },

    onSettled: (data, error, { id }) => {
      // Always refetch after error or success to ensure data consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.stats() });
    },

    onSuccess: (updatedClient) => {
      toast({
        title: 'تم بنجاح',
        description: `تم تحديث بيانات العميل ${updatedClient.name}`,
      });
    },
  });
}

/**
 * Mutation hook to delete a client
 */
export function useDeleteClient() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => clientsApi.delete(id),

    onSuccess: () => {
      // Invalidate list and stats queries
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.stats() });

      toast({
        title: 'تم بنجاح',
        description: 'تم حذف العميل بنجاح',
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
