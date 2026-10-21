-- Waslni production schema for Supabase (PostgreSQL).
-- Run only after the application has been switched to Supabase Auth and this schema.

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null default '',
  phone text not null default '',
  store_name text not null default '',
  store_type text not null default 'عام',
  role text not null default 'customer' check (role in ('customer', 'employee', 'manager')),
  permissions jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists profiles_phone_unique
  on public.profiles (phone) where phone <> '';

create table if not exists public.packages (
  id text primary key,
  name text not null,
  subtitle text not null default '',
  price numeric(10, 2) not null check (price >= 0),
  original_price numeric(10, 2),
  period text not null default 'لكل باقة',
  badge text not null default '',
  popular boolean not null default false,
  features jsonb not null default '[]'::jsonb,
  terms text not null default '',
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_id uuid not null references public.profiles(id) on delete restrict,
  customer_name text not null default '',
  customer_phone text not null default '',
  store_name text not null default '',
  store_type text not null default '',
  package_id text not null references public.packages(id) on delete restrict,
  package_name text not null,
  original_amount numeric(10, 2) not null default 0 check (original_amount >= 0),
  amount numeric(10, 2) not null check (amount >= 0),
  discount_code text,
  discount_amount numeric(10, 2) not null default 0 check (discount_amount >= 0),
  notes text not null default '',
  details jsonb not null default '{}'::jsonb,
  status text not null default 'pending_payment' check (status in (
    'pending_payment', 'transferred', 'approved_by_manager', 'in_progress', 'completed', 'cancelled'
  )),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'paid_verified')),
  receipt_sent_to_telegram boolean not null default false,
  receipt_submitted_at timestamptz,
  transferred_by text,
  transferred_at timestamptz,
  manager_approved_at timestamptz,
  cancelled_at timestamptz,
  cancelled_by text,
  delivery_timeline text not null default 'خلال 24-48 ساعة',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_customer_created_idx on public.orders (customer_id, created_at desc);
create index if not exists orders_status_created_idx on public.orders (status, created_at desc);

create table if not exists public.order_quota_grants (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete cascade,
  amount integer not null check (amount between 1 and 10),
  granted_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours')
);
create index if not exists order_quota_grants_customer_expiry_idx
  on public.order_quota_grants (customer_id, expires_at desc);

