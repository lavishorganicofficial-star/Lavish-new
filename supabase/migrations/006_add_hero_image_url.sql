-- Add hero_image_url to categories table
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS hero_image_url TEXT;
