create table if not exists public.admin_login_challenges (
  id uuid primary key,
  github_login text not null,
  code_hash text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  attempts integer not null default 0 check (attempts between 0 and 2),
  consumed_at timestamptz
);

alter table public.admin_login_challenges enable row level security;
revoke all on public.admin_login_challenges from anon, authenticated;

create or replace function public.consume_admin_login_code(p_challenge_id uuid, p_code text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  challenge public.admin_login_challenges%rowtype;
begin
  update public.admin_login_challenges c
     set attempts = c.attempts + 1,
         consumed_at = case when c.code_hash = encode(extensions.digest(p_code || ':' || c.id::text, 'sha256'), 'hex') then now() else c.consumed_at end
   where c.id = p_challenge_id
     and c.expires_at > now()
     and c.attempts < 2
     and c.consumed_at is null
  returning c.* into challenge;

  if not found then return 'expired_or_locked'; end if;
  if challenge.consumed_at is not null then return 'verified'; end if;
  if challenge.attempts >= 2 then return 'locked'; end if;
  return 'invalid';
end;
$$;

revoke all on function public.consume_admin_login_code(uuid, text) from public, anon, authenticated;
grant execute on function public.consume_admin_login_code(uuid, text) to service_role;
