-- Migration 009: Add payment_reference and courier_name to orders table
-- payment_reference stores UTR/transaction ID when admin manually records payment
-- courier_name stores the courier company name when order is shipped

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_reference TEXT,
  ADD COLUMN IF NOT EXISTS courier_name TEXT;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
