-- media_slider: admins can read every row, active or not.
--
-- The only SELECT policy was "Media pública" (is_active = true). PostgREST runs
-- UPDATE ... RETURNING, so the new row must pass a SELECT policy too. Turning a
-- photo off in /admin/galeria (is_active -> false) failed with
-- "new row violates row-level security policy for table media_slider", and an
-- inactive row would have vanished from the panel with no way to turn it back on.
--
-- Additive: the four existing policies stay as they are. Visitors still see
-- only active rows; the public hooks also filter is_active = true.
-- Tested 2026-10-21 in a rolled-back transaction as the admin user:
-- before -> RLS error; after -> update succeeds and the inactive row is visible.

CREATE POLICY "Admins can select all media"
ON public.media_slider
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
