-- Fix: Add `TO authenticated` to the blog_posts admin policy
-- to be consistent with destinations and gear_articles policies.
-- Without this, unauthenticated requests could attempt admin operations
-- (has_role will return false, but the policy fires unnecessarily).

DROP POLICY IF EXISTS "Admins can manage blog posts" ON public.blog_posts;

CREATE POLICY "Admins can manage blog posts"
ON public.blog_posts
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
