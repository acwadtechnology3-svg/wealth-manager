-- Task management columns
ALTER TABLE public.phone_numbers
  ADD COLUMN IF NOT EXISTS task_type TEXT DEFAULT 'call' CHECK (task_type IN ('call', 'follow_up', 'meeting', 'other')),
  ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Update call_status constraint
ALTER TABLE public.phone_numbers
  DROP CONSTRAINT IF EXISTS phone_numbers_call_status_check;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'phone_numbers_call_status_check'
      AND conrelid = 'public.phone_numbers'::regclass
  ) THEN
    ALTER TABLE public.phone_numbers
      ADD CONSTRAINT phone_numbers_call_status_check
      CHECK (call_status IN (
        'pending',
        'in_progress',
        'called',
        'interested',
        'not_interested',
        'callback',
        'converted',
        'completed',
        'cancelled'
      ));
  END IF;
END $$;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_phone_numbers_due_date
  ON public.phone_numbers(due_date)
  WHERE due_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_phone_numbers_assigned_to_due_date
  ON public.phone_numbers(assigned_to, due_date);

CREATE INDEX IF NOT EXISTS idx_phone_numbers_status_assigned
  ON public.phone_numbers(call_status, assigned_to);

CREATE INDEX IF NOT EXISTS idx_phone_numbers_batch_status
  ON public.phone_numbers(batch_id, call_status);
