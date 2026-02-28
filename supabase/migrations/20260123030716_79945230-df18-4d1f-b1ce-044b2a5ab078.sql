-- Fix the permissive audit_log INSERT policy by requiring authenticated user
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_log;

CREATE POLICY "Authenticated users can insert audit logs"
  ON public.audit_log FOR INSERT
  TO authenticated
  WITH CHECK (actor_user_id = auth.uid());