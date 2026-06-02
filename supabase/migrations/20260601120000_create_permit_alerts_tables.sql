-- Create permit_windows and permit_alerts tables for permit alerts product
CREATE TABLE public.permit_windows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  park text NOT NULL,
  permit_name text NOT NULL,
  window_type text NOT NULL,
  opens_at timestamptz NOT NULL,
  closes_at timestamptz,
  how_to_apply_url text,
  source_url text,
  year integer NOT NULL,
  notes text,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT permit_windows_window_type_check
    CHECK (window_type IN ('lottery', 'reservation_release', 'first_come'))
);

CREATE TABLE public.permit_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  park text NOT NULL,
  permit_name text NOT NULL,
  target_year integer NOT NULL,
  status text NOT NULL DEFAULT 'active',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT permit_alerts_status_check
    CHECK (status IN ('active', 'notified', 'expired'))
);

ALTER TABLE public.permit_windows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permit_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active permit windows"
ON public.permit_windows
FOR SELECT
TO public
USING (is_active = true);

CREATE POLICY "Admins can manage permit windows"
ON public.permit_windows
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can submit permit alert request"
ON public.permit_alerts
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admins can read permit alerts"
ON public.permit_alerts
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update permit alerts"
ON public.permit_alerts
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete permit alerts"
ON public.permit_alerts
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_permit_windows_updated_at
BEFORE UPDATE ON public.permit_windows
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
