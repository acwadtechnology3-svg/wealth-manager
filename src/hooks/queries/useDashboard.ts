/**
 * React Query hooks for dashboard data
 * Provides type-safe hooks with caching for dashboard statistics
 */

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { dashboardApi } from '@/api/dashboard';
import { useAuth } from '@/hooks/useAuth';

/**
 * Hook to fetch main dashboard statistics
 * Refreshes every 5 minutes for near real-time stats
 */
export function useDashboardStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.dashboard.stats(),
    queryFn: () => dashboardApi.getStats(),
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60 * 5, // Auto-refetch every 5 minutes
  });
}

/**
 * Hook to fetch monthly performance summary
 */
export function useMonthlyPerformance() {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.dashboard.performanceChart(),
    queryFn: () => dashboardApi.getMonthlyPerformance(),
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook to fetch top performing employees
 */
export function useTopEmployees(limit: number = 5) {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.dashboard.topEmployees(),
    queryFn: () => dashboardApi.getTopEmployees(limit),
    enabled: !!user,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Hook to fetch recent clients
 */
export function useRecentClients(limit: number = 10) {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.dashboard.recentClients(),
    queryFn: () => dashboardApi.getRecentClients(limit),
    enabled: !!user,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Hook to fetch upcoming withdrawal schedules
 */
export function useUpcomingWithdrawals(limit: number = 10) {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.dashboard.upcomingEvents(),
    queryFn: () => dashboardApi.getUpcomingWithdrawals(limit),
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });
}
