-- Migration: 017_influencer_system.sql
-- Description: Core schema for Influencer Marketing and Commission Tracking

-- 1. Extend profiles and coupons
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS referral_link TEXT;

ALTER TABLE public.coupons
  ADD COLUMN IF NOT EXISTS influencer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 2. Influencer Profiles
CREATE TABLE IF NOT EXISTS public.influencer_profiles (
  id                  UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  instagram_handle    TEXT,
  youtube_channel     TEXT,
  other_platform      TEXT,
  follower_count      INT DEFAULT 0,
  content_niche       TEXT,

  -- Commission settings
  commission_rate     DECIMAL(5,2) DEFAULT 10.00,
  coupon_discount     DECIMAL(5,2) DEFAULT 10.00,
  commission_on_non_coupon_orders BOOLEAN DEFAULT FALSE,
  non_coupon_commission_rate DECIMAL(5,2) DEFAULT 5.00,

  -- Earnings summary
  total_clicks        INT DEFAULT 0,
  total_orders        INT DEFAULT 0,
  total_sales_value   DECIMAL(10,2) DEFAULT 0,
  total_commission_earned  DECIMAL(10,2) DEFAULT 0,
  pending_commission  DECIMAL(10,2) DEFAULT 0,
  paid_commission     DECIMAL(10,2) DEFAULT 0,

  -- Payout details
  preferred_payout    TEXT DEFAULT 'upi' CHECK (preferred_payout IN ('upi','bank','paytm')),
  upi_id              TEXT,
  bank_name           TEXT,
  account_number      TEXT,
  ifsc_code           TEXT,
  pan_number          TEXT,

  -- Status
  status              TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','suspended')),
  rejection_reason    TEXT,
  applied_at          TIMESTAMPTZ DEFAULT NOW(),
  approved_at         TIMESTAMPTZ,
  approved_by         UUID REFERENCES public.profiles(id),

  custom_welcome_message TEXT,
  notes               TEXT
);

-- 3. Influencer Clicks
CREATE TABLE IF NOT EXISTS public.influencer_clicks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id   UUID NOT NULL REFERENCES public.influencer_profiles(id) ON DELETE CASCADE,
  session_id      TEXT,
  visitor_id      TEXT,
  ip_address      TEXT,
  device_type     TEXT,
  referrer        TEXT,
  landing_page    TEXT,
  utm_source      TEXT,
  utm_medium      TEXT,
  utm_campaign    TEXT,
  converted       BOOLEAN DEFAULT FALSE,
  order_id        UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns to orders (if not already added elsewhere, though the prompt asked to add them here)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS influencer_id UUID REFERENCES public.influencer_profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS influencer_code TEXT,
  ADD COLUMN IF NOT EXISTS via_coupon BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(10,2) DEFAULT 0;

-- 4. Commission Transactions
CREATE TABLE IF NOT EXISTS public.commission_transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id   UUID NOT NULL REFERENCES public.influencer_profiles(id) ON DELETE CASCADE,
  order_id        UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  order_number    TEXT NOT NULL,
  order_total     DECIMAL(10,2) NOT NULL,
  commission_rate DECIMAL(5,2) NOT NULL,
  commission_amount DECIMAL(10,2) NOT NULL,
  via_coupon      BOOLEAN DEFAULT TRUE,
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','paid','cancelled')),

  approved_at     TIMESTAMPTZ,
  approved_by     UUID REFERENCES public.profiles(id),

  paid_at         TIMESTAMPTZ,
  paid_by         UUID REFERENCES public.profiles(id),
  payment_method  TEXT,
  payment_reference TEXT,
  payment_notes   TEXT,

  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Influencer Payouts
CREATE TABLE IF NOT EXISTS public.influencer_payouts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_number   TEXT UNIQUE NOT NULL,
  influencer_id   UUID NOT NULL REFERENCES public.influencer_profiles(id),
  total_amount    DECIMAL(10,2) NOT NULL,
  transaction_count INT NOT NULL,
  payment_method  TEXT NOT NULL,
  payment_reference TEXT,
  notes           TEXT,
  paid_by         UUID REFERENCES public.profiles(id),
  paid_at         TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Functions & Triggers
