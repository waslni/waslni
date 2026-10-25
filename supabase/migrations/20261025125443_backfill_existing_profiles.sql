-- Create customer profiles for Auth users who existed before the profile trigger.
-- Existing profiles and their roles are preserved; manager bootstrap stays explicit.
insert into public.profiles (id, email, full_name, phone, store_name, store_type, role)
select
  u.id,
  coalesce(u.email, ''),
  coalesce(u.raw_user_meta_data ->> 'full_name', ''),
  coalesce(u.raw_user_meta_data ->> 'phone', ''),
  coalesce(u.raw_user_meta_data ->> 'store_name', ''),
  coalesce(u.raw_user_meta_data ->> 'store_type', 'عام'),
  'customer'
from auth.users u
where not exists (
  select 1 from public.profiles p where p.id = u.id
)
on conflict (id) do nothing;
