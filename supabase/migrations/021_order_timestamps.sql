-- Migration: 021_order_timestamps.sql
-- Description: Adds timestamp columns to track when specific order statuses were achieved.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS packed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;
