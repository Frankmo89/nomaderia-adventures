-- Tighten RLS on itinerary_requests.
-- No public form writes to this table anymore; leads arrive via WhatsApp.
-- Closes the UPDATE gap that left status/contacted_at writes without a policy.

-- 1. Remove the open public-insert policy.
DROP POLICY IF EXISTS "Anyone can submit itinerary request" ON public.itinerary_requests;

-- 2. Admin-only INSERT.
CREATE POLICY "Admins can insert itinerary requests"
ON public.itinerary_requests
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3. Admin-only UPDATE (closes the status/contacted_at gap).
CREATE POLICY "Admins can update itinerary requests"
ON public.itinerary_requests
FOR UPDATE
TO authenticated
USING  (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
