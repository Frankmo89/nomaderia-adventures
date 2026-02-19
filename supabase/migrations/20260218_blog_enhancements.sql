-- Agregar campos para mejorar SEO y UX del blog
ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS reading_time_min INTEGER DEFAULT 5,
  ADD COLUMN IF NOT EXISTS meta_description TEXT;

-- Índice para búsqueda por tags
CREATE INDEX IF NOT EXISTS idx_blog_posts_tags ON public.blog_posts USING GIN (tags);

-- Comentarios descriptivos
COMMENT ON COLUMN public.blog_posts.tags IS 'Array de tags para SEO y filtrado (ej: hiking, mexico, principiantes)';
COMMENT ON COLUMN public.blog_posts.reading_time_min IS 'Tiempo estimado de lectura en minutos';
COMMENT ON COLUMN public.blog_posts.meta_description IS 'Meta description para SEO, diferente del short_description';
