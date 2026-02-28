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
