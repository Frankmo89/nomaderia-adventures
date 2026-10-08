-- ADR-037 — Entrance fees as data.
-- Additive only: two new tables. Filled by the ingest-nps-pages edge function
-- from the official nps.gov fees pages (+ passes.htm and the nonresident FAQ),
-- refreshed by the existing daily pg_cron job nps-pages-refresh-daily.
-- concierge-agent reads them for the calculate_fees tool (code computes totals).

CREATE TABLE IF NOT EXISTS public.park_fees (
  park_code               text PRIMARY KEY,
  park_name               text        NOT NULL,
  entrance_fee_required   boolean     NOT NULL,
  vehicle                 numeric(8,2),
  motorcycle              numeric(8,2),
  per_person              numeric(8,2),
  annual_park_pass        numeric(8,2),
  min_paying_age          integer,
  valid_days              integer,
  nonresident_fee_on_page boolean     NOT NULL DEFAULT false,
  on_nonresident_list     boolean,
  nonresident_fee         numeric(8,2),
  parse_ok                boolean     NOT NULL DEFAULT false,
  issues                  text[]      NOT NULL DEFAULT '{}',
  source_url              text        NOT NULL,
  nonresident_list_url    text        NOT NULL,
  fetched_at              timestamptz NOT NULL,
  updated_at              timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.park_fees IS
  'Entrance fees parsed from nps.gov/<park>/planyourvisit/fees.htm (ADR-037). nonresident_fee applies only when the park page says so AND the park is on the official list (passes.htm); parse_ok=false makes calculate_fees refuse.';

CREATE TABLE IF NOT EXISTS public.pass_rules (
  pass_code                     text PRIMARY KEY CHECK (pass_code IN ('atb_resident', 'atb_nonresident', 'park_annual')),
  label_es                      text        NOT NULL,
  price                         numeric(8,2),
  available_to                  text        NOT NULL,
  covers_vehicle_and_passengers boolean     NOT NULL DEFAULT false,
  per_person_additional_adults  integer,
  covers_nonresident_fee        boolean     NOT NULL DEFAULT false,
  evidence                      text        NOT NULL DEFAULT '',
  parse_ok                      boolean     NOT NULL DEFAULT false,
  source_url                    text        NOT NULL,
  fetched_at                    timestamptz NOT NULL,
  updated_at                    timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.pass_rules IS
  'America the Beautiful / park annual pass rules (ADR-037), each backed by a verbatim sentence (evidence) of passes.htm or the nonresident-fees FAQ.';

-- Public fee data: anyone may read; only service_role (edge function) writes.
ALTER TABLE public.park_fees  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pass_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS park_fees_public_read ON public.park_fees;
CREATE POLICY park_fees_public_read ON public.park_fees FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS pass_rules_public_read ON public.pass_rules;
CREATE POLICY pass_rules_public_read ON public.pass_rules FOR SELECT TO anon, authenticated USING (true);

GRANT SELECT ON public.park_fees, public.pass_rules TO anon, authenticated;
GRANT ALL ON public.park_fees, public.pass_rules TO service_role;
