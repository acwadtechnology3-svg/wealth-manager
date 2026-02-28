-- Payment methods configuration table
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  method TEXT UNIQUE NOT NULL CHECK (method IN ('wallet', 'instapay', 'bank_transfer')),
  enabled BOOLEAN NOT NULL DEFAULT true,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'payment_methods'
      AND policyname = 'Authenticated users can view payment methods'
  ) THEN
    CREATE POLICY "Authenticated users can view payment methods"
      ON public.payment_methods FOR SELECT
      USING (auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'payment_methods'
      AND policyname = 'Admins can manage payment methods'
  ) THEN
    CREATE POLICY "Admins can manage payment methods"
      ON public.payment_methods FOR ALL
      USING (public.is_admin_or_higher(auth.uid()))
      WITH CHECK (public.is_admin_or_higher(auth.uid()));
  END IF;
END
$$;

DROP TRIGGER IF EXISTS update_payment_methods_updated_at ON public.payment_methods;
CREATE TRIGGER update_payment_methods_updated_at
  BEFORE UPDATE ON public.payment_methods
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.payment_methods (method, enabled, details)
VALUES
  ('wallet', true, '{}'::jsonb),
  ('instapay', true, '{}'::jsonb),
  ('bank_transfer', true, '{}'::jsonb)
ON CONFLICT (method) DO NOTHING;
