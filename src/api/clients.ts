/**
 * Clients API - Handles all client-related database operations
 * Provides pure functions that interact with Supabase
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  Client,
  ClientInsert,
  ClientUpdate,
  ClientWithDeposits,
  ClientFullDetails,
  ClientFilters,
} from '@/types/database';
import { ApiError } from '@/lib/errors';

/**
 * Fetch list of clients with optional filters
 */
export const clientsApi = {
  /**
   * List clients with filtering, sorting, and pagination
   */
  async list(filters?: ClientFilters): Promise<Client[]> {
    try {
      let query = supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

      // Apply filters
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters?.assigned_to) {
        query = query.eq('assigned_to', filters.assigned_to);
      }

      if (filters?.search) {
        // Search across multiple fields
        query = query.or(
          `name.ilike.%${filters.search}%,code.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
        );
      }

      const { data, error } = await query;

      if (error) throw new ApiError(error);

      return data || [];
    } catch (error) {
      throw new ApiError(error);
    }
  },

  /**
   * Get single client by ID
   */
  async getById(id: string): Promise<Client> {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw new ApiError(error);
      if (!data) throw new Error('Client not found');

      return data;
    } catch (error) {
      throw new ApiError(error);
    }
  },

  /**
   * Get client with deposits
   */
  async getByIdWithDeposits(id: string): Promise<ClientWithDeposits> {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select(
          `
          *,
          client_deposits (*)
        `
        )
        .eq('id', id)
        .single();

      if (error) throw new ApiError(error);
      if (!data) throw new Error('Client not found');

      return data as ClientWithDeposits;
    } catch (error) {
      throw new ApiError(error);
    }
  },

  /**
   * Get client with full details (deposits and withdrawal schedules)
   */
  async getFullDetails(id: string): Promise<ClientFullDetails> {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select(
          `
          *,
          client_deposits (
            *,
            withdrawal_schedules (*)
          )
        `
        )
        .eq('id', id)
        .single();

      if (error) throw new ApiError(error);
      if (!data) throw new Error('Client not found');

      return data as ClientFullDetails;
    } catch (error) {
      throw new ApiError(error);
    }
  },

  /**
   * Create new client
   */
  async create(client: ClientInsert): Promise<Client> {
    try {
      // Generate client code if not provided
      let clientData = { ...client };

      if (!clientData.code) {
        // Call Supabase function to generate client code
        const { data: codeData, error: codeError } = await supabase.rpc(
          'generate_client_code'
        );

        if (codeError) throw new ApiError(codeError);
        clientData.code = codeData;
      }

      const { data, error } = await supabase
        .from('clients')
        .insert(clientData)
        .select()
        .single();

      if (error) throw new ApiError(error);
      if (!data) throw new Error('Failed to create client');

      return data;
    } catch (error) {
      throw new ApiError(error);
    }
  },

  /**
   * Update existing client
   */
  async update(id: string, updates: ClientUpdate): Promise<Client> {
    try {
      const { data, error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw new ApiError(error);
      if (!data) throw new Error('Failed to update client');

      return data;
    } catch (error) {
      throw new ApiError(error);
    }
  },

  /**
   * Delete client
   */
  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase.from('clients').delete().eq('id', id);

      if (error) throw new ApiError(error);
    } catch (error) {
      throw new ApiError(error);
    }
  },

  /**
   * List all clients with their deposits (for selection dialogs)
   */
  async listWithDeposits(): Promise<ClientWithDeposits[]> {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select(`
          *,
          client_deposits (*)
        `)
        .eq('status', 'active')
        .order('name', { ascending: true });

      if (error) throw new ApiError(error);

      return (data || []) as ClientWithDeposits[];
    } catch (error) {
      throw new ApiError(error);
    }
  },

  /**
   * Get client statistics
   */
  async getStats(): Promise<{
    total: number;
    active: number;
    late: number;
    suspended: number;
    inactive: number;
  }> {
    try {
      const { data, error } = await supabase.from('clients').select('status');

      if (error) throw new ApiError(error);

      const stats = {
        total: data?.length || 0,
        active: data?.filter((c) => c.status === 'active').length || 0,
        late: data?.filter((c) => c.status === 'late').length || 0,
        suspended: data?.filter((c) => c.status === 'suspended').length || 0,
        inactive: data?.filter((c) => c.status === 'inactive').length || 0,
      };

      return stats;
    } catch (error) {
      throw new ApiError(error);
    }
  },

  /**
   * Get clients assigned to a specific employee
   */
  async getByEmployee(employeeId: string): Promise<Client[]> {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('assigned_to', employeeId)
        .order('created_at', { ascending: false });

      if (error) throw new ApiError(error);

      return data || [];
    } catch (error) {
      throw new ApiError(error);
    }
  },

  /**
   * Create client with initial deposit and withdrawal schedules
   * This is a composite operation that creates:
   * 1. Client record
   * 2. Initial deposit record
   * 3. Withdrawal schedules based on investment duration
   */
  async createWithDeposit(params: {
    client: Omit<ClientInsert, 'code'>;
    deposit: {
      amount: number;
      profitRate: number;
      depositDate: string;
      depositNumber?: string;
    };
    investment: {
      duration: number; // months
      commissionRate: number;
    };
  }): Promise<ClientWithDeposits> {
    try {
      // 1. Create client first
      const newClient = await this.create(params.client);

      // 2. Generate deposit number if not provided (add random suffix to avoid unique constraint collisions)
      const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
      const depositNumber = params.deposit.depositNumber || `DEP-${Date.now()}-${randomSuffix}`;

      // 3. Create deposit
      const { data: depositData, error: depositError } = await supabase
        .from('client_deposits')
        .insert({
          client_id: newClient.id,
          amount: params.deposit.amount,
          profit_rate: params.deposit.profitRate,
          deposit_date: params.deposit.depositDate,
          deposit_number: depositNumber,
          status: 'active',
        })
        .select()
        .single();

      if (depositError) throw new ApiError(depositError);
      if (!depositData) throw new Error('Failed to create deposit');

      // 4. Create withdrawal schedules
      const monthlyProfit = (params.deposit.amount * params.deposit.profitRate) / 100;
      const schedules = [];

      for (let i = 1; i <= params.investment.duration; i++) {
        const scheduledDate = new Date(params.deposit.depositDate);
        scheduledDate.setMonth(scheduledDate.getMonth() + i);

        schedules.push({
          deposit_id: depositData.id,
          due_date: scheduledDate.toISOString().split('T')[0],
          amount: monthlyProfit,
          status: 'upcoming',
        });
      }

      const { error: schedulesError } = await supabase
        .from('withdrawal_schedules')
        .insert(schedules);

      if (schedulesError) throw new ApiError(schedulesError);

      // 5. Return client with deposits
      return await this.getByIdWithDeposits(newClient.id);
    } catch (error) {
      throw new ApiError(error);
    }
  },
};