create table if not exists public.discount_codes (
  code text primary key,
  type text not null default 'percentage' check (type in ('percentage', 'fixed')),
  value numeric(10, 2) not null check (value >= 0),
  description text not null default '',
  active boolean not null default true,
  uses_count integer not null default 0 check (uses_count >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.category_visibility (
  category_id text primary key,
  is_visible boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.portfolio (
  id text primary key,
  category text not null,
  category_name text not null,
  title text not null,
  client_type text not null default '',
  deliverable_type text not null default '',
  media_type text not null default 'image' check (media_type in ('image', 'video')),
  media_url text not null,
  thumbnail_url text not null default '',
  highlight text not null default '',
  copy_sample text not null default '',
  is_visible boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.platform_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.platform_settings (key, value) values
  ('maintenance', '{"enabled": false, "message": "الموقع تحت الصيانة مؤقتًا", "estimatedReturn": "قريبًا"}'::jsonb),
  ('public', '{"whatsappNumber": "", "storeName": "وصلني | Waslni", "slogan": "خدماتك الرقمية في مكان واحد", "bankName": "", "ibanNumber": "", "accountHolder": ""}'::jsonb)
on conflict (key) do nothing;

create or replace function public.current_profile_role()
returns text
language sql stable security definer
set search_path = ''
as $$
  select p.role from public.profiles p where p.id = (select auth.uid()) and p.is_active;
$$;

create or replace function public.has_permission(permission_name text)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select coalesce(
    (select p.role = 'manager' or (p.role = 'employee' and p.permissions ->> permission_name = 'true')
     from public.profiles p where p.id = (select auth.uid()) and p.is_active),
    false
  );
$$;

create or replace function public.grant_customer_order_attempts(target_customer uuid, grant_count integer default 3)
returns public.order_quota_grants
language plpgsql security definer
set search_path = ''
as $$
declare
  result public.order_quota_grants;
begin
  if not public.has_permission('customers.manage') then
    raise exception 'لا تملك صلاحية منح محاولات طلب إضافية';
  end if;
  if not exists (select 1 from public.profiles p where p.id = target_customer and p.role = 'customer' and p.is_active) then
    raise exception 'العميل غير موجود';
  end if;
  insert into public.order_quota_grants (customer_id, amount, granted_by, expires_at)
  values (target_customer, greatest(1, least(coalesce(grant_count, 3), 10)), (select auth.uid()), now() + interval '24 hours')
  returning * into result;
  return result;
end;
$$;

create or replace function public.create_customer_profile()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, phone, store_name, store_type, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'phone', ''),
    coalesce(new.raw_user_meta_data ->> 'store_name', ''),
    coalesce(new.raw_user_meta_data ->> 'store_type', 'عام'),
    'customer'
  ) on conflict (id) do nothing;
  return new;
end;
$$;

create or replace function public.guard_customer_signup_during_maintenance()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  maintenance_enabled boolean;
  request_role text;
begin
  select coalesce((s.value ->> 'enabled')::boolean, false)
    into maintenance_enabled
  from public.platform_settings s where s.key = 'maintenance';
  request_role := coalesce(current_setting('request.jwt.claim.role', true), '');
  if maintenance_enabled and request_role <> 'service_role' then
    raise exception 'إنشاء الحسابات متوقف أثناء الصيانة';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_waslni_signup_during_maintenance on auth.users;
create trigger guard_waslni_signup_during_maintenance
  before insert on auth.users
  for each row execute function public.guard_customer_signup_during_maintenance();

drop trigger if exists on_auth_user_created_waslni on auth.users;
create trigger on_auth_user_created_waslni
  after insert on auth.users
  for each row execute function public.create_customer_profile();

create or replace function public.prevent_profile_privilege_escalation()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) = old.id and public.current_profile_role() <> 'manager' then
    if new.role is distinct from old.role or new.permissions is distinct from old.permissions or new.is_active is distinct from old.is_active then
      raise exception 'Role and permissions can only be changed by a manager';
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists protect_profile_privileges on public.profiles;
create trigger protect_profile_privileges before update on public.profiles
  for each row execute function public.prevent_profile_privilege_escalation();

create or replace function public.enforce_daily_customer_order_limit()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  actor_role text;
  daily_count integer;
  extra_attempts integer;
  package_price numeric(10, 2);
  resolved_package_name text;
  discount_type text;
  discount_value numeric(10, 2);
  expected_discount numeric(10, 2) := 0;
begin
  select p.role into actor_role from public.profiles p where p.id = new.customer_id and p.is_active;
  if actor_role = 'customer' then
    select p.price, p.name into package_price, resolved_package_name
      from public.packages p where p.id = new.package_id and p.active;
    if package_price is null then raise exception 'الباقة غير متاحة حاليًا'; end if;
    if new.discount_code is not null and new.discount_code <> '' then
      select d.type, d.value into discount_type, discount_value
        from public.discount_codes d where d.code = upper(new.discount_code) and d.active;
      if discount_type is null then raise exception 'كود الخصم غير صالح'; end if;
      expected_discount := case
        when discount_type = 'percentage' then round(package_price * discount_value / 100)
        else discount_value
      end;
      expected_discount := least(expected_discount, package_price);
    end if;
    if abs(coalesce(new.amount, 0) - (package_price - expected_discount)) > 0.01 then
      raise exception 'قيمة الطلب غير مطابقة لسعر الباقة';
    end if;
    new.package_name := resolved_package_name;
    new.original_amount := package_price;
    new.discount_amount := expected_discount;
    -- Serialize quota checks per customer so parallel submissions cannot exceed the limit.
    perform pg_advisory_xact_lock(hashtextextended(new.customer_id::text, 0));
    select count(*) into daily_count
    from public.orders o
    where o.customer_id = new.customer_id
      and o.created_at >= now() - interval '24 hours';
    select coalesce(sum(g.amount), 0) into extra_attempts
    from public.order_quota_grants g
    where g.customer_id = new.customer_id and g.expires_at > now();
    if daily_count >= 3 + extra_attempts then
      raise exception 'تم استنفاد الحد اليومي للطلبات';
    end if;
    new.status := 'pending_payment';
    new.payment_status := 'unpaid';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists enforce_daily_customer_order_limit on public.orders;
create trigger enforce_daily_customer_order_limit before insert on public.orders
  for each row execute function public.enforce_daily_customer_order_limit();

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists packages_touch_updated_at on public.packages;
create trigger packages_touch_updated_at before update on public.packages
  for each row execute function public.touch_updated_at();
drop trigger if exists orders_touch_updated_at on public.orders;
create trigger orders_touch_updated_at before update on public.orders
  for each row execute function public.touch_updated_at();
drop trigger if exists settings_touch_updated_at on public.platform_settings;
create trigger settings_touch_updated_at before update on public.platform_settings
  for each row execute function public.touch_updated_at();

alter table public.profiles enable row level security;
alter table public.packages enable row level security;
alter table public.orders enable row level security;
alter table public.order_quota_grants enable row level security;
alter table public.discount_codes enable row level security;
alter table public.category_visibility enable row level security;
alter table public.portfolio enable row level security;
alter table public.platform_settings enable row level security;

drop policy if exists "profiles_read_self_or_authorized_staff" on public.profiles;
create policy "profiles_read_self_or_authorized_staff" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or public.has_permission('customers.view'));
drop policy if exists "profiles_update_self_or_manager" on public.profiles;
create policy "profiles_update_self_or_manager" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()) or public.current_profile_role() = 'manager')
  with check (id = (select auth.uid()) or public.current_profile_role() = 'manager');
