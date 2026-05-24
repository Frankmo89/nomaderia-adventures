-- Fix: sentinel_leads only had INSERT for anon but no SELECT policy.
-- This caused the admin dashboard "Leads de Alerta" counter to always show 0
-- even when rows exist. Add SELECT policy for authenticated admins.

CREATE POLICY "Admins can view sentinel leads"
ON public.sentinel_leads
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
