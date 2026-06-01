const fs = require('fs');
const envFile = fs.readFileSync('.env.local', 'utf8');
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim().replace(/^"|"$/g, '');
});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const sql = `
  ALTER TABLE public.influencer_profiles
    ADD COLUMN IF NOT EXISTS coupon_discount DECIMAL(5,2) DEFAULT 10.00,
    ADD COLUMN IF NOT EXISTS commission_on_non_coupon_orders BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS non_coupon_commission_rate DECIMAL(5,2) DEFAULT 10.00,
    ADD COLUMN IF NOT EXISTS notes TEXT,
    ADD COLUMN IF NOT EXISTS total_clicks INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_orders INT DEFAULT 0;

  CREATE OR REPLACE FUNCTION get_influencer_stats(inf_id UUID)
  RETURNS JSON AS $$
  DECLARE
    result JSON;
  BEGIN
    SELECT json_build_object(
      'total_clicks',           ip.total_clicks,
      'total_orders',           ip.total_orders,
      'total_sales',            ip.total_sales,
      'total_commission',       ip.total_commission,
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
      'commission_on_non_coupon_orders', ip.commission_on_non_coupon_orders,
      'non_coupon_commission_rate', ip.non_coupon_commission_rate,
      'status',                 ip.status,
      'referral_code',          p.referral_code,
      'referral_link',          'https://lavishorganic.com?ref=' || p.referral_code
    ) INTO result
    FROM public.influencer_profiles ip
    JOIN public.profiles p ON ip.id = p.id
    WHERE ip.id = inf_id;

    RETURN result;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;
`;

async function applyFix() {
  // We can't use rpc to run arbitrary sql.
  // Wait, does Supabase JS have a way to run arbitrary sql without rpc? No.
  // Let me just write it as a migration and ask user to run it or run via psql if possible.
  console.log("SQL to run:", sql);
}
applyFix();
