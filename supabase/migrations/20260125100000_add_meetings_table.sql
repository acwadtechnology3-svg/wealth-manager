-- Create meetings table
CREATE TABLE public.meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  meeting_date DATE NOT NULL,
  responsible_employee_id UUID REFERENCES auth.users(id) NOT NULL,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Everyone can view meetings (calendar visibility)
CREATE POLICY "Authenticated users can view meetings"
  ON public.meetings FOR SELECT
  TO authenticated
  USING (true);

-- Only secretaries and admins can create meetings
CREATE POLICY "Secretaries can create meetings"
  ON public.meetings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
      AND department = 'admin' -- Secretary role uses admin department
    )
    OR public.is_admin_or_higher(auth.uid())
  );

-- Only creator and admins can update
CREATE POLICY "Creators and admins can update meetings"
  ON public.meetings FOR UPDATE
  USING (
    created_by = auth.uid()
    OR public.is_admin_or_higher(auth.uid())
  );

-- Only admins can delete
CREATE POLICY "Admins can delete meetings"
  ON public.meetings FOR DELETE
  USING (public.is_admin_or_higher(auth.uid()));

-- Add updated_at trigger
CREATE TRIGGER update_meetings_updated_at
  BEFORE UPDATE ON public.meetings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for date queries
CREATE INDEX idx_meetings_date ON public.meetings(meeting_date);
