insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'employee-documents',
  'employee-documents',
  false,
  10485760,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png'
  ]
)
on conflict (id) do update
set name = excluded.name,
    public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "HR and admins can read document bucket" on storage.buckets;
create policy "HR and admins can read document bucket"
on storage.buckets
for select
to authenticated
using (
  id = 'employee-documents'
  and (public.is_hr_or_higher(auth.uid()) or public.is_admin_or_higher(auth.uid()))
);

drop policy if exists "HR and admins can manage document objects" on storage.objects;
create policy "HR and admins can manage document objects"
on storage.objects
for all
to authenticated
using (
  bucket_id = 'employee-documents'
  and (public.is_hr_or_higher(auth.uid()) or public.is_admin_or_higher(auth.uid()))
)
with check (
  bucket_id = 'employee-documents'
  and (public.is_hr_or_higher(auth.uid()) or public.is_admin_or_higher(auth.uid()))
);
