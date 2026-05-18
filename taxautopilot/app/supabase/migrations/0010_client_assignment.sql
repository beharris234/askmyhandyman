-- ============================================================
-- TaxAutopilot — Phase 8B + 8E: Client Assignment to Preparers
-- ============================================================
-- Each client can have an "assigned preparer" (the person
-- responsible for them). Unassigned = office-wide queue.
-- DB still lets everyone in the org see all clients (so people
-- can cover for each other), but the UI defaults to filtering
-- by current user for preparers.
-- ============================================================

alter table clients
  add column assigned_preparer_id uuid references profiles(id) on delete set null;

create index clients_assigned_preparer_idx
  on clients(organization_id, assigned_preparer_id);

comment on column clients.assigned_preparer_id is
  'Which preparer owns this client. Null = unassigned / office queue.';

-- Auto-assign on insert: if assigned_preparer_id wasn't set,
-- assign to the current user (the person who created the client)
-- only if they're a preparer (not an owner — owners often add
-- clients on behalf of the team and don't want them auto-assigned).
create or replace function auto_assign_client_on_insert() returns trigger as $$
declare
  creator_role text;
begin
  if new.assigned_preparer_id is null then
    select role into creator_role from profiles where id = auth.uid();
    if creator_role = 'preparer' then
      new.assigned_preparer_id := auth.uid();
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_clients_auto_assign
  before insert on clients
  for each row execute function auto_assign_client_on_insert();
