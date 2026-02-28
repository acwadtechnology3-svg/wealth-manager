-- Create client_calls table for logging calls
CREATE TABLE public.client_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  call_notes TEXT,
  call_status TEXT NOT NULL DEFAULT 'pending' CHECK (call_status IN ('pending', 'interested', 'not_interested', 'callback', 'closed')),
  call_duration INTEGER, -- in seconds
  called_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create employee_targets table
CREATE TABLE public.employee_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('calls', 'clients', 'deposits', 'amount')),
  target_value INTEGER NOT NULL,
  current_value INTEGER NOT NULL DEFAULT 0,
  month DATE NOT NULL, -- First day of the month for the target
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (employee_id, target_type, month)
);

-- Create team_messages table for team chat
CREATE TABLE public.team_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_group_message BOOLEAN NOT NULL DEFAULT false,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.client_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_messages ENABLE ROW LEVEL SECURITY;

-- Enable realtime for team messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_messages;

-- RLS Policies for client_calls
CREATE POLICY "Users can view their own calls"
  ON public.client_calls FOR SELECT
  USING (called_by = auth.uid());

CREATE POLICY "Admins can view all calls"
  ON public.client_calls FOR SELECT
  USING (public.is_admin_or_higher(auth.uid()));

CREATE POLICY "Users can create calls"
  ON public.client_calls FOR INSERT
  TO authenticated
  WITH CHECK (called_by = auth.uid());

CREATE POLICY "Users can update their own calls"
  ON public.client_calls FOR UPDATE
  USING (called_by = auth.uid());

CREATE POLICY "Admins can update all calls"
  ON public.client_calls FOR UPDATE
  USING (public.is_admin_or_higher(auth.uid()));

CREATE POLICY "Admins can delete calls"
  ON public.client_calls FOR DELETE
  USING (public.is_admin_or_higher(auth.uid()));

-- RLS Policies for employee_targets
CREATE POLICY "Users can view their own targets"
  ON public.employee_targets FOR SELECT
  USING (employee_id = auth.uid());

CREATE POLICY "Admins can view all targets"
  ON public.employee_targets FOR SELECT
  USING (public.is_admin_or_higher(auth.uid()));

CREATE POLICY "Admins can manage targets"
  ON public.employee_targets FOR ALL
  USING (public.is_admin_or_higher(auth.uid()));

-- RLS Policies for team_messages
CREATE POLICY "Users can view their own messages"
  ON public.team_messages FOR SELECT
  USING (sender_id = auth.uid() OR recipient_id = auth.uid() OR is_group_message = true);

CREATE POLICY "Admins can view all messages"
  ON public.team_messages FOR SELECT
  USING (public.is_admin_or_higher(auth.uid()));

CREATE POLICY "Users can send messages"
  ON public.team_messages FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update their own messages"
  ON public.team_messages FOR UPDATE
  USING (sender_id = auth.uid());

-- Triggers for updated_at
CREATE TRIGGER update_client_calls_updated_at
  BEFORE UPDATE ON public.client_calls
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employee_targets_updated_at
  BEFORE UPDATE ON public.employee_targets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();