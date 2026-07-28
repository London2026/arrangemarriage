-- Mark the 4 demo/showcase profiles as is_demo = true so the app shows a
-- "Demo Profile" label on them. Run AFTER add_is_demo_column.sql.
--
-- Matched by the first 8 hex characters of their UUID — the same characters
-- shown in their public "AM-XXXXXXXX" ID on their profile card, so these are
-- exactly the profiles visible in the Discover grid screenshot:
--   Priya M.    (AM-87FD1674)
--   Oovi M.     (AM-28DFCCBB)
--   Arjun S.    (AM-8E48C009)
--   Biswajit D. (AM-71E2E068)

UPDATE public.profiles
SET is_demo = true
WHERE id::text ILIKE '87fd1674-%'
   OR id::text ILIKE '28dfccbb-%'
   OR id::text ILIKE '8e48c009-%'
   OR id::text ILIKE '71e2e068-%';
