-- Migration: 019_guest_checkout.sql

-- Allow orders without user_id (guest orders)
ALTER TABLE public.orders
  ALTER COLUMN user_id DROP NOT NULL;

-- Add guest info columns
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS guest_name    TEXT,
  ADD COLUMN IF NOT EXISTS guest_email   TEXT,
  ADD COLUMN IF NOT EXISTS guest_phone   TEXT,
  ADD COLUMN IF NOT EXISTS is_guest      BOOLEAN DEFAULT FALSE;

-- Index for guest email lookup
CREATE INDEX IF NOT EXISTS idx_orders_guest_email
  ON public.orders(guest_email)
  WHERE is_guest = TRUE;
