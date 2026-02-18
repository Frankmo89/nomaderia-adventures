-- Create itinerary_requests table for premium personalized itinerary service
CREATE TABLE public.itinerary_requests (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name            text NOT NULL,
  email           text NOT NULL,
  destination     text NOT NULL,
  estimated_budget text,
  message         text,
  created_at      timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.itinerary_requests ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a request (public insert)
CREATE POLICY "Anyone can submit itinerary request"
ON public.itinerary_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only admins can read requests
CREATE POLICY "Admins can view itinerary requests"
ON public.itinerary_requests
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
