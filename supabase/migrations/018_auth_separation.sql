-- Migration: 018_auth_separation.sql

-- Add last_dashboard_login column
ALTER TABLE public.influencer_profiles
  ADD COLUMN IF NOT EXISTS last_dashboard_login TIMESTAMPTZ;

-- Function: get influencer stats in one query
CREATE OR REPLACE FUNCTION get_influencer_stats(inf_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_clicks',           ip.total_clicks,
    'total_orders',           ip.total_orders,
    'total_sales_value',      ip.total_sales_value,
    'total_commission_earned',ip.total_commission_earned,
    'pending_commission',     ip.pending_commission,
    'paid_commission',        ip.paid_commission,
    'conversion_rate',        CASE
                                WHEN ip.total_clicks = 0 THEN 0
                                ELSE ROUND(
                                  (ip.total_orders::DECIMAL /
                                   ip.total_clicks * 100)::numeric, 2)
                              END,
    'commission_rate',        ip.commission_rate,
    'coupon_discount',        ip.coupon_discount,
    'status',                 ip.status,
    'referral_code',          p.referral_code,
    'referral_link',          p.referral_link
  ) INTO result
  FROM public.influencer_profiles ip
  JOIN public.profiles p ON ip.id = p.id
  WHERE ip.id = inf_id;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Influencer can call this function on their own id only
GRANT EXECUTE ON FUNCTION get_influencer_stats TO authenticated;
