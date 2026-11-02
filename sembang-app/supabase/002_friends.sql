-- Agilist 002: the friends' album. Run once in the Supabase SQL editor, after schema.sql.
-- Safe to run again.
--
-- A friend (church, old friends) signs up with the role "friend" and joins with the family's code.
-- A friend can add photos and see only their own. Nothing a friend adds reaches the care team until
-- the family turns it on. Friends never see the care notes.

alter table memberships drop constraint if exists memberships_role_check;
alter table memberships add constraint memberships_role_check check (role in ('family', 'caregiver', 'friend'));

-- Who added each photo, so a friend sees only their own.
alter table photos add column if not exists added_by uuid default auth.uid();

drop policy if exists photos_read on photos;
create policy photos_read on photos for select using (
  member_role(elder_id) = 'family'
  or (member_role(elder_id) = 'caregiver' and data ->> 'shared' = 'true')
  or (member_role(elder_id) = 'friend' and added_by = auth.uid())
);

drop policy if exists photos_insert on photos;
create policy photos_insert on photos for insert with check (
  member_role(elder_id) = 'family'
  or (member_role(elder_id) = 'caregiver' and data ->> 'kind' = 'drawing')
  or (member_role(elder_id) = 'friend' and added_by = auth.uid()
      and data ->> 'from' = 'friend' and coalesce(data ->> 'shared', 'false') <> 'true')
);

-- The family can change any photo (this is how it approves a friend's photo).
-- A friend can change their own photo only while it is still waiting for the family.
drop policy if exists photos_update on photos;
create policy photos_update on photos for update
  using (
    member_role(elder_id) = 'family'
    or (member_role(elder_id) = 'friend' and added_by = auth.uid() and coalesce(data ->> 'shared', 'false') <> 'true')
  )
  with check (
    member_role(elder_id) = 'family'
    or (member_role(elder_id) = 'friend' and added_by = auth.uid() and coalesce(data ->> 'shared', 'false') <> 'true')
  );

drop policy if exists photos_delete on photos;
create policy photos_delete on photos for delete using (
  member_role(elder_id) = 'family'
  or (member_role(elder_id) = 'friend' and added_by = auth.uid())
);

-- Care notes stay between the family and the care team.
drop policy if exists notes_all on notes;
create policy notes_all on notes for all
  using (member_role(elder_id) in ('family', 'caregiver'))
  with check (member_role(elder_id) in ('family', 'caregiver'));
