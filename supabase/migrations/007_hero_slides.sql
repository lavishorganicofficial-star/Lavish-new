-- ============================================================
-- Migration: Add hero_slides table for homepage carousel
-- Run this in Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.hero_slides (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url   TEXT NOT NULL,
  cloudinary_id TEXT,
  title       TEXT,
  subtitle    TEXT,
  link_url    TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: admin-only writes, public reads
ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hero_slides_public_read"
  ON public.hero_slides FOR SELECT
  USING (true);

CREATE POLICY "hero_slides_admin_all"
  ON public.hero_slides FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Index for ordered queries
CREATE INDEX IF NOT EXISTS hero_slides_sort_order_idx ON public.hero_slides (sort_order ASC);
