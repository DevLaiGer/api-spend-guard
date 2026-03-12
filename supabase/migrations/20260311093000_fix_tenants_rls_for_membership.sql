drop policy if exists "tenant_isolation_tenants" on tenants;

create policy "tenants_select_members" on tenants
  for select
  using (
    exists (
      select 1 from tenant_members tm
      where tm.tenant_id = tenants.id
        and tm.user_id::text = auth.uid()::text
    )
  );

create policy "tenants_insert_authenticated" on tenants
  for insert
  with check (auth.uid() is not null);

create policy "tenants_update_members" on tenants
  for update
  using (
    exists (
      select 1 from tenant_members tm
      where tm.tenant_id = tenants.id
        and tm.user_id::text = auth.uid()::text
    )
  )
  with check (
    exists (
      select 1 from tenant_members tm
      where tm.tenant_id = tenants.id
        and tm.user_id::text = auth.uid()::text
    )
  );

create policy "tenants_delete_members" on tenants
  for delete
  using (
    exists (
      select 1 from tenant_members tm
      where tm.tenant_id = tenants.id
        and tm.user_id::text = auth.uid()::text
    )
  );
