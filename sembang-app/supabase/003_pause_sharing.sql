-- Agilist 003: pausing sharing is enforced by the server. Run once in the Supabase SQL editor,
-- after schema.sql and 002_friends.sql. Safe to run again.
--
-- When the family pauses sharing ("Withdraw consent"), the care team gets no photos and no notes
-- from the server at all, until the family turns it back on. Only the family can change it.

alter table elders add column if not exists sharing_paused boolean not null default false;

create or replace function sharing_paused(e uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select sharing_paused from elders where id = e), false)
$$;

drop policy if exists photos_read on photos;
create policy photos_read on photos for select using (
  member_role(elder_id) = 'family'
  or (member_role(elder_id) = 'caregiver' and data ->> 'shared' = 'true' and not sharing_paused(elder_id))
  or (member_role(elder_id) = 'friend' and added_by = auth.uid())
);

drop policy if exists photos_insert on photos;
create policy photos_insert on photos for insert with check (
  member_role(elder_id) = 'family'
  or (member_role(elder_id) = 'caregiver' and data ->> 'kind' = 'drawing' and not sharing_paused(elder_id))
  or (member_role(elder_id) = 'friend' and added_by = auth.uid()
      and data ->> 'from' = 'friend' and coalesce(data ->> 'shared', 'false') <> 'true')
);

drop policy if exists notes_all on notes;
create policy notes_all on notes for all
  using (member_role(elder_id) = 'family' or (member_role(elder_id) = 'caregiver' and not sharing_paused(elder_id)))
  with check (member_role(elder_id) = 'family' or (member_role(elder_id) = 'caregiver' and not sharing_paused(elder_id)));

-- The family pauses or resumes sharing for its album.
create or replace function set_sharing(p_paused boolean) returns boolean
language plpgsql security definer set search_path = public as $$
declare e uuid;
begin
  select elder_id into e from memberships where user_id = auth.uid() and role = 'family' limit 1;
  if e is null then raise exception 'Only the family can pause or resume sharing'; end if;
  update elders set sharing_paused = p_paused where id = e;
  return p_paused;
end $$;

-- my_elder now also says whether sharing is paused (the return type changes, so drop it first).
drop function if exists my_elder();
create function my_elder()
returns table (elder_id uuid, role text, join_code text, name text, paused boolean)
language sql stable security definer set search_path = public as $$
  select e.id, m.role, e.join_code, e.name, e.sharing_paused
  from memberships m join elders e on e.id = m.elder_id
  where m.user_id = auth.uid() limit 1
$$;

grant execute on function set_sharing(boolean), my_elder() to authenticated;
