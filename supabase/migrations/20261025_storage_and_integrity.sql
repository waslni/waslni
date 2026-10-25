-- Public portfolio assets use Supabase Storage. Payment receipts are sent to Telegram
-- and are intentionally never written to a bucket or to the orders table.
-- Imported staff orders can exist without a linked Waslni account or package row.
alter table public.orders alter column customer_id drop not null;
alter table public.orders alter column package_id drop not null;
alter table public.orders add column if not exists security_code text;

drop policy if exists "orders_staff_create_manual" on public.orders;
create policy "orders_staff_create_manual" on public.orders
  for insert to authenticated
  with check (
    customer_id is null
    and public.has_permission('orders.update')
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'waslni-portfolio',
  'waslni-portfolio',
  true,
  52428800,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.order_deletion_challenges (
  id uuid primary key default gen_random_uuid(),
  manager_id uuid not null references public.profiles(id) on delete cascade,
  order_number text not null,
  action text not null check (action in ('cancel', 'hard_delete')),
  code_hash text not null,
  failed_attempts integer not null default 0 check (failed_attempts between 0 and 3),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '5 minutes')
);
create index if not exists order_deletion_challenges_lookup_idx
  on public.order_deletion_challenges (manager_id, order_number, action, expires_at desc);
alter table public.order_deletion_challenges enable row level security;

drop policy if exists "waslni_portfolio_assets_public_read" on storage.objects;
create policy "waslni_portfolio_assets_public_read" on storage.objects
  for select to anon, authenticated using (bucket_id = 'waslni-portfolio');

drop policy if exists "waslni_portfolio_assets_staff_insert" on storage.objects;
create policy "waslni_portfolio_assets_staff_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'waslni-portfolio' and public.has_permission('portfolio.manage'));

drop policy if exists "waslni_portfolio_assets_staff_update" on storage.objects;
create policy "waslni_portfolio_assets_staff_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'waslni-portfolio' and public.has_permission('portfolio.manage'))
  with check (bucket_id = 'waslni-portfolio' and public.has_permission('portfolio.manage'));

drop policy if exists "waslni_portfolio_assets_staff_delete" on storage.objects;
create policy "waslni_portfolio_assets_staff_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'waslni-portfolio' and public.has_permission('portfolio.manage'));
