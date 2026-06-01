-- Run in Supabase SQL Editor (safe to re-run)

CREATE TABLE IF NOT EXISTS public.store_settings (
  key   TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT 'null',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first so we can recreate safely
DROP POLICY IF EXISTS "store_settings_public_read" ON public.store_settings;
DROP POLICY IF EXISTS "store_settings_admin_all"   ON public.store_settings;

CREATE POLICY "store_settings_public_read"
  ON public.store_settings FOR SELECT USING (true);

CREATE POLICY "store_settings_admin_all"
  ON public.store_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Insert defaults (skip if already exist)
INSERT INTO public.store_settings (key, value) VALUES
  ('gst_enabled',              'true'),
  ('gst_rate',                 '18'),
  ('cod_enabled',              'true'),
  ('cod_fee',                  '30'),
  ('free_shipping_threshold',  '499'),
  ('flat_shipping_rate',       '49')
ON CONFLICT (key) DO NOTHING;
