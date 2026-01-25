-- Create phone_number_batches table to track uploads
CREATE TABLE public.phone_number_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  assignment_mode TEXT NOT NULL CHECK (assignment_mode IN ('cold_calling', 'targeted')),
  uploaded_by UUID REFERENCES auth.users(id) NOT NULL,
  total_numbers INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create phone_numbers table for individual numbers
CREATE TABLE public.phone_numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID REFERENCES public.phone_number_batches(id) ON DELETE CASCADE NOT NULL,
  phone_number TEXT NOT NULL,
  assigned_to UUID REFERENCES auth.users(id) NOT NULL,
  assigned_employee_name TEXT, -- Store employee name from file
  call_status TEXT DEFAULT 'pending' CHECK (call_status IN ('pending', 'called', 'interested', 'not_interested', 'callback', 'converted')),
  notes TEXT,
  called_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.phone_number_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phone_numbers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for phone_number_batches
CREATE POLICY "Admins can manage batches"
  ON public.phone_number_batches FOR ALL
  USING (public.is_admin_or_higher(auth.uid()));

CREATE POLICY "Telesales can view batches"
  ON public.phone_number_batches FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'tele_sales')
    OR public.is_admin_or_higher(auth.uid())
  );

-- RLS Policies for phone_numbers
CREATE POLICY "Admins can manage phone numbers"
  ON public.phone_numbers FOR ALL
  USING (public.is_admin_or_higher(auth.uid()));

CREATE POLICY "Telesales can view their assigned numbers"
  ON public.phone_numbers FOR SELECT
  USING (
    assigned_to = auth.uid()
    OR public.is_admin_or_higher(auth.uid())
  );

CREATE POLICY "Telesales can update their assigned numbers"
  ON public.phone_numbers FOR UPDATE
  USING (assigned_to = auth.uid())
  WITH CHECK (assigned_to = auth.uid());

-- Add updated_at trigger
CREATE TRIGGER update_phone_numbers_updated_at
  BEFORE UPDATE ON public.phone_numbers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes
CREATE INDEX idx_phone_numbers_batch ON public.phone_numbers(batch_id);
CREATE INDEX idx_phone_numbers_assigned_to ON public.phone_numbers(assigned_to);
CREATE INDEX idx_phone_numbers_status ON public.phone_numbers(call_status);
