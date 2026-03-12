drop policy if exists "tenant_members_isolation" on tenant_members;

create policy "tenant_members_select_own" on tenant_members
  for select
  using (auth.uid()::text = user_id::text);

create policy "tenant_members_insert_own" on tenant_members
  for insert
  with check (auth.uid()::text = user_id::text);

create policy "tenant_members_update_own" on tenant_members
  for update
  using (auth.uid()::text = user_id::text)
  with check (auth.uid()::text = user_id::text);

create policy "tenant_members_delete_own" on tenant_members
  for delete
  using (auth.uid()::text = user_id::text);