drop policy if exists "profiles_delete_manager_only" on public.profiles;
create policy "profiles_delete_manager_only" on public.profiles
  for delete to authenticated using (public.current_profile_role() = 'manager');

drop policy if exists "packages_public_read" on public.packages;
create policy "packages_public_read" on public.packages
  for select to anon, authenticated using (active or public.has_permission('packages.manage'));
drop policy if exists "packages_staff_manage" on public.packages;
create policy "packages_staff_manage" on public.packages
  for all to authenticated using (public.has_permission('packages.manage'))
  with check (public.has_permission('packages.manage'));

drop policy if exists "orders_customer_or_staff_read" on public.orders;
create policy "orders_customer_or_staff_read" on public.orders
  for select to authenticated
  using (customer_id = (select auth.uid()) or public.has_permission('orders.view'));
drop policy if exists "orders_customer_create_own" on public.orders;
create policy "orders_customer_create_own" on public.orders
  for insert to authenticated
  with check (customer_id = (select auth.uid()) and public.current_profile_role() = 'customer');
drop policy if exists "orders_staff_update" on public.orders;
create policy "orders_staff_update" on public.orders
  for update to authenticated using (public.has_permission('orders.update'))
  with check (public.has_permission('orders.update'));
drop policy if exists "orders_manager_delete" on public.orders;
create policy "orders_manager_delete" on public.orders
  for delete to authenticated using (public.current_profile_role() = 'manager');

drop policy if exists "settings_public_read" on public.platform_settings;
create policy "settings_public_read" on public.platform_settings
  for select to anon, authenticated using (key = 'public' or key = 'maintenance' or public.current_profile_role() = 'manager');
drop policy if exists "settings_manager_manage" on public.platform_settings;
create policy "settings_manager_manage" on public.platform_settings
  for all to authenticated using (public.current_profile_role() = 'manager')
  with check (public.current_profile_role() = 'manager');

drop policy if exists "quota_customer_or_staff_read" on public.order_quota_grants;
create policy "quota_customer_or_staff_read" on public.order_quota_grants
  for select to authenticated
  using (customer_id = (select auth.uid()) or public.has_permission('customers.view') or public.has_permission('customers.manage'));

drop policy if exists "discounts_public_read_active" on public.discount_codes;
create policy "discounts_public_read_active" on public.discount_codes
  for select to anon, authenticated using (active or public.has_permission('discounts.manage'));
drop policy if exists "discounts_staff_manage" on public.discount_codes;
create policy "discounts_staff_manage" on public.discount_codes
  for all to authenticated using (public.has_permission('discounts.manage'))
  with check (public.has_permission('discounts.manage'));

drop policy if exists "category_visibility_public_read" on public.category_visibility;
create policy "category_visibility_public_read" on public.category_visibility
  for select to anon, authenticated using (true);
drop policy if exists "category_visibility_staff_manage" on public.category_visibility;
create policy "category_visibility_staff_manage" on public.category_visibility
  for all to authenticated using (public.has_permission('visibility.manage'))
  with check (public.has_permission('visibility.manage'));

drop policy if exists "portfolio_public_read_visible" on public.portfolio;
create policy "portfolio_public_read_visible" on public.portfolio
  for select to anon, authenticated using (is_visible or public.has_permission('portfolio.manage'));
drop policy if exists "portfolio_staff_manage" on public.portfolio;
create policy "portfolio_staff_manage" on public.portfolio
  for all to authenticated using (public.has_permission('portfolio.manage'))
  with check (public.has_permission('portfolio.manage'));

grant usage on schema public to anon, authenticated;
grant select on public.packages, public.platform_settings to anon, authenticated;
grant select, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.orders to authenticated;
grant select on public.order_quota_grants to authenticated;
grant select on public.discount_codes, public.category_visibility, public.portfolio to anon, authenticated;
grant insert, update, delete on public.packages, public.platform_settings, public.discount_codes, public.category_visibility, public.portfolio to authenticated;
grant execute on function public.grant_customer_order_attempts(uuid, integer) to authenticated;

-- Bootstrap the first manager only after creating their account through Supabase Auth:
-- update public.profiles set role = 'manager' where id = '<auth-user-uuid>';
-- Run that statement manually in the SQL Editor while signed in as the project owner.
