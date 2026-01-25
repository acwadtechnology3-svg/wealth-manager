-- Create marketing_posters table
CREATE TABLE public.marketing_posters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  poster_date DATE NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.marketing_posters ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Everyone can view posters (calendar visibility)
CREATE POLICY "Authenticated users can view posters"
  ON public.marketing_posters FOR SELECT
  TO authenticated
  USING (true);

-- Only marketing department and admins can create posters
CREATE POLICY "Marketing can upload posters"
  ON public.marketing_posters FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
      AND department IN ('admin', 'support') -- Marketing uses support department
    )
    OR public.is_admin_or_higher(auth.uid())
  );

-- Only uploader and admins can update/delete
CREATE POLICY "Uploaders and admins can update posters"
  ON public.marketing_posters FOR UPDATE
  USING (
    uploaded_by = auth.uid()
    OR public.is_admin_or_higher(auth.uid())
  );

CREATE POLICY "Uploaders and admins can delete posters"
  ON public.marketing_posters FOR DELETE
  USING (
    uploaded_by = auth.uid()
    OR public.is_admin_or_higher(auth.uid())
  );

-- Add updated_at trigger
CREATE TRIGGER update_marketing_posters_updated_at
  BEFORE UPDATE ON public.marketing_posters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for date queries
CREATE INDEX idx_marketing_posters_date ON public.marketing_posters(poster_date);

-- Create storage bucket for marketing posters
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'marketing-posters',
  'marketing-posters',
  false,
  5242880, -- 5MB limit
  array['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET name = excluded.name,
    public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- Storage policies
DROP POLICY IF EXISTS "Marketing and admins can manage poster objects" ON storage.objects;
CREATE POLICY "Marketing and admins can manage poster objects"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'marketing-posters'
  AND (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
      AND department IN ('admin', 'support')
    )
    OR public.is_admin_or_higher(auth.uid())
  )
)
WITH CHECK (
  bucket_id = 'marketing-posters'
  AND (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
      AND department IN ('admin', 'support')
    )
    OR public.is_admin_or_higher(auth.uid())
  )
);

-- Allow authenticated users to view posters
DROP POLICY IF EXISTS "Authenticated users can view poster objects" ON storage.objects;
CREATE POLICY "Authenticated users can view poster objects"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'marketing-posters');
