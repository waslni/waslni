-- A manager password alone must never unlock manager RLS policies.
create or replace function public.current_profile_role()
returns text
language sql stable security definer
set search_path = ''
as $$
  select case
    when p.role = 'manager' and coalesce((select auth.jwt() ->> 'aal'), 'aal1') <> 'aal2'
      then 'manager_unverified'
    else p.role
  end
  from public.profiles p
  where p.id = (select auth.uid()) and p.is_active;
$$;

create or replace function public.has_permission(permission_name text)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select coalesce(
    (select
      (p.role = 'manager' and coalesce((select auth.jwt() ->> 'aal'), 'aal1') = 'aal2')
      or (p.role = 'employee' and p.permissions ->> permission_name = 'true')
     from public.profiles p
     where p.id = (select auth.uid()) and p.is_active),
    false
  );
$$;
