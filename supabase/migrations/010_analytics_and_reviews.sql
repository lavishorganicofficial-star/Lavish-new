-- Migration 010: Analytics, Reviews, Profiles enhancements, and Storage Buckets

-- ==========================================
-- 1. ANALYTICS TABLES
-- ==========================================

-- Page views and sessions
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    TEXT NOT NULL,
  user_id       UUID REFERENCES profiles(id) ON DELETE SET NULL,
  event_type    TEXT NOT NULL,
  page_path     TEXT,
  product_id    UUID REFERENCES products(id) ON DELETE SET NULL,
  category_id   UUID REFERENCES categories(id) ON DELETE SET NULL,
  search_query  TEXT,
  referrer      TEXT,
  utm_source    TEXT,
  utm_medium    TEXT,
  utm_campaign  TEXT,
  device_type   TEXT,
  browser       TEXT,
  country       TEXT,
  city          TEXT,
  metadata      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Daily summary
CREATE TABLE IF NOT EXISTS public.analytics_daily (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date                  DATE UNIQUE NOT NULL,
  total_visitors        INT DEFAULT 0,
  unique_visitors       INT DEFAULT 0,
  new_visitors          INT DEFAULT 0,
  returning_visitors    INT DEFAULT 0,
  total_page_views      INT DEFAULT 0,
  total_sessions        INT DEFAULT 0,
  avg_session_duration  INT DEFAULT 0,
  bounce_rate           DECIMAL(5,2) DEFAULT 0,
  total_orders          INT DEFAULT 0,
  total_revenue         DECIMAL(10,2) DEFAULT 0,
  conversion_rate       DECIMAL(5,2) DEFAULT 0,
  cart_adds             INT DEFAULT 0,
  cart_abandons         INT DEFAULT 0,
  wishlists_adds        INT DEFAULT 0,
  searches              INT DEFAULT 0,
  product_shares        INT DEFAULT 0,
  mobile_visitors       INT DEFAULT 0,
  desktop_visitors      INT DEFAULT 0,
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- Product-level analytics
CREATE TABLE IF NOT EXISTS public.product_analytics (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      UUID REFERENCES products(id) ON DELETE CASCADE,
  date            DATE NOT NULL,
  views           INT DEFAULT 0,
  unique_views    INT DEFAULT 0,
  add_to_cart     INT DEFAULT 0,
  wishlist_adds   INT DEFAULT 0,
  shares          INT DEFAULT 0,
  purchases       INT DEFAULT 0,
  revenue         DECIMAL(10,2) DEFAULT 0,
  UNIQUE(product_id, date)
);

-- Search analytics
CREATE TABLE IF NOT EXISTS public.search_analytics (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query         TEXT NOT NULL,
  results_count INT DEFAULT 0,
  clicked       BOOLEAN DEFAULT FALSE,
  user_id       UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics Indexes
CREATE INDEX IF NOT EXISTS idx_analytics_events_date      ON public.analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type      ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_product   ON public.analytics_events(product_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session   ON public.analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_product_analytics_product  ON public.product_analytics(product_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_search_analytics_query     ON public.search_analytics(query);

-- Enable RLS for Analytics but allow anon inserts for events
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_analytics ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to insert tracking events
CREATE POLICY "Allow public insert to analytics_events" ON public.analytics_events FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow public insert to search_analytics" ON public.search_analytics FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Allow service role full access
CREATE POLICY "Service role full access analytics_events" ON public.analytics_events USING (true);
CREATE POLICY "Service role full access analytics_daily" ON public.analytics_daily USING (true);
CREATE POLICY "Service role full access product_analytics" ON public.product_analytics USING (true);
CREATE POLICY "Service role full access search_analytics" ON public.search_analytics USING (true);


-- ==========================================
-- 2. PROFILES ENHANCEMENTS
-- ==========================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS birthday DATE,
  ADD COLUMN IF NOT EXISTS skin_type TEXT;

-- ==========================================
-- 3. REVIEWS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    UUID REFERENCES products(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES profiles(id) ON DELETE CASCADE,
  rating        INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title         TEXT,
  body          TEXT NOT NULL,
  images        TEXT[] DEFAULT '{}',
  is_approved   BOOLEAN DEFAULT FALSE,
  helpful_count INT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_product ON public.product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_approved ON public.product_reviews(is_approved);

ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- Users can read approved reviews
CREATE POLICY "Anyone can read approved reviews" ON public.product_reviews FOR SELECT USING (is_approved = true);
-- Users can read their own pending reviews
CREATE POLICY "Users can read own pending reviews" ON public.product_reviews FOR SELECT USING (auth.uid() = user_id);
-- Users can insert their own reviews
CREATE POLICY "Users can insert own reviews" ON public.product_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Service role can do anything
CREATE POLICY "Service role full access reviews" ON public.product_reviews USING (true);

-- Update products table to track review stats
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS avg_rating DECIMAL(3,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_reviews INT DEFAULT 0;

-- Function to update product review stats
CREATE OR REPLACE FUNCTION update_product_review_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE public.products
    SET 
      avg_rating = (SELECT COALESCE(AVG(rating), 0) FROM public.product_reviews WHERE product_id = NEW.product_id AND is_approved = true),
      total_reviews = (SELECT COUNT(*) FROM public.product_reviews WHERE product_id = NEW.product_id AND is_approved = true)
    WHERE id = NEW.product_id;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    UPDATE public.products
    SET 
      avg_rating = (SELECT COALESCE(AVG(rating), 0) FROM public.product_reviews WHERE product_id = OLD.product_id AND is_approved = true),
      total_reviews = (SELECT COUNT(*) FROM public.product_reviews WHERE product_id = OLD.product_id AND is_approved = true)
    WHERE id = OLD.product_id;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for review stats
DROP TRIGGER IF EXISTS update_product_review_stats_trigger ON public.product_reviews;
CREATE TRIGGER update_product_review_stats_trigger
  AFTER INSERT OR UPDATE OF is_approved OR DELETE
  ON public.product_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_product_review_stats();

-- ==========================================
-- 4. STORAGE BUCKETS
-- ==========================================
-- Note: Requires Supabase Storage schema extensions usually, 
-- but we can assume the user will create 'avatars' and 'reviews' buckets if these fail.
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('reviews', 'reviews', true) ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars
CREATE POLICY "Avatar images are publicly accessible." ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Anyone can upload an avatar." ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "Anyone can update their own avatar." ON storage.objects FOR UPDATE WITH CHECK (bucket_id = 'avatars');

-- Storage policies for reviews
CREATE POLICY "Review images are publicly accessible." ON storage.objects FOR SELECT USING (bucket_id = 'reviews');
CREATE POLICY "Anyone can upload review images." ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'reviews');

NOTIFY pgrst, 'reload schema';
