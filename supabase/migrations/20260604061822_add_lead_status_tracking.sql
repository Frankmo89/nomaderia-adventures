-- Reusable enum modeled on permit_alerts.status
   do $$ begin
     create type lead_status as enum ('nuevo', 'contactado', 'convertido');
   exception when duplicate_object then null; end $$;

   alter table sentinel_leads
     add column if not exists status lead_status not null default 'nuevo',
     add column if not exists contacted_at timestamptz;

   alter table quiz_responses
     add column if not exists status lead_status not null default 'nuevo',
     add column if not exists contacted_at timestamptz;

   alter table itinerary_requests
     add column if not exists status lead_status not null default 'nuevo',
     add column if not exists contacted_at timestamptz;