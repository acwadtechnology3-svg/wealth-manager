alter table public.profiles
add column if not exists full_name text
generated always as (
  btrim(coalesce(first_name, '') || ' ' || coalesce(last_name, ''))
) stored;

create index if not exists profiles_full_name_idx
  on public.profiles (full_name);
