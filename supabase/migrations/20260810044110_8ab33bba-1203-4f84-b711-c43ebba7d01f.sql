CREATE TABLE public.news_cache (
  key text PRIMARY KEY,
  payload jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.news_cache TO anon;
GRANT SELECT ON public.news_cache TO authenticated;
GRANT ALL ON public.news_cache TO service_role;
ALTER TABLE public.news_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "news_cache_public_read" ON public.news_cache FOR SELECT USING (true);