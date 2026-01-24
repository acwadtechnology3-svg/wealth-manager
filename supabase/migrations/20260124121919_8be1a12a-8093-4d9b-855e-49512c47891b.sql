-- Create permission categories enum
CREATE TYPE public.permission_category AS ENUM (
  'dashboard',
  'clients', 
  'employees',
  'commissions',
  'calendar',
  'hr',
  'reports',
  'settings',
  'admin',
  'chat'
);

-- Create user_permissions table for custom per-user permissions
CREATE TABLE public.user_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission TEXT NOT NULL,
  category permission_category NOT NULL,
  granted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, permission)
);

-- Enable RLS
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- Policies for user_permissions
CREATE POLICY "Admins can manage all permissions"
  ON public.user_permissions
  FOR ALL
  USING (is_admin_or_higher(auth.uid()));

CREATE POLICY "Users can view their own permissions"
  ON public.user_permissions
  FOR SELECT
  USING (user_id = auth.uid());

-- Create a function to check if user has a specific permission
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    -- Super admins and admins have all permissions
    is_admin_or_higher(_user_id) 
    OR 
    -- Check specific permission
    EXISTS (
      SELECT 1
      FROM public.user_permissions
      WHERE user_id = _user_id
        AND permission = _permission
    )
$$;

-- Create a function to check if user has access to a category
CREATE OR REPLACE FUNCTION public.has_category_access(_user_id uuid, _category permission_category)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    -- Super admins and admins have all access
    is_admin_or_higher(_user_id) 
    OR 
    -- Check any permission in category
    EXISTS (
      SELECT 1
      FROM public.user_permissions
      WHERE user_id = _user_id
        AND category = _category
    )
$$;