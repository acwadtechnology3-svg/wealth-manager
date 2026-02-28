-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin', 'hr_manager', 'hr_officer', 'tele_sales', 'accountant', 'support');

-- Create department enum
CREATE TYPE public.department AS ENUM ('admin', 'hr', 'tele_sales', 'finance', 'support');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  department public.department NOT NULL DEFAULT 'support',
  employee_code TEXT UNIQUE,
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Create clients table
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  national_id TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'late', 'suspended', 'inactive')),
  assigned_to UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create client_deposits table
CREATE TABLE public.client_deposits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  deposit_number TEXT UNIQUE NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  deposit_date DATE NOT NULL,
  profit_rate DECIMAL(5, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'matured', 'withdrawn')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create withdrawal_schedules table
CREATE TABLE public.withdrawal_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deposit_id UUID REFERENCES public.client_deposits(id) ON DELETE CASCADE NOT NULL,
  due_date DATE NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('completed', 'upcoming', 'overdue')),
  completed_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create audit_log table
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'view', 'login', 'logout')),
  target_table TEXT NOT NULL,
  target_id UUID,
  field_name TEXT,
  old_value TEXT,
  new_value TEXT,
  reason TEXT,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to check if user is admin or higher
CREATE OR REPLACE FUNCTION public.is_admin_or_higher(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('super_admin', 'admin')
  )
$$;

-- Create function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'super_admin'
  )
$$;

-- Create function to check if user is HR or higher
CREATE OR REPLACE FUNCTION public.is_hr_or_higher(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('super_admin', 'admin', 'hr_manager', 'hr_officer')
  )
$$;

-- Create function to check if client is assigned to user
CREATE OR REPLACE FUNCTION public.is_client_owner(_user_id UUID, _client_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.clients
    WHERE id = _client_id
      AND assigned_to = _user_id
  )
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin_or_higher(auth.uid()));

CREATE POLICY "HR can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_hr_or_higher(auth.uid()));

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (public.is_admin_or_higher(auth.uid()));

CREATE POLICY "Admins can insert profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (public.is_admin_or_higher(auth.uid()) OR auth.uid() = user_id);

CREATE POLICY "Super admins can delete profiles"
  ON public.profiles FOR DELETE
  USING (public.is_super_admin(auth.uid()));

-- RLS Policies for user_roles
CREATE POLICY "Authenticated users can view roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Super admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Admins can insert roles (not self)"
  ON public.user_roles FOR INSERT
  WITH CHECK (public.is_admin_or_higher(auth.uid()) AND user_id != auth.uid());

-- RLS Policies for clients
CREATE POLICY "Assigned users can view their clients"
  ON public.clients FOR SELECT
  USING (assigned_to = auth.uid());

CREATE POLICY "Admins can view all clients"
  ON public.clients FOR SELECT
  USING (public.is_admin_or_higher(auth.uid()));

CREATE POLICY "HR can view all clients"
  ON public.clients FOR SELECT
  USING (public.is_hr_or_higher(auth.uid()));

CREATE POLICY "Tele sales can create clients"
  ON public.clients FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'tele_sales') 
    OR public.is_admin_or_higher(auth.uid())
  );

CREATE POLICY "Assigned users can update their clients"
  ON public.clients FOR UPDATE
  USING (assigned_to = auth.uid() OR public.is_admin_or_higher(auth.uid()));

CREATE POLICY "Admins can delete clients"
  ON public.clients FOR DELETE
  USING (public.is_admin_or_higher(auth.uid()));

-- RLS Policies for client_deposits
CREATE POLICY "Users can view deposits of their clients"
  ON public.client_deposits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.clients 
      WHERE clients.id = client_deposits.client_id 
      AND clients.assigned_to = auth.uid()
    )
    OR public.is_admin_or_higher(auth.uid())
    OR public.has_role(auth.uid(), 'accountant')
  );

CREATE POLICY "Users can create deposits for their clients"
  ON public.client_deposits FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clients 
      WHERE clients.id = client_deposits.client_id 
      AND clients.assigned_to = auth.uid()
    )
    OR public.is_admin_or_higher(auth.uid())
    OR public.has_role(auth.uid(), 'accountant')
  );

CREATE POLICY "Users can update deposits of their clients"
  ON public.client_deposits FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.clients 
      WHERE clients.id = client_deposits.client_id 
      AND clients.assigned_to = auth.uid()
    )
    OR public.is_admin_or_higher(auth.uid())
    OR public.has_role(auth.uid(), 'accountant')
  );

CREATE POLICY "Admins can delete deposits"
  ON public.client_deposits FOR DELETE
  USING (public.is_admin_or_higher(auth.uid()));

-- RLS Policies for withdrawal_schedules
CREATE POLICY "Users can view withdrawal schedules of their clients"
  ON public.withdrawal_schedules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.client_deposits cd
      JOIN public.clients c ON c.id = cd.client_id
      WHERE cd.id = withdrawal_schedules.deposit_id 
      AND c.assigned_to = auth.uid()
    )
    OR public.is_admin_or_higher(auth.uid())
    OR public.has_role(auth.uid(), 'accountant')
  );

CREATE POLICY "Users can manage withdrawal schedules of their clients"
  ON public.withdrawal_schedules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.client_deposits cd
      JOIN public.clients c ON c.id = cd.client_id
      WHERE cd.id = withdrawal_schedules.deposit_id 
      AND c.assigned_to = auth.uid()
    )
    OR public.is_admin_or_higher(auth.uid())
    OR public.has_role(auth.uid(), 'accountant')
  );

-- RLS Policies for audit_log
CREATE POLICY "Admins can view audit logs"
  ON public.audit_log FOR SELECT
  USING (public.is_admin_or_higher(auth.uid()));

CREATE POLICY "System can insert audit logs"
  ON public.audit_log FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Super admins can delete audit logs"
  ON public.audit_log FOR DELETE
  USING (public.is_super_admin(auth.uid()));

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_client_deposits_updated_at
  BEFORE UPDATE ON public.client_deposits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to auto-create profile on signup
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
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for auto-creating profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Generate employee code function
CREATE OR REPLACE FUNCTION public.generate_employee_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    new_code := 'EMP' || LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0');
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE employee_code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  RETURN new_code;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Generate client code function
CREATE OR REPLACE FUNCTION public.generate_client_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    new_code := 'CLT' || LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0');
    SELECT EXISTS(SELECT 1 FROM public.clients WHERE code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  RETURN new_code;
END;
$$ LANGUAGE plpgsql SET search_path = public;