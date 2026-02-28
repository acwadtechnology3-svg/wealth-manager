import { useQuery } from '@tanstack/react-query';
import { depositsApi } from '@/api/deposits';
import { useAuth } from '@/hooks/useAuth';

export function useAllDepositsWithClients() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['deposits', 'all-with-clients'],
    queryFn: () => depositsApi.listAllWithClients(),
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Fetch all deposits + withdrawal schedules for a single client.
 * Uses two flat queries to avoid PostgREST nested-row truncation.
 */
export function useClientDepositsWithSchedules(clientId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['deposits', 'by-client', clientId ?? ''],
    queryFn: () => depositsApi.listForClientWithSchedules(clientId!),
    enabled: !!user && !!clientId,
    staleTime: 0, // always fetch fresh for profile page
  });
}
