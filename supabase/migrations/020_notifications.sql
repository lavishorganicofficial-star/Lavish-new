-- Migration: 020_notifications.sql
-- Description: Enhances notifications table with types, icons, colors, order relations, and action URLs.

-- Alter table to add new columns
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'info'
    CHECK (type IN (
      'order_confirmed',
      'order_packed',
      'order_shipped',
      'order_delivered',
      'order_cancelled',
      'review_approved',
      'coupon_received',
      'general'
    )),
  ADD COLUMN IF NOT EXISTS icon TEXT,
  ADD COLUMN IF NOT EXISTS color TEXT,
  ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS action_url TEXT;

-- Index for fast unread count
CREATE INDEX IF NOT EXISTS idx_notifications_unread
  ON public.notifications(user_id, is_read)
  WHERE is_read = FALSE;

-- Function: create order notification
CREATE OR REPLACE FUNCTION public.create_order_notification(
  p_user_id UUID,
  p_order_id UUID,
  p_order_number TEXT,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_action_url TEXT
) RETURNS void AS $$
BEGIN
  INSERT INTO public.notifications (
    user_id, order_id, type, title,
    message, icon, action_url, is_read
  ) VALUES (
    p_user_id, p_order_id, p_type, p_title,
    p_message,
    CASE p_type
      WHEN 'order_confirmed'  THEN '✅'
      WHEN 'order_packed'     THEN '📦'
      WHEN 'order_shipped'    THEN '🚀'
      WHEN 'order_delivered'  THEN '🎉'
      WHEN 'order_cancelled'  THEN '❌'
      ELSE 'ℹ️'
    END,
    p_action_url,
    FALSE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable Realtime for notifications and orders
BEGIN;
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND tablename = 'orders'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
    END IF;
  END
  $$;
COMMIT;