CREATE OR REPLACE FUNCTION generate_payout_number()
RETURNS TEXT AS $$
DECLARE
  today   TEXT := TO_CHAR(NOW(), 'YYYYMMDD');
  seq_num INT;
BEGIN
  SELECT COUNT(*) + 1 INTO seq_num
  FROM public.influencer_payouts
  WHERE created_at::DATE = NOW()::DATE;
  RETURN 'PAY-' || today || '-' || LPAD(seq_num::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_influencer_on_commission()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.influencer_profiles
    SET
      total_orders          = total_orders + 1,
      total_sales_value     = total_sales_value + NEW.order_total,
      total_commission_earned = total_commission_earned + NEW.commission_amount,
      pending_commission    = pending_commission + NEW.commission_amount
    WHERE id = NEW.influencer_id;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.status = 'paid' AND OLD.status != 'paid' THEN
    UPDATE public.influencer_profiles
    SET
      pending_commission = pending_commission - NEW.commission_amount,
      paid_commission    = paid_commission + NEW.commission_amount
    WHERE id = NEW.influencer_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_influencer_commission ON public.commission_transactions;
CREATE TRIGGER trg_influencer_commission
AFTER INSERT OR UPDATE ON public.commission_transactions
FOR EACH ROW EXECUTE FUNCTION update_influencer_on_commission();

CREATE OR REPLACE FUNCTION update_influencer_clicks()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.influencer_profiles
  SET total_clicks = total_clicks + 1
  WHERE id = NEW.influencer_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_influencer_click ON public.influencer_clicks;
CREATE TRIGGER trg_influencer_click
AFTER INSERT ON public.influencer_clicks
FOR EACH ROW EXECUTE FUNCTION update_influencer_clicks();

-- 7. Indexes
CREATE INDEX IF NOT EXISTS idx_influencer_clicks_inf ON public.influencer_clicks(influencer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_influencer_clicks_visitor ON public.influencer_clicks(visitor_id);
CREATE INDEX IF NOT EXISTS idx_commission_influencer ON public.commission_transactions(influencer_id, status);
CREATE INDEX IF NOT EXISTS idx_commission_order ON public.commission_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payouts_influencer ON public.influencer_payouts(influencer_id);

-- 8. RLS Policies
ALTER TABLE public.influencer_profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.influencer_clicks       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.influencer_payouts      ENABLE ROW LEVEL SECURITY;

-- Influencer Policies
DROP POLICY IF EXISTS "Influencer sees own profile" ON public.influencer_profiles;
CREATE POLICY "Influencer sees own profile"
  ON public.influencer_profiles FOR SELECT
  USING (id = auth.uid());

DROP POLICY IF EXISTS "Influencer sees own commissions" ON public.commission_transactions;
CREATE POLICY "Influencer sees own commissions"
  ON public.commission_transactions FOR SELECT
  USING (influencer_id = auth.uid());

DROP POLICY IF EXISTS "Influencer sees own clicks" ON public.influencer_clicks;
CREATE POLICY "Influencer sees own clicks"
  ON public.influencer_clicks FOR SELECT
  USING (influencer_id = auth.uid());

-- Admin Policies
DROP POLICY IF EXISTS "Admin full access influencer_profiles" ON public.influencer_profiles;
CREATE POLICY "Admin full access influencer_profiles"
  ON public.influencer_profiles FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  ));

DROP POLICY IF EXISTS "Admin full access commissions" ON public.commission_transactions;
CREATE POLICY "Admin full access commissions"
  ON public.commission_transactions FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  ));

DROP POLICY IF EXISTS "Admin full access payouts" ON public.influencer_payouts;
CREATE POLICY "Admin full access payouts"
  ON public.influencer_payouts FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  ));

DROP POLICY IF EXISTS "Admin full access influencer_clicks" ON public.influencer_clicks;
CREATE POLICY "Admin full access influencer_clicks"
  ON public.influencer_clicks FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  ));
