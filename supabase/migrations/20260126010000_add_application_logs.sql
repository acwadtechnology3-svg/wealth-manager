-- Create application_logs table for storing application errors and logs
CREATE TABLE IF NOT EXISTS public.application_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  level TEXT NOT NULL CHECK (level IN ('DEBUG', 'INFO', 'WARN', 'ERROR')),
  message TEXT NOT NULL,
  context JSONB,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for querying logs by level and time
CREATE INDEX IF NOT EXISTS idx_application_logs_level_created_at
  ON public.application_logs(level, created_at DESC);

-- Add index for querying logs by user
CREATE INDEX IF NOT EXISTS idx_application_logs_user_id
  ON public.application_logs(user_id, created_at DESC);

-- Add index for querying logs by session
CREATE INDEX IF NOT EXISTS idx_application_logs_session_id
  ON public.application_logs(session_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.application_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Admins can view all logs
CREATE POLICY "Admins can view all logs"
  ON public.application_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('super_admin', 'admin')
    )
  );

-- Service role can insert logs (for application logging)
CREATE POLICY "Service can insert logs"
  ON public.application_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Add comment
COMMENT ON TABLE public.application_logs IS 'Stores application error logs and important events';
