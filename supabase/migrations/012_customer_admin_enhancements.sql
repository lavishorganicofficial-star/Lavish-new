-- Migration 012: Customer Admin Enhancements (COD Banning & Segmentation)

-- 1. Add new columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS cod_banned BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_vip BOOLEAN DEFAULT false;

-- 2. Update existing customers
UPDATE public.profiles SET cod_banned = false WHERE cod_banned IS NULL;
UPDATE public.profiles SET is_vip = false WHERE is_vip IS NULL;

-- 3. Add an index for faster VIP filtering later if needed
CREATE INDEX IF NOT EXISTS idx_profiles_vip ON profiles(is_vip);
