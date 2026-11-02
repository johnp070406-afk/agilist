-- Agilist 004: the name the family uses for him ("Dad", "Ah Ma", "Mr Tan"). Run once in the Supabase
-- SQL editor, after 003_pause_sharing.sql. Safe to run again.
--
-- The family sets it; the care team and friends see it. It is only a name to show on screens.

alter table elders add column if not exists call_name text not null default '';

create or replace function set_elder_name(p_name text) returns text
language plpgsql security definer set search_path = public as $$
declare e uuid; n text := left(trim(coalesce(p_name, '')), 40);
begin
  select elder_id into e from memberships where user_id = auth.uid() and role = 'family' limit 1;
  if e is null then raise exception 'Only the family can set his name'; end if;
  update elders set call_name = n where id = e;
  return n;
end $$;

-- my_elder also returns the name (the return type changes, so drop it first).
drop function if exists my_elder();
create function my_elder()
returns table (elder_id uuid, role text, join_code text, name text, paused boolean, call_name text)
language sql stable security definer set search_path = public as $$
  select e.id, m.role, e.join_code, e.name, e.sharing_paused, e.call_name
  from memberships m join elders e on e.id = m.elder_id
  where m.user_id = auth.uid() limit 1
$$;

grant execute on function set_elder_name(text), my_elder() to authenticated;
