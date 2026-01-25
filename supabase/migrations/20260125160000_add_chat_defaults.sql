-- Allow users with chat permission to view profiles for chat
CREATE POLICY "Chat users can view profiles"
  ON public.profiles FOR SELECT
  USING (public.has_permission(auth.uid(), 'view_chat'));

-- Update new user handler to grant default chat permissions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, first_name, last_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'New'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', 'User'),
    NEW.email
  );

  INSERT INTO public.user_permissions (user_id, permission, category)
  VALUES
    (NEW.id, 'view_chat', 'chat'),
    (NEW.id, 'send_messages', 'chat')
  ON CONFLICT (user_id, permission) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Backfill chat permissions for existing users
INSERT INTO public.user_permissions (user_id, permission, category)
SELECT id, 'view_chat', 'chat'
FROM auth.users
WHERE deleted_at IS NULL
ON CONFLICT (user_id, permission) DO NOTHING;

INSERT INTO public.user_permissions (user_id, permission, category)
SELECT id, 'send_messages', 'chat'
FROM auth.users
WHERE deleted_at IS NULL
ON CONFLICT (user_id, permission) DO NOTHING;
