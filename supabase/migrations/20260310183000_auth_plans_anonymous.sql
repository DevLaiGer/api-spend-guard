create table if not exists tenant_members (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  user_id uuid not null,
  role text not null default 'owner',
  created_at timestamptz not null default now(),
  unique (tenant_id, user_id)
);

create index if not exists idx_tenant_members_user_id on tenant_members (user_id);

create table if not exists plans (
  code text primary key,
  name text not null,
  max_provider_accounts int not null,
  sms_enabled boolean not null default false,
  telegram_enabled boolean not null default true,
  discord_enabled boolean not null default true,
  price_monthly_usd numeric(10, 2) not null default 0
);

insert into plans (
  code,
  name,
  max_provider_accounts,
  sms_enabled,
  telegram_enabled,
  discord_enabled,
  price_monthly_usd
) values
  ('free', 'Free', 1, false, true, true, 0),
  ('pro', 'Pro', 5, true, true, true, 10)
on conflict (code) do update set
  name = excluded.name,
  max_provider_accounts = excluded.max_provider_accounts,
  sms_enabled = excluded.sms_enabled,
  telegram_enabled = excluded.telegram_enabled,
  discord_enabled = excluded.discord_enabled,
  price_monthly_usd = excluded.price_monthly_usd;

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null unique references tenants(id) on delete cascade,
  plan_code text not null references plans(code),
  status text not null default 'active',
  provider text not null default 'manual',
  provider_subscription_id text,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists anonymous_sessions (
  id uuid primary key default gen_random_uuid(),
  fingerprint_hash text not null,
  ip_hash text not null,
  status text not null default 'active',
  usage_count int not null default 0,
  expires_at timestamptz not null default (now() + interval '30 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_anonymous_sessions_fingerprint_hash on anonymous_sessions (fingerprint_hash);

create table if not exists anonymous_tenants (
  id uuid primary key default gen_random_uuid(),
  anonymous_session_id uuid not null references anonymous_sessions(id) on delete cascade,
  tenant_id uuid not null unique references tenants(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table policies
  add column if not exists telegram_chat_id text;

alter table tenant_members enable row level security;
alter table subscriptions enable row level security;
alter table anonymous_sessions enable row level security;
alter table anonymous_tenants enable row level security;
alter table plans enable row level security;

drop policy if exists "tenant_members_isolation" on tenant_members;
create policy "tenant_members_isolation" on tenant_members
  for all using (
    exists (
      select 1 from tenant_members tm
      where tm.tenant_id = tenant_members.tenant_id
        and tm.user_id::text = auth.uid()::text
    )
  );

drop policy if exists "subscriptions_isolation" on subscriptions;
create policy "subscriptions_isolation" on subscriptions
  for all using (
    exists (
      select 1 from tenant_members tm
      where tm.tenant_id = subscriptions.tenant_id
        and tm.user_id::text = auth.uid()::text
    )
  );

drop policy if exists "anonymous_sessions_no_client_access" on anonymous_sessions;
create policy "anonymous_sessions_no_client_access" on anonymous_sessions
  for all using (false);

drop policy if exists "anonymous_tenants_no_client_access" on anonymous_tenants;
create policy "anonymous_tenants_no_client_access" on anonymous_tenants
  for all using (false);

drop policy if exists "plans_read_only" on plans;
create policy "plans_read_only" on plans
  for select using (true);
