/**
 * Dashboard API - Aggregates data from multiple tables for dashboard statistics
 * Provides pure functions that interact with Supabase
 */

import { supabase } from '@/integrations/supabase/client';
import type { Client, Profile, ClientDeposit, WithdrawalSchedule } from '@/types/database';
import { ApiError } from '@/lib/errors';

export interface DashboardStats {
  totalEmployees: number;
  totalClients: number;
  totalInvestments: number;
  monthlyCommissions: number;
  lateClients: number;
  employeesChange: number;
  clientsChange: number;
  investmentsChange: number;
}

export interface MonthlyPerformance {
  newClients: number;
  newInvestments: number;
  profitsPaid: number;
  withdrawals: number;
}

export interface TopEmployee {
  id: string;
  name: string;
  email: string;
  clientsCount: number;
  totalInvestments: number;
  avatar?: string;
}

export interface UpcomingWithdrawal {
  id: string;
  clientName: string;
  amount: number;
  scheduledDate: string;
  status: string;
  depositId: string;
}

/**
 * Dashboard API functions
 */
export const dashboardApi = {
  /**
   * Get main dashboard statistics
   */
  async getStats(): Promise<DashboardStats> {
    try {
      // Fetch all data in parallel
      const [
        { data: profiles, error: profilesError },
        { data: clients, error: clientsError },
        { data: deposits, error: depositsError },
      ] = await Promise.all([
        supabase.from('profiles').select('is_active, created_at'),
        supabase.from('clients').select('status, created_at'),
        supabase.from('client_deposits').select('amount, created_at'),
      ]);

      if (profilesError) throw new ApiError(profilesError.message, profilesError.code, profilesError.details);
      if (clientsError) throw new ApiError(clientsError.message, clientsError.code, clientsError.details);
      if (depositsError) throw new ApiError(depositsError.message, depositsError.code, depositsError.details);

      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

      // Calculate statistics
      const totalEmployees = profiles?.filter(p => p.is_active).length || 0;
      const totalClients = clients?.length || 0;
      const totalInvestments = deposits?.reduce((sum, d) => sum + d.amount, 0) || 0;
      const lateClients = clients?.filter(c => c.status === 'late').length || 0;

      // Calculate changes from last month
      const employeesLastMonth = profiles?.filter(
        p => new Date(p.created_at) < lastMonth
      ).length || 0;
      const clientsLastMonth = clients?.filter(
        c => new Date(c.created_at) < lastMonth
      ).length || 0;
      const investmentsLastMonth = deposits?.filter(
        d => new Date(d.created_at) < lastMonth
      ).reduce((sum, d) => sum + d.amount, 0) || 0;

      const employeesChange = employeesLastMonth > 0
        ? Math.round(((totalEmployees - employeesLastMonth) / employeesLastMonth) * 100)
        : 0;
      const clientsChange = clientsLastMonth > 0
        ? Math.round(((totalClients - clientsLastMonth) / clientsLastMonth) * 100)
        : 0;
      const investmentsChange = investmentsLastMonth > 0
        ? Math.round(((totalInvestments - investmentsLastMonth) / investmentsLastMonth) * 100)
        : 0;

      // TODO: Calculate monthly commissions when commission table is ready
      const monthlyCommissions = 0;

      return {
        totalEmployees,
        totalClients,
        totalInvestments,
        monthlyCommissions,
        lateClients,
        employeesChange,
        clientsChange,
        investmentsChange,
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في تحميل إحصائيات لوحة التحكم', 'UNKNOWN_ERROR');
    }
  },

  /**
   * Get monthly performance summary
   */
  async getMonthlyPerformance(): Promise<MonthlyPerformance> {
    try {
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const [
        { data: clients, error: clientsError },
        { data: deposits, error: depositsError },
        { data: withdrawals, error: withdrawalsError },
      ] = await Promise.all([
        supabase
          .from('clients')
          .select('created_at')
          .gte('created_at', firstDayOfMonth),
        supabase
          .from('client_deposits')
          .select('amount, created_at')
          .gte('created_at', firstDayOfMonth),
        supabase
          .from('withdrawal_schedules')
          .select('amount, status')
          .gte('due_date', firstDayOfMonth)
          .eq('status', 'completed'),
      ]);

      if (clientsError) throw new ApiError(clientsError.message, clientsError.code, clientsError.details);
      if (depositsError) throw new ApiError(depositsError.message, depositsError.code, depositsError.details);
      if (withdrawalsError) throw new ApiError(withdrawalsError.message, withdrawalsError.code, withdrawalsError.details);

      return {
        newClients: clients?.length || 0,
        newInvestments: deposits?.reduce((sum, d) => sum + d.amount, 0) || 0,
        profitsPaid: withdrawals?.reduce((sum, w) => sum + w.amount, 0) || 0,
        withdrawals: withdrawals?.reduce((sum, w) => sum + w.amount, 0) || 0,
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في تحميل الأداء الشهري', 'UNKNOWN_ERROR');
    }
  },

  /**
   * Get top performing employees
   */
  async getTopEmployees(limit: number = 5): Promise<TopEmployee[]> {
    try {
      // Get all clients with their assigned employees
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('assigned_to, client_deposits(amount)');

      if (clientsError) throw new ApiError(clientsError.message, clientsError.code, clientsError.details);

      // Aggregate by employee
      const employeeStats = new Map<string, { clientsCount: number; totalInvestments: number }>();

      clients?.forEach((client: any) => {
        if (!client.assigned_to) return;

        const stats = employeeStats.get(client.assigned_to) || {
          clientsCount: 0,
          totalInvestments: 0,
        };

        stats.clientsCount += 1;
        stats.totalInvestments += client.client_deposits?.reduce(
          (sum: number, d: any) => sum + d.amount,
          0
        ) || 0;

        employeeStats.set(client.assigned_to, stats);
      });

      // Get employee details
      const employeeIds = Array.from(employeeStats.keys());
      if (employeeIds.length === 0) return [];

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, avatar_url')
        .in('user_id', employeeIds);

      if (profilesError) throw new ApiError(profilesError.message, profilesError.code, profilesError.details);

      // Combine and sort
      const topEmployees: TopEmployee[] = (profiles || [])
        .map(profile => {
          const stats = employeeStats.get(profile.user_id!) || {
            clientsCount: 0,
            totalInvestments: 0,
          };

          return {
            id: profile.user_id!,
            name: profile.full_name || profile.email,
            email: profile.email,
            clientsCount: stats.clientsCount,
            totalInvestments: stats.totalInvestments,
            avatar: profile.avatar_url || undefined,
          };
        })
        .sort((a, b) => b.totalInvestments - a.totalInvestments)
        .slice(0, limit);

      return topEmployees;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في تحميل بيانات أفضل الموظفين', 'UNKNOWN_ERROR');
    }
  },

  /**
   * Get recent clients
   */
  async getRecentClients(limit: number = 10): Promise<Client[]> {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw new ApiError(error.message, error.code, error.details);

      return data || [];
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في تحميل العملاء الجدد', 'UNKNOWN_ERROR');
    }
  },

  /**
   * Get upcoming withdrawal schedules
   */
  async getUpcomingWithdrawals(limit: number = 10): Promise<UpcomingWithdrawal[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      const nextMonthStr = nextMonth.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('withdrawal_schedules')
        .select(`
          id,
          amount,
          due_date,
          status,
          deposit_id,
          client_deposits!inner(
            client_id,
            clients!inner(
              name
            )
          )
        `)
        .gte('due_date', today)
        .lte('due_date', nextMonthStr)
        .eq('status', 'upcoming')
        .order('due_date', { ascending: true })
        .limit(limit);

      if (error) throw new ApiError(error.message, error.code, error.details);

      const withdrawals: UpcomingWithdrawal[] = (data || []).map((w: any) => ({
        id: w.id,
        clientName: w.client_deposits?.clients?.name || 'غير معروف',
        amount: w.amount,
        scheduledDate: w.due_date,
        status: w.status,
        depositId: w.deposit_id,
      }));

      return withdrawals;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في تحميل مواعيد السحب القادمة', 'UNKNOWN_ERROR');
    }
  },
};
