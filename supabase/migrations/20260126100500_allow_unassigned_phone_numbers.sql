-- Allow phone numbers to be created without assignment for bulk task distribution
ALTER TABLE public.phone_numbers
  ALTER COLUMN assigned_to DROP NOT NULL;
