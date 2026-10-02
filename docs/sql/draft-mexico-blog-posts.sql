-- Draft Mexico-market blog posts (SoCal / EE. UU. primary market).
-- READ-ONLY for agents: Frank runs this in Supabase SQL Editor.
-- Does NOT delete rows — only sets is_published = false (draft).
-- Generated 2026-10-02 PT from live blog_posts audit.

-- Preview (run first):
SELECT id, slug, title, is_published
FROM blog_posts
WHERE slug IN (
  '5-rutas-secretas-mexico-locales',
  'senderismo-mexico-2026-rutas-abren-cierran',
  '7-caminatas-faciles-cdmx-principiantes',
  'mariposa-monarca-2026-rutas-costos-consejos'
)
ORDER BY slug;

-- Apply (Frank only):
UPDATE blog_posts
SET
  is_published = false,
  updated_at = now()
WHERE slug IN (
  '5-rutas-secretas-mexico-locales',
  'senderismo-mexico-2026-rutas-abren-cierran',
  '7-caminatas-faciles-cdmx-principiantes',
  'mariposa-monarca-2026-rutas-costos-consejos'
)
AND is_published = true;

-- Expected: 4 rows updated.
