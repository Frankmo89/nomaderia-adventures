
-- 1. Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin');

-- 2. User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 4. Destinations table
CREATE TABLE public.destinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  country TEXT NOT NULL,
  region TEXT,
  slug TEXT UNIQUE NOT NULL,
  short_description TEXT,
  difficulty_level TEXT NOT NULL DEFAULT 'easy',
  difficulty_description TEXT,
  days_needed TEXT,
  best_season TEXT,
  estimated_budget_usd INTEGER,
  hero_image_url TEXT,
  gallery_images TEXT[],
  full_guide_markdown TEXT,
  preparation_plan TEXT,
  gear_list_markdown TEXT,
  common_fears JSONB DEFAULT '[]'::jsonb,
  itinerary_markdown TEXT,
  has_premium_itinerary BOOLEAN DEFAULT false,
  premium_itinerary_price DECIMAL,
  affiliate_links JSONB DEFAULT '{}'::jsonb,
  experience_type TEXT,
  tags TEXT[],
  is_published BOOLEAN DEFAULT false,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.destinations ENABLE ROW LEVEL SECURITY;

-- 5. Gear articles table
CREATE TABLE public.gear_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  short_description TEXT,
  hero_image_url TEXT,
  content_markdown TEXT,
  products JSONB DEFAULT '[]'::jsonb,
  is_published BOOLEAN DEFAULT false,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.gear_articles ENABLE ROW LEVEL SECURITY;

-- 6. Quiz responses table
CREATE TABLE public.quiz_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT,
  fitness_level TEXT,
  interest TEXT,
  trip_duration TEXT,
  travel_style TEXT,
  budget_range TEXT,
  recommended_destinations TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.quiz_responses ENABLE ROW LEVEL SECURITY;

-- 7. Newsletter subscribers table
CREATE TABLE public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies

-- user_roles: only admins
CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- destinations: public read, admin write
CREATE POLICY "Anyone can read published destinations" ON public.destinations
  FOR SELECT USING (is_published = true);

CREATE POLICY "Admins can manage destinations" ON public.destinations
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- gear_articles: public read, admin write
CREATE POLICY "Anyone can read published gear articles" ON public.gear_articles
  FOR SELECT USING (is_published = true);

CREATE POLICY "Admins can manage gear articles" ON public.gear_articles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- quiz_responses: anyone can insert, admin can read
CREATE POLICY "Anyone can submit quiz" ON public.quiz_responses
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can read quiz responses" ON public.quiz_responses
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- newsletter_subscribers: anyone can insert, admin can read
CREATE POLICY "Anyone can subscribe" ON public.newsletter_subscribers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can read subscribers" ON public.newsletter_subscribers
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 9. Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_destinations_updated_at
  BEFORE UPDATE ON public.destinations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_gear_articles_updated_at
  BEFORE UPDATE ON public.gear_articles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
