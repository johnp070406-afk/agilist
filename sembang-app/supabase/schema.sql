-- Agilist shared album. Run once in the Supabase SQL editor (Project -> SQL).
-- One elder ("Mr Tan") has one family album and one care team. A family member creates the
-- elder and gets a join code; caregivers enter that code after they sign in.
--
-- Photos and notes are stored as JSON rows (the same objects the app uses on the device), with
-- the picture inside the row as a small JPEG. Fine for a pilot; move images to Storage when
-- the album grows.

create table if not exists elders (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Family album',
  join_code text not null unique,
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now()
);

create table if not exists memberships (
  elder_id uuid not null references elders on delete cascade,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  role text not null check (role in ('family', 'caregiver')),
  primary key (elder_id, user_id)
);

create table if not exists photos (
  elder_id uuid not null references elders on delete cascade,
  id text not null,
  ord double precision not null default 0,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (elder_id, id)
);

create table if not exists notes (
  elder_id uuid not null references elders on delete cascade,
  id text not null,
  ord double precision not null default 0,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (elder_id, id)
);

alter table elders enable row level security;
alter table memberships enable row level security;
alter table photos enable row level security;
alter table notes enable row level security;

-- Who is in which group. security definer so the policies below can use it without recursing.
create or replace function member_role(e uuid) returns text
language sql stable security definer set search_path = public as $$
  select role from memberships where elder_id = e and user_id = auth.uid()
$$;

-- The role chosen at sign-up. (user_metadata can be edited by the user: fine for a pilot,
-- replace with an invite table before real use.)
create or replace function my_signup_role() returns text
language sql stable as $$
  select coalesce(auth.jwt() -> 'user_metadata' ->> 'role', 'caregiver')
$$;

drop policy if exists elders_read on elders;
create policy elders_read on elders for select using (member_role(id) is not null);

drop policy if exists memberships_read on memberships;
create policy memberships_read on memberships for select using (user_id = auth.uid());

-- Photos: the family sees and edits everything. Caregivers see only what the family shared
-- (this is the consent switch) and can only add drawings made from a note.
drop policy if exists photos_read on photos;
create policy photos_read on photos for select using (
  member_role(elder_id) = 'family'
  or (member_role(elder_id) = 'caregiver' and data ->> 'shared' = 'true')
);
drop policy if exists photos_insert on photos;
create policy photos_insert on photos for insert with check (
  member_role(elder_id) = 'family'
  or (member_role(elder_id) = 'caregiver' and data ->> 'kind' = 'drawing')
);
drop policy if exists photos_update on photos;
create policy photos_update on photos for update
  using (member_role(elder_id) = 'family') with check (member_role(elder_id) = 'family');
drop policy if exists photos_delete on photos;
create policy photos_delete on photos for delete using (member_role(elder_id) = 'family');

-- Notes: both groups read, add, edit and tidy them.
drop policy if exists notes_all on notes;
create policy notes_all on notes for all
  using (member_role(elder_id) is not null) with check (member_role(elder_id) is not null);

-- The family creates the elder and gets a 6-character join code.
create or replace function create_elder(p_name text default 'Family album')
returns table (elder_id uuid, role text, join_code text, name text)
language plpgsql security definer set search_path = public as $$
declare e elders;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  if my_signup_role() <> 'family' then raise exception 'Only a family account can create the album'; end if;
  insert into elders (name, join_code, created_by)
    values (p_name, upper(substr(md5(gen_random_uuid()::text), 1, 6)), auth.uid())
    returning * into e;
  insert into memberships (elder_id, user_id, role) values (e.id, auth.uid(), 'family');
  return query select e.id, 'family'::text, e.join_code, e.name;
end $$;

-- A caregiver enters the code to join. Family members can also join with a code (a second relative).
create or replace function join_elder(p_code text)
returns table (elder_id uuid, role text, join_code text, name text)
language plpgsql security definer set search_path = public as $$
declare e elders; r text := my_signup_role();
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  select * into e from elders where elders.join_code = upper(trim(p_code));
  if not found then raise exception 'That code was not found. Check it with the family.'; end if;
  insert into memberships (elder_id, user_id, role) values (e.id, auth.uid(), r)
    on conflict do nothing;
  return query select e.id, member_role(e.id), e.join_code, e.name;
end $$;

-- What this person belongs to (empty until they create or join).
create or replace function my_elder()
returns table (elder_id uuid, role text, join_code text, name text)
language sql stable security definer set search_path = public as $$
  select e.id, m.role, e.join_code, e.name
  from memberships m join elders e on e.id = m.elder_id
  where m.user_id = auth.uid() limit 1
$$;

grant execute on function create_elder(text), join_elder(text), my_elder() to authenticated;
