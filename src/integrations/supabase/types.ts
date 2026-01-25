export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          created_at: string | null
          description: string | null
          is_secret: boolean | null
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          is_secret?: boolean | null
          key: string
          updated_at?: string | null
          value: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          is_secret?: boolean | null
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      attendance: {
        Row: {
          check_in: string | null
          check_out: string | null
          created_at: string
          date: string
          employee_id: string
          id: string
          notes: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          check_in?: string | null
          check_out?: string | null
          created_at?: string
          date: string
          employee_id: string
          id?: string
          notes?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          check_in?: string | null
          check_out?: string | null
          created_at?: string
          date?: string
          employee_id?: string
          id?: string
          notes?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          actor_user_id: string | null
          created_at: string
          field_name: string | null
          id: string
          ip_address: string | null
          new_value: string | null
          old_value: string | null
          reason: string | null
          target_id: string | null
          target_table: string
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          created_at?: string
          field_name?: string | null
          id?: string
          ip_address?: string | null
          new_value?: string | null
          old_value?: string | null
          reason?: string | null
          target_id?: string | null
          target_table: string
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          created_at?: string
          field_name?: string | null
          id?: string
          ip_address?: string | null
          new_value?: string | null
          old_value?: string | null
          reason?: string | null
          target_id?: string | null
          target_table?: string
        }
        Relationships: []
      }
      client_calls: {
        Row: {
          call_duration: number | null
          call_notes: string | null
          call_status: string
          called_by: string
          client_name: string
          client_phone: string
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          call_duration?: number | null
          call_notes?: string | null
          call_status?: string
          called_by: string
          client_name: string
          client_phone: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          call_duration?: number | null
          call_notes?: string | null
          call_status?: string
          called_by?: string
          client_name?: string
          client_phone?: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      client_deposits: {
        Row: {
          amount: number
          client_id: string
          created_at: string
          created_by: string | null
          deposit_date: string
          deposit_number: string
          id: string
          profit_rate: number
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          client_id: string
          created_at?: string
          created_by?: string | null
          deposit_date: string
          deposit_number: string
          id?: string
          profit_rate?: number
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          client_id?: string
          created_at?: string
          created_by?: string | null
          deposit_date?: string
          deposit_number?: string
          id?: string
          profit_rate?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_deposits_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          assigned_to: string | null
          code: string
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          name: string
          national_id: string | null
          phone: string
          status: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          code: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          name: string
          national_id?: string | null
          phone: string
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          code?: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          name?: string
          national_id?: string | null
          phone?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      employee_commissions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          commission_amount: number
          commission_rate: number
          created_at: string
          employee_id: string
          id: string
          notes: string | null
          paid_at: string | null
          paid_by: string | null
          period_month: number
          period_year: number
          status: Database["public"]["Enums"]["commission_status"]
          total_clients: number
          total_investments: number
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          commission_amount?: number
          commission_rate?: number
          created_at?: string
          employee_id: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          paid_by?: string | null
          period_month: number
          period_year: number
          status?: Database["public"]["Enums"]["commission_status"]
          total_clients?: number
          total_investments?: number
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          commission_amount?: number
          commission_rate?: number
          created_at?: string
          employee_id?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          paid_by?: string | null
          period_month?: number
          period_year?: number
          status?: Database["public"]["Enums"]["commission_status"]
          total_clients?: number
          total_investments?: number
          updated_at?: string
        }
        Relationships: []
      }
      employee_documents: {
        Row: {
          created_at: string
          description: string | null
          document_type: Database["public"]["Enums"]["document_type"]
          employee_id: string
          expiry_date: string | null
          file_name: string | null
          file_size: number | null
          file_url: string | null
          id: string
          is_verified: boolean
          title: string
          updated_at: string
          uploaded_by: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          document_type: Database["public"]["Enums"]["document_type"]
          employee_id: string
          expiry_date?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          is_verified?: boolean
          title: string
          updated_at?: string
          uploaded_by: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          document_type?: Database["public"]["Enums"]["document_type"]
          employee_id?: string
          expiry_date?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          is_verified?: boolean
          title?: string
          updated_at?: string
          uploaded_by?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      employee_penalties: {
        Row: {
          amount: number | null
          created_at: string
          description: string | null
          employee_id: string
          id: string
          is_active: boolean
          issued_by: string
          notes: string | null
          penalty_date: string
          penalty_type: Database["public"]["Enums"]["penalty_type"]
          title: string
          updated_at: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          description?: string | null
          employee_id: string
          id?: string
          is_active?: boolean
          issued_by: string
          notes?: string | null
          penalty_date: string
          penalty_type: Database["public"]["Enums"]["penalty_type"]
          title: string
          updated_at?: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          description?: string | null
          employee_id?: string
          id?: string
          is_active?: boolean
          issued_by?: string
          notes?: string | null
          penalty_date?: string
          penalty_type?: Database["public"]["Enums"]["penalty_type"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      employee_targets: {
        Row: {
          created_at: string
          created_by: string | null
          current_value: number
          employee_id: string
          id: string
          month: string
          status: string
          target_type: string
          target_value: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          current_value?: number
          employee_id: string
          id?: string
          month: string
          status?: string
          target_type: string
          target_value: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          current_value?: number
          employee_id?: string
          id?: string
          month?: string
          status?: string
          target_type?: string
          target_value?: number
          updated_at?: string
        }
        Relationships: []
      }
      leave_requests: {
        Row: {
          created_at: string
          days_count: number
          employee_id: string
          end_date: string
          id: string
          leave_type: Database["public"]["Enums"]["leave_type"]
          reason: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          start_date: string
          status: Database["public"]["Enums"]["leave_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          days_count: number
          employee_id: string
          end_date: string
          id?: string
          leave_type: Database["public"]["Enums"]["leave_type"]
          reason?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["leave_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          days_count?: number
          employee_id?: string
          end_date?: string
          id?: string
          leave_type?: Database["public"]["Enums"]["leave_type"]
          reason?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["leave_status"]
          updated_at?: string
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          created_at: string
          details: Json
          enabled: boolean
          id: string
          method: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          details?: Json
          enabled?: boolean
          id?: string
          method: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          details?: Json
          enabled?: boolean
          id?: string
          method?: string
          updated_at?: string
        }
        Relationships: []
      }
      payroll_records: {
        Row: {
          allowances: number
          base_salary: number
          bonuses: number
          commission: number
          created_at: string
          deductions: number
          employee_id: string
          id: string
          notes: string | null
          paid_at: string | null
          period_month: number
          period_year: number
          processed_at: string | null
          processed_by: string | null
          status: Database["public"]["Enums"]["payroll_status"]
          total_salary: number
          updated_at: string
        }
        Insert: {
          allowances?: number
          base_salary?: number
          bonuses?: number
          commission?: number
          created_at?: string
          deductions?: number
          employee_id: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          period_month: number
          period_year: number
          processed_at?: string | null
          processed_by?: string | null
          status?: Database["public"]["Enums"]["payroll_status"]
          total_salary?: number
          updated_at?: string
        }
        Update: {
          allowances?: number
          base_salary?: number
          bonuses?: number
          commission?: number
          created_at?: string
          deductions?: number
          employee_id?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          period_month?: number
          period_year?: number
          processed_at?: string | null
          processed_by?: string | null
          status?: Database["public"]["Enums"]["payroll_status"]
          total_salary?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          department: Database["public"]["Enums"]["department"]
          email: string
          employee_code: string | null
          first_name: string
          full_name: string | null
          id: string
          is_active: boolean
          last_name: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          department?: Database["public"]["Enums"]["department"]
          email: string
          employee_code?: string | null
          first_name: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          last_name: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          department?: Database["public"]["Enums"]["department"]
          email?: string
          employee_code?: string | null
          first_name?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          last_name?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      team_messages: {
        Row: {
          created_at: string
          id: string
          is_group_message: boolean
          is_read: boolean
          message: string
          recipient_id: string | null
          sender_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_group_message?: boolean
          is_read?: boolean
          message: string
          recipient_id?: string | null
          sender_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_group_message?: boolean
          is_read?: boolean
          message?: string
          recipient_id?: string | null
          sender_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          appearance: Json
          created_at: string
          notifications: Json
          security: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          appearance?: Json
          created_at?: string
          notifications?: Json
          security?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          appearance?: Json
          created_at?: string
          notifications?: Json
          security?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_permissions: {
        Row: {
          category: Database["public"]["Enums"]["permission_category"]
          created_at: string
          granted_by: string | null
          id: string
          permission: string
          user_id: string
        }
        Insert: {
          category: Database["public"]["Enums"]["permission_category"]
          created_at?: string
          granted_by?: string | null
          id?: string
          permission: string
          user_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["permission_category"]
          created_at?: string
          granted_by?: string | null
          id?: string
          permission?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      withdrawal_schedules: {
        Row: {
          amount: number
          completed_date: string | null
          created_at: string
          deposit_id: string
          due_date: string
          id: string
          status: string
        }
        Insert: {
          amount: number
          completed_date?: string | null
          created_at?: string
          deposit_id: string
          due_date: string
          id?: string
          status?: string
        }
        Update: {
          amount?: number
          completed_date?: string | null
          created_at?: string
          deposit_id?: string
          due_date?: string
          id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawal_schedules_deposit_id_fkey"
            columns: ["deposit_id"]
            isOneToOne: false
            referencedRelation: "client_deposits"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_client_code: { Args: never; Returns: string }
      generate_employee_code: { Args: never; Returns: string }
      has_category_access: {
        Args: {
          _category: Database["public"]["Enums"]["permission_category"]
          _user_id: string
        }
        Returns: boolean
      }
      has_permission: {
        Args: { _permission: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_or_higher: { Args: { _user_id: string }; Returns: boolean }
      is_client_owner: {
        Args: { _client_id: string; _user_id: string }
        Returns: boolean
      }
      is_hr_or_higher: { Args: { _user_id: string }; Returns: boolean }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "admin"
        | "hr_manager"
        | "hr_officer"
        | "tele_sales"
        | "accountant"
        | "support"
      commission_status: "pending" | "approved" | "paid" | "cancelled"
      department: "admin" | "hr" | "tele_sales" | "finance" | "support"
      document_type: "contract" | "id_card" | "certificate" | "resume" | "other"
      leave_status: "pending" | "approved" | "rejected" | "cancelled"
      leave_type:
        | "vacation"
        | "sick"
        | "personal"
        | "maternity"
        | "paternity"
        | "unpaid"
      payroll_status: "draft" | "approved" | "paid"
      penalty_type: "warning" | "suspension" | "fine" | "other"
      permission_category:
        | "dashboard"
        | "clients"
        | "employees"
        | "commissions"
        | "calendar"
        | "hr"
        | "reports"
        | "settings"
        | "admin"
        | "chat"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "super_admin",
        "admin",
        "hr_manager",
        "hr_officer",
        "tele_sales",
        "accountant",
        "support",
      ],
      commission_status: ["pending", "approved", "paid", "cancelled"],
      department: ["admin", "hr", "tele_sales", "finance", "support"],
      document_type: ["contract", "id_card", "certificate", "resume", "other"],
      leave_status: ["pending", "approved", "rejected", "cancelled"],
      leave_type: [
        "vacation",
        "sick",
        "personal",
        "maternity",
        "paternity",
        "unpaid",
      ],
      payroll_status: ["draft", "approved", "paid"],
      penalty_type: ["warning", "suspension", "fine", "other"],
      permission_category: [
        "dashboard",
        "clients",
        "employees",
        "commissions",
        "calendar",
        "hr",
        "reports",
        "settings",
        "admin",
        "chat",
      ],
    },
  },
} as const
