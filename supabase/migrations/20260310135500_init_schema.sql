create extension if not exists "pgcrypto";

create table if not exists tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null default 'active',
  check_minute int not null default 0 check (check_minute >= 0 and check_minute <= 59),
  timezone text not null default 'UTC',
  plan_tier text not null default 'free',
  created_at timestamptz not null default now()
);

create table if not exists provider_accounts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  provider text not null,
  encrypted_key text not null,
  key_scope text not null default 'billing_read',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, provider)
);

create table if not exists policies (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null unique references tenants(id) on delete cascade,
  daily_limit_usd numeric(12, 4) not null default 0,
  spike_pct numeric(8, 2) not null default 150,
  burst_window_min int not null default 60,
  cooldown_min int not null default 30,
  discord_webhook_url text,
  sms_to_number text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists usage_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  provider text not null,
  metric_time timestamptz not null,
  usage_units numeric(18, 4) not null default 0,
  cost_usd numeric(14, 6) not null default 0,
  source_type text not null default 'pull',
  source_ref text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_usage_events_tenant_time on usage_events (tenant_id, metric_time desc);
create index if not exists idx_usage_events_provider_time on usage_events (provider, metric_time desc);

create table if not exists spend_rollups_hourly (
  tenant_id uuid not null references tenants(id) on delete cascade,
  provider text not null,
  hour_bucket timestamptz not null,
  cost_usd numeric(14, 6) not null default 0,
  usage_units numeric(18, 4) not null default 0,
  primary key (tenant_id, provider, hour_bucket)
);

create table if not exists spend_rollups_daily (
  tenant_id uuid not null references tenants(id) on delete cascade,
  provider text not null,
  day_bucket date not null,
  cost_usd numeric(14, 6) not null default 0,
  usage_units numeric(18, 4) not null default 0,
  primary key (tenant_id, provider, day_bucket)
);

create table if not exists alerts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  provider text not null,
  alert_type text not null,
  severity text not null,
  state text not null default 'open',
  fingerprint text not null,
  message text not null default '',
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  unique (tenant_id, fingerprint)
);

create table if not exists alert_deliveries (
  id uuid primary key default gen_random_uuid(),
  alert_id uuid not null references alerts(id) on delete cascade,
  channel text not null,
  destination text not null,
  status text not null,
  attempt int not null default 0,
  error text,
  sent_at timestamptz not null default now()
);

create table if not exists sync_runs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  provider text not null,
  idempotency_key text not null unique,
  window_start timestamptz not null,
  window_end timestamptz not null,
  status text not null default 'queued',
  attempt_count int not null default 0,
  error_count int not null default 0,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create table if not exists error_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) on delete cascade,
  provider text not null,
  error_code int not null,
  message text not null,
  job_id text not null,
  attempt int not null default 0,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by text
);

create or replace function upsert_daily_rollup(
  p_tenant_id uuid,
  p_provider text,
  p_day_bucket date,
  p_cost_usd numeric,
  p_usage_units numeric
) returns void
language plpgsql
as $$
begin
  insert into spend_rollups_daily (tenant_id, provider, day_bucket, cost_usd, usage_units)
  values (p_tenant_id, p_provider, p_day_bucket, p_cost_usd, p_usage_units)
  on conflict (tenant_id, provider, day_bucket)
  do update set
    cost_usd = spend_rollups_daily.cost_usd + excluded.cost_usd,
    usage_units = spend_rollups_daily.usage_units + excluded.usage_units;
end;
$$;

create or replace function get_spend_snapshot(p_tenant_id uuid)
returns table (
  spend_today_usd numeric,
  baseline_daily_usd numeric,
  burst_spend_usd numeric
) language sql
as $$
  with today as (
    select coalesce(sum(cost_usd), 0) as value
    from spend_rollups_daily
    where tenant_id = p_tenant_id
      and day_bucket = current_date
  ),
  baseline as (
    select coalesce(avg(cost_usd), 0) as value
    from spend_rollups_daily
    where tenant_id = p_tenant_id
      and day_bucket >= current_date - interval '7 days'
      and day_bucket < current_date
  ),
  burst as (
    select coalesce(sum(cost_usd), 0) as value
    from usage_events
    where tenant_id = p_tenant_id
      and metric_time >= now() - interval '60 minutes'
  )
  select today.value, baseline.value, burst.value
  from today, baseline, burst;
$$;

create or replace function get_dashboard_summary(p_tenant_id uuid, p_range text)
returns table (
  day_bucket date,
  total_cost_usd numeric
) language sql
as $$
  select day_bucket, sum(cost_usd) as total_cost_usd
  from spend_rollups_daily
  where tenant_id = p_tenant_id
    and day_bucket >= case p_range
      when '30d' then current_date - interval '30 days'
      when '14d' then current_date - interval '14 days'
      else current_date - interval '7 days'
    end
  group by day_bucket
  order by day_bucket asc;
$$;

alter table tenants enable row level security;
alter table provider_accounts enable row level security;
alter table policies enable row level security;
alter table usage_events enable row level security;
alter table spend_rollups_hourly enable row level security;
alter table spend_rollups_daily enable row level security;
alter table alerts enable row level security;
alter table alert_deliveries enable row level security;
alter table sync_runs enable row level security;
alter table error_logs enable row level security;

create policy "tenant_isolation_tenants" on tenants
  for all using (auth.uid()::text = id::text);

create policy "tenant_isolation_provider_accounts" on provider_accounts
  for all using (auth.uid()::text = tenant_id::text);

create policy "tenant_isolation_policies" on policies
  for all using (auth.uid()::text = tenant_id::text);

create policy "tenant_isolation_usage_events" on usage_events
  for all using (auth.uid()::text = tenant_id::text);

create policy "tenant_isolation_rollups_hourly" on spend_rollups_hourly
  for all using (auth.uid()::text = tenant_id::text);

create policy "tenant_isolation_rollups_daily" on spend_rollups_daily
  for all using (auth.uid()::text = tenant_id::text);

create policy "tenant_isolation_alerts" on alerts
  for all using (auth.uid()::text = tenant_id::text);

create policy "tenant_isolation_alert_deliveries" on alert_deliveries
  for select using (
    exists (
      select 1 from alerts a
      where a.id = alert_deliveries.alert_id
      and auth.uid()::text = a.tenant_id::text
    )
  );

create policy "tenant_isolation_sync_runs" on sync_runs
  for all using (auth.uid()::text = tenant_id::text);

create policy "tenant_isolation_error_logs" on error_logs
  for all using (auth.uid()::text = tenant_id::text);
