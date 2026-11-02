-- Agilist: clear the test albums before the demo. Run in the Supabase SQL editor, ONE STEP AT A TIME.
-- This permanently deletes data. It cannot be undone.
--
-- Accounts (sign-ins) are NOT touched here. After this, anyone can sign in and make a fresh album.

-- STEP 1. Look first. Select only this block and press Run. Check that every album is a test one.
select e.created_at::date as created,
       e.call_name         as his_name,
       e.join_code,
       (select count(*) from memberships m where m.elder_id = e.id) as people,
       (select count(*) from photos p where p.elder_id = e.id)      as photos,
       (select count(*) from notes n where n.elder_id = e.id)       as notes
from elders e
order by e.created_at;

-- STEP 2. Delete everything in every album (the albums, who joined them, all photos and all notes).
-- Only run this when step 1 showed nothing you want to keep. Select only this block and press Run.
-- delete from elders;   -- remove the two dashes at the start of this line to enable it

-- STEP 3. Check it is empty.
-- select (select count(*) from elders) as albums, (select count(*) from photos) as photos, (select count(*) from notes) as notes;
