-- ============================================================
--  LavishOrganic — COMPLETE DATABASE SETUP
--  Run this ENTIRE file in Supabase SQL Editor in ONE go.
--
--  Go to: https://supabase.com/dashboard
--  → Your Project → SQL Editor → New Query → Paste → Run
-- ============================================================


-- ============================================================
-- PART 1: INITIAL SCHEMA (tables, indexes, base triggers)
-- ============================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'influencer')),
  referral_code TEXT UNIQUE,
  referred_by UUID REFERENCES profiles(id),
  total_orders INT DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- ADDRESSES
-- ============================================================
CREATE TABLE IF NOT EXISTS addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  line1 TEXT NOT NULL,
  line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION ensure_single_default_address()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.is_default = TRUE THEN
    UPDATE addresses SET is_default = FALSE
    WHERE user_id = NEW.user_id AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_single_default_address
  AFTER INSERT OR UPDATE ON addresses
  FOR EACH ROW WHEN (NEW.is_default = TRUE)
  EXECUTE FUNCTION ensure_single_default_address();

-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  meta_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PRODUCTS
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  short_description TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  price DECIMAL(10,2) NOT NULL,
  compare_price DECIMAL(10,2),
  cost_price DECIMAL(10,2),
  sku TEXT UNIQUE,
  weight DECIMAL(8,2),
  stock_quantity INT DEFAULT 0,
  low_stock_threshold INT DEFAULT 10,
  track_inventory BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  tags TEXT[],
  ingredients TEXT,
  how_to_use TEXT,
  benefits TEXT[],
  certifications TEXT[],
  hsn_code TEXT,
  gst_rate DECIMAL(5,2) DEFAULT 18.00,
  meta_title TEXT,
  meta_description TEXT,
  search_vector TSVECTOR,          -- updated by trigger below
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_search ON products USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);

-- Trigger to keep search_vector up to date
CREATE OR REPLACE FUNCTION products_search_vector_update()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_vector :=
    to_tsvector('english',
      coalesce(NEW.name, '') || ' ' ||
      coalesce(NEW.short_description, '') || ' ' ||
      coalesce(array_to_string(NEW.tags, ' '), '')
    );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_products_search_vector ON products;
CREATE TRIGGER trg_products_search_vector
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION products_search_vector_update();


-- ============================================================
-- PRODUCT IMAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  cloudinary_id TEXT,
  alt_text TEXT,
  sort_order INT DEFAULT 0,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id);

-- ============================================================
-- PRODUCT VARIANTS
-- ============================================================
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  value TEXT NOT NULL,
  price_modifier DECIMAL(8,2) DEFAULT 0,
  stock_quantity INT DEFAULT 0,
  sku TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- REVIEWS
-- ============================================================
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title TEXT,
  body TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_approved BOOLEAN DEFAULT FALSE,
  images TEXT[],
  helpful_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_approved ON reviews(is_approved);

-- ============================================================
-- ORDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'awaiting_cod_confirmation', 'confirmed', 'processing',
    'packed', 'shipped', 'out_for_delivery', 'delivered',
    'cancelled', 'returned', 'refunded'
  )),
  subtotal DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  shipping_amount DECIMAL(10,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  coupon_code TEXT,
  coupon_id UUID,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN (
    'pending', 'paid', 'failed', 'refunded', 'cod_pending'
  )),
  payment_method TEXT,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  shipping_address JSONB NOT NULL,
  billing_address JSONB,
  notes TEXT,
  influencer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  commission_amount DECIMAL(10,2) DEFAULT 0,
  shiprocket_order_id TEXT,
  tracking_number TEXT,
  tracking_url TEXT,
  estimated_delivery DATE,
  gst_invoice_number TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);

-- ============================================================
-- ORDER ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  variant_name TEXT,
  image_url TEXT,
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  gst_rate DECIMAL(5,2),
  hsn_code TEXT
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- ============================================================
-- CART ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id, variant_id)
);

-- ============================================================
-- WISHLIST ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS wishlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- ============================================================
-- COUPONS
-- ============================================================
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed', 'free_shipping', 'buy_x_get_y')),
  value DECIMAL(10,2),
  min_order_amount DECIMAL(10,2) DEFAULT 0,
  max_discount DECIMAL(10,2),
  usage_limit INT,
  used_count INT DEFAULT 0,
  per_user_limit INT DEFAULT 1,
  applicable_products UUID[],
  applicable_categories UUID[],
  influencer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(is_active);

-- ============================================================
-- COUPON USAGE
-- ============================================================
CREATE TABLE IF NOT EXISTS coupon_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  discount_amount DECIMAL(10,2),
  used_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- OFFERS / BANNERS
-- ============================================================
CREATE TABLE IF NOT EXISTS offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  link_url TEXT,
  type TEXT NOT NULL CHECK (type IN ('banner', 'popup', 'flash_sale', 'combo')),
  discount_percentage DECIMAL(5,2),
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INFLUENCER PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS influencer_profiles (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  instagram_handle TEXT,
  youtube_channel TEXT,
  follower_count INT,
  niche TEXT,
  why_join TEXT,
  commission_rate DECIMAL(5,2) DEFAULT 10.00,
  total_sales DECIMAL(10,2) DEFAULT 0,
  total_commission DECIMAL(10,2) DEFAULT 0,
  pending_commission DECIMAL(10,2) DEFAULT 0,
  paid_commission DECIMAL(10,2) DEFAULT 0,
  bank_name TEXT,
  account_number TEXT,
  ifsc_code TEXT,
  pan_number TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'approved', 'rejected', 'suspended'
  )),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES profiles(id),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- COMMISSION TRANSACTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS commission_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'approved', 'paid', 'cancelled'
  )),
  paid_at TIMESTAMPTZ,
  payment_reference TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT CHECK (type IN ('order', 'promo', 'review', 'commission', 'system')),
  is_read BOOLEAN DEFAULT FALSE,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);

-- ============================================================
-- SHIPROCKET TOKEN CACHE
-- ============================================================
CREATE TABLE IF NOT EXISTS shiprocket_tokens (
  id INT PRIMARY KEY DEFAULT 1,
  token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- ============================================================
-- STORE SETTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS store_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO store_settings (key, value) VALUES
  ('store_name', '"LavishOrganic"'),
  ('free_shipping_threshold', '499'),
  ('flat_shipping_rate', '49'),
  ('enable_cod', 'true'),
  ('social_instagram', '"https://instagram.com/lavishorganic"'),
  ('social_facebook', '"https://facebook.com/lavishorganic"'),
  ('whatsapp_number', '"919876543210"')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DO $$
DECLARE tables TEXT[] := ARRAY[
  'profiles','addresses','categories','products',
  'orders','influencer_profiles','cart_items'
];
t TEXT;
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS trg_%1$s_updated_at ON %1$s;
      CREATE TRIGGER trg_%1$s_updated_at
        BEFORE UPDATE ON %1$s
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    ', t);
  END LOOP;
END $$;


-- ============================================================
-- PART 2: ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE influencer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE shiprocket_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

-- Helper: check admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT COALESCE((auth.jwt() ->> 'user_role') = 'admin', FALSE);
$$;

-- Helper: check influencer or admin
CREATE OR REPLACE FUNCTION is_influencer_or_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT COALESCE((auth.jwt() ->> 'user_role') IN ('influencer', 'admin'), FALSE);
$$;

-- PROFILES
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id OR is_admin());
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id AND role = 'customer');
CREATE POLICY "profiles_update_admin" ON profiles FOR UPDATE USING (is_admin());

-- ADDRESSES
CREATE POLICY "addresses_select_own" ON addresses FOR SELECT USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "addresses_insert_own" ON addresses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "addresses_update_own" ON addresses FOR UPDATE USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "addresses_delete_own" ON addresses FOR DELETE USING (auth.uid() = user_id OR is_admin());

-- CATEGORIES (public read)
CREATE POLICY "categories_public_read" ON categories FOR SELECT USING (is_active = TRUE OR is_admin());
CREATE POLICY "categories_admin_write" ON categories FOR ALL USING (is_admin());

-- PRODUCTS (public read)
CREATE POLICY "products_public_read" ON products FOR SELECT USING (is_active = TRUE OR is_admin());
CREATE POLICY "products_admin_write" ON products FOR ALL USING (is_admin());

-- PRODUCT IMAGES (public read)
CREATE POLICY "product_images_public_read" ON product_images FOR SELECT USING (TRUE);
CREATE POLICY "product_images_admin_write" ON product_images FOR ALL USING (is_admin());

-- PRODUCT VARIANTS (public read)
CREATE POLICY "product_variants_public_read" ON product_variants FOR SELECT USING (TRUE);
CREATE POLICY "product_variants_admin_write" ON product_variants FOR ALL USING (is_admin());

-- REVIEWS
CREATE POLICY "reviews_public_read" ON reviews FOR SELECT USING (is_approved = TRUE OR auth.uid() = user_id OR is_admin());
CREATE POLICY "reviews_insert_auth" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id AND auth.uid() IS NOT NULL);
CREATE POLICY "reviews_update_own" ON reviews FOR UPDATE USING (auth.uid() = user_id AND is_approved = FALSE);
CREATE POLICY "reviews_admin_all" ON reviews FOR ALL USING (is_admin());

-- ORDERS
CREATE POLICY "orders_select_own" ON orders FOR SELECT USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "orders_insert_auth" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id AND auth.uid() IS NOT NULL);
CREATE POLICY "orders_update_admin" ON orders FOR UPDATE USING (is_admin());

-- ORDER ITEMS
CREATE POLICY "order_items_select_own" ON order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders o WHERE o.id = order_items.order_id AND (o.user_id = auth.uid() OR is_admin()))
);
CREATE POLICY "order_items_insert_auth" ON order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM orders o WHERE o.id = order_items.order_id AND o.user_id = auth.uid())
);

-- CART ITEMS
CREATE POLICY "cart_select_own" ON cart_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "cart_insert_own" ON cart_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cart_update_own" ON cart_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "cart_delete_own" ON cart_items FOR DELETE USING (auth.uid() = user_id);

-- WISHLIST
CREATE POLICY "wishlist_select_own" ON wishlist_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "wishlist_insert_own" ON wishlist_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "wishlist_delete_own" ON wishlist_items FOR DELETE USING (auth.uid() = user_id);

-- COUPONS
CREATE POLICY "coupons_public_read" ON coupons FOR SELECT USING (is_active = TRUE OR is_admin());
CREATE POLICY "coupons_admin_write" ON coupons FOR ALL USING (is_admin());

-- COUPON USAGE
CREATE POLICY "coupon_usage_own" ON coupon_usage FOR SELECT USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "coupon_usage_insert" ON coupon_usage FOR INSERT WITH CHECK (auth.uid() = user_id);

-- OFFERS
CREATE POLICY "offers_public_read" ON offers FOR SELECT USING (is_active = TRUE OR is_admin());
CREATE POLICY "offers_admin_write" ON offers FOR ALL USING (is_admin());

-- INFLUENCER PROFILES
CREATE POLICY "influencer_profiles_own" ON influencer_profiles FOR SELECT USING (auth.uid() = id OR is_admin());
CREATE POLICY "influencer_profiles_insert" ON influencer_profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "influencer_profiles_admin_update" ON influencer_profiles FOR UPDATE USING (is_admin());

-- COMMISSION TRANSACTIONS
CREATE POLICY "commission_own" ON commission_transactions FOR SELECT USING (auth.uid() = influencer_id OR is_admin());
CREATE POLICY "commission_admin_write" ON commission_transactions FOR ALL USING (is_admin());

-- NOTIFICATIONS
CREATE POLICY "notifications_own" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "notifications_admin_insert" ON notifications FOR INSERT WITH CHECK (is_admin() OR auth.uid() IS NOT NULL);

-- SHIPROCKET TOKENS (admin only)
CREATE POLICY "shiprocket_tokens_admin" ON shiprocket_tokens FOR ALL USING (is_admin());

-- STORE SETTINGS (public read, admin write)
CREATE POLICY "store_settings_public_read" ON store_settings FOR SELECT USING (TRUE);
CREATE POLICY "store_settings_admin_write" ON store_settings FOR ALL USING (is_admin());


-- ============================================================
-- PART 3: AUTH HOOK — JWT Role Injection
-- ============================================================

GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.handle_new_user TO supabase_auth_admin;

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claims JSONB;
  user_role TEXT;
  user_id UUID;
BEGIN
  user_id := (event->>'user_id')::UUID;

  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = user_id;

  claims := event->'claims';

  IF user_role IS NOT NULL THEN
    claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));
  ELSE
    claims := jsonb_set(claims, '{user_role}', '"customer"');
  END IF;

  RETURN jsonb_set(event, '{claims}', claims);

EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'custom_access_token_hook error: %', SQLERRM;
  RETURN event;
END;
$$;

GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM PUBLIC;


-- ============================================================
-- PART 4: DB FUNCTIONS & BUSINESS LOGIC TRIGGERS
-- ============================================================

-- Order number: LO-YYYYMMDD-0001
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE
  seq_val BIGINT;
  today_str TEXT;
BEGIN
  seq_val := nextval('order_number_seq');
  today_str := TO_CHAR(NOW(), 'YYYYMMDD');
  RETURN 'LO-' || today_str || '-' || LPAD(seq_val::TEXT, 4, '0');
END;
$$;

-- GST Invoice number: LO/2025-26/0001
CREATE SEQUENCE IF NOT EXISTS gst_invoice_seq START 1;

CREATE OR REPLACE FUNCTION generate_gst_invoice_number()
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE
  seq_val BIGINT;
  fy_start INT;
  fy_end INT;
  current_month INT;
  current_year INT;
BEGIN
  seq_val := nextval('gst_invoice_seq');
  current_month := EXTRACT(MONTH FROM NOW())::INT;
  current_year := EXTRACT(YEAR FROM NOW())::INT;

  IF current_month >= 4 THEN
    fy_start := current_year;
    fy_end := current_year + 1;
  ELSE
    fy_start := current_year - 1;
    fy_end := current_year;
  END IF;

  RETURN 'LO/' || fy_start || '-' || RIGHT(fy_end::TEXT, 2) || '/' || LPAD(seq_val::TEXT, 4, '0');
END;
$$;

-- Atomic coupon usage increment (race-condition safe)
CREATE OR REPLACE FUNCTION increment_coupon_usage(coupon_code TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql AS $$
DECLARE
  coupon_record RECORD;
BEGIN
  SELECT * INTO coupon_record FROM coupons
  WHERE code = coupon_code AND is_active = TRUE FOR UPDATE;

  IF NOT FOUND THEN RETURN FALSE; END IF;

  IF coupon_record.usage_limit IS NOT NULL
     AND coupon_record.used_count >= coupon_record.usage_limit THEN
    RETURN FALSE;
  END IF;

  UPDATE coupons SET used_count = used_count + 1 WHERE code = coupon_code;
  RETURN TRUE;
END;
$$;

-- Stock check before order item insert
CREATE OR REPLACE FUNCTION check_stock_before_order()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  available_stock INT;
BEGIN
  IF NEW.variant_id IS NOT NULL THEN
    SELECT stock_quantity INTO available_stock FROM product_variants WHERE id = NEW.variant_id;
    IF available_stock IS NOT NULL AND available_stock < NEW.quantity THEN
      RAISE EXCEPTION 'Insufficient stock for variant. Available: %, Requested: %', available_stock, NEW.quantity;
    END IF;
  ELSE
    SELECT stock_quantity INTO available_stock FROM products WHERE id = NEW.product_id;
    IF available_stock IS NOT NULL AND available_stock < NEW.quantity THEN
      RAISE EXCEPTION 'Insufficient stock. Available: %, Requested: %', available_stock, NEW.quantity;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_check_stock
  BEFORE INSERT ON order_items
  FOR EACH ROW EXECUTE FUNCTION check_stock_before_order();

-- Deduct stock when order is confirmed
CREATE OR REPLACE FUNCTION deduct_stock_on_confirm()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status IN ('confirmed', 'processing')
     AND (OLD.status = 'pending' OR OLD.status = 'awaiting_cod_confirmation') THEN

    UPDATE product_variants pv
    SET stock_quantity = pv.stock_quantity - oi.quantity
    FROM order_items oi
    WHERE oi.order_id = NEW.id AND oi.variant_id IS NOT NULL AND pv.id = oi.variant_id;

    UPDATE products p
    SET stock_quantity = p.stock_quantity - oi.quantity
    FROM order_items oi
    WHERE oi.order_id = NEW.id AND oi.variant_id IS NULL AND p.id = oi.product_id;

  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_deduct_stock
  AFTER UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION deduct_stock_on_confirm();

-- Update customer stats on delivery
CREATE OR REPLACE FUNCTION update_customer_stats_on_delivery()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    UPDATE profiles
    SET total_orders = total_orders + 1, total_spent = total_spent + NEW.total
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_customer_stats
  AFTER UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_customer_stats_on_delivery();

-- Auto-generate order number
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := generate_order_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION set_order_number();

-- Product ratings view
CREATE OR REPLACE VIEW product_ratings AS
SELECT
  product_id,
  COUNT(*) as review_count,
  ROUND(AVG(rating)::NUMERIC, 1) as average_rating,
  COUNT(*) FILTER (WHERE rating = 5) as five_star,
  COUNT(*) FILTER (WHERE rating = 4) as four_star,
  COUNT(*) FILTER (WHERE rating = 3) as three_star,
  COUNT(*) FILTER (WHERE rating = 2) as two_star,
  COUNT(*) FILTER (WHERE rating = 1) as one_star
FROM reviews
WHERE is_approved = TRUE
GROUP BY product_id;

-- Low stock alerts view
CREATE OR REPLACE VIEW low_stock_products AS
SELECT
  p.id, p.name, p.sku, p.stock_quantity, p.low_stock_threshold,
  c.name as category_name
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.track_inventory = TRUE AND p.is_active = TRUE
  AND p.stock_quantity <= p.low_stock_threshold
ORDER BY p.stock_quantity ASC;


-- ============================================================
-- PART 5: SEED DATA (categories, products, reviews, coupons)
-- ============================================================

-- Categories (5)
INSERT INTO categories (id, name, slug, description, image_url, sort_order, is_active, meta_title, meta_description) VALUES
('11111111-0000-0000-0000-000000000001', 'Face Care', 'face-care',
 'Nourish your skin with our certified organic face care range.',
 'https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?w=800',
 1, TRUE, 'Organic Face Care Products | LavishOrganic',
 'Shop 100% organic face care — cleansers, serums, moisturizers. Dermatologist tested.'),
('11111111-0000-0000-0000-000000000002', 'Body Care', 'body-care',
 'Indulge your body with handcrafted organic lotions, scrubs, and oils.',
 'https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=800',
 2, TRUE, 'Organic Body Care Products | LavishOrganic',
 'Natural body lotions, scrubs, and oils. 100% organic, cruelty-free.'),
('11111111-0000-0000-0000-000000000003', 'Hair Care', 'hair-care',
 'Revitalize your hair with our plant-powered hair care collection.',
 'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=800',
 3, TRUE, 'Organic Hair Care Products | LavishOrganic',
 'Natural hair care — shampoos, conditioners, hair oils. Chemical-free.'),
('11111111-0000-0000-0000-000000000004', 'Wellness', 'wellness',
 'Support your inner health with our wellness range.',
 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800',
 4, TRUE, 'Organic Wellness Products | LavishOrganic',
 'Herbal wellness products, essential oils, and aromatherapy.'),
('11111111-0000-0000-0000-000000000005', 'Combo Sets', 'combo-sets',
 'Curated organic combo sets. Save more when you bundle.',
 'https://images.unsplash.com/photo-1512207736890-6ffed8a84e8d?w=800',
 5, TRUE, 'Organic Gift Sets & Combos | LavishOrganic',
 'Curated organic skincare gift sets and combo packs.')
ON CONFLICT (id) DO NOTHING;

-- Products (10)
INSERT INTO products (id, name, slug, short_description, description, category_id,
  price, compare_price, cost_price, sku, weight,
  stock_quantity, is_active, is_featured, tags, ingredients, how_to_use,
  benefits, certifications, hsn_code, gst_rate, meta_title, meta_description)
VALUES
('22222222-0000-0000-0000-000000000001',
 'Rose Glow Vitamin C Face Serum', 'rose-glow-vitamin-c-face-serum',
 'Brightening serum with pure rose extract and 20% Vitamin C. Fades dark spots in 4 weeks.',
 'Our Rose Glow Vitamin C Face Serum is a potent blend of 20% stabilized Vitamin C, Bulgarian rose extract, and hyaluronic acid.',
 '11111111-0000-0000-0000-000000000001',
 799.00, 1299.00, 280.00, 'LO-FC-001', 30.00, 150, TRUE, TRUE,
 ARRAY['vitamin-c','brightening','anti-aging','rose','serum','face'],
 'Aqua, Ascorbic Acid (Vitamin C) 20%, Rosa Damascena Flower Water, Sodium Hyaluronate, Niacinamide, Ferulic Acid, Glycerin',
 'Apply 3-4 drops to clean, dry face and neck in the morning. Follow with moisturizer and SPF.',
 ARRAY['Brightens dull skin','Fades dark spots','Reduces fine lines','Intense hydration'],
 ARRAY['ECOCERT Certified','Cruelty Free','Dermatologist Tested','Vegan'],
 '33049910', 18.00,
 'Rose Glow Vitamin C Face Serum | LavishOrganic',
 'Buy Rose Glow Vitamin C Serum. 20% Vitamin C + Rose Extract. Fades dark spots in 4 weeks.'),

('22222222-0000-0000-0000-000000000002',
 'Neem & Turmeric Purifying Face Wash', 'neem-turmeric-purifying-face-wash',
 'Antibacterial face wash with neem, turmeric & tea tree. Clears acne and controls oil.',
 'Our Neem & Turmeric Face Wash harnesses the ancient power of Ayurvedic ingredients.',
 '11111111-0000-0000-0000-000000000001',
 349.00, 499.00, 120.00, 'LO-FC-002', 100.00, 200, TRUE, TRUE,
 ARRAY['neem','turmeric','acne','oily-skin','face-wash','ayurvedic'],
 'Aqua, Azadirachta Indica (Neem) Leaf Extract, Curcuma Longa (Turmeric) Extract, Melaleuca Alternifolia (Tea Tree) Leaf Oil',
 'Wet face. Apply a small amount and massage in circular motions for 60 seconds. Rinse thoroughly.',
 ARRAY['Fights acne bacteria','Controls excess oil','Brightens skin','Unclogs pores'],
 ARRAY['Sulphate Free','Paraben Free','Cruelty Free','Vegan','Made in India'],
 '33049910', 18.00,
 'Neem & Turmeric Face Wash | LavishOrganic',
 'Buy Neem Turmeric Face Wash. Ayurvedic, sulphate-free. Controls oil, fights bacteria.'),

('22222222-0000-0000-0000-000000000003',
 'Saffron Glow Night Repair Cream', 'saffron-glow-night-repair-cream',
 'Luxurious overnight repair cream with pure saffron, retinol & shea butter. Wake up glowing.',
 'Indulge in the luxury of pure saffron with our Night Repair Cream.',
 '11111111-0000-0000-0000-000000000001',
 1199.00, 1799.00, 420.00, 'LO-FC-003', 50.00, 80, TRUE, TRUE,
 ARRAY['saffron','night-cream','anti-aging','brightening','bakuchiol'],
 'Aqua, Butyrospermum Parkii (Shea) Butter, Crocus Sativus (Saffron) Extract, Bakuchiol, Vitamin E, Niacinamide, Squalane',
 'Apply a generous amount to cleansed face and neck each evening. Leave overnight.',
 ARRAY['Repairs overnight','Reduces fine lines','Brightens complexion','Deep moisturization'],
 ARRAY['ECOCERT Certified','Cruelty Free','Dermatologist Tested'],
 '33049910', 18.00,
 'Saffron Night Cream | LavishOrganic',
 'Buy Saffron Glow Night Repair Cream. Pure kesar + bakuchiol. Anti-aging overnight repair.'),

('22222222-0000-0000-0000-000000000004',
 'Coconut & Vanilla Body Butter Lotion', 'coconut-vanilla-body-butter-lotion',
 '24-hour moisturizing body lotion with coconut oil, vanilla, and shea.',
 'Our Coconut & Vanilla Body Butter Lotion melts into skin like silk.',
 '11111111-0000-0000-0000-000000000002',
 499.00, 749.00, 175.00, 'LO-BC-001', 200.00, 175, TRUE, FALSE,
 ARRAY['coconut','vanilla','body-lotion','moisturizer','dry-skin'],
 'Aqua, Cocos Nucifera (Coconut) Oil, Butyrospermum Parkii (Shea) Butter, Vanilla Planifolia Extract, Glycerin, Vitamin E',
 'Apply liberally to body after bath or shower. For best results, apply to slightly damp skin.',
 ARRAY['24-hour moisturization','Softens skin','Non-greasy','Delightful fragrance'],
 ARRAY['Paraben Free','Sulphate Free','Cruelty Free','Vegan'],
 '33049910', 18.00,
 'Coconut Vanilla Body Lotion | LavishOrganic',
 'Buy Coconut & Vanilla Body Butter Lotion. 24-hour moisture. Cold-pressed coconut oil.'),

('22222222-0000-0000-0000-000000000005',
 'Arabica Coffee Exfoliating Body Scrub', 'arabica-coffee-exfoliating-body-scrub',
 'Energizing body scrub with fine arabica coffee grounds, coconut oil, and brown sugar.',
 'Wake up your skin with our Arabica Coffee Body Scrub.',
 '11111111-0000-0000-0000-000000000002',
 449.00, 649.00, 160.00, 'LO-BC-002', 200.00, 130, TRUE, FALSE,
 ARRAY['coffee','scrub','exfoliating','cellulite','body-care'],
 'Coffea Arabica (Coffee) Seed Powder, Saccharum Officinarum (Brown Sugar), Cocos Nucifera (Coconut) Oil, Vanilla Planifolia Extract',
 'In shower, apply to wet skin in circular motions. Massage 2-3 minutes. Rinse. Use 2-3x per week.',
 ARRAY['Removes dead skin','Improves circulation','Reduces cellulite appearance','Moisturizes'],
 ARRAY['Natural Ingredients','Cruelty Free','Vegan','Made in India'],
 '33049910', 18.00,
 'Coffee Body Scrub | LavishOrganic',
 'Buy Arabica Coffee Exfoliating Body Scrub. Natural exfoliator for smooth, glowing skin.'),

('22222222-0000-0000-0000-000000000006',
 'Bhringraj & Amla Ayurvedic Hair Oil', 'bhringraj-amla-ayurvedic-hair-oil',
 'Powerful Ayurvedic hair oil with bhringraj, amla & brahmi for hair growth and strength.',
 'Our Bhringraj & Amla Hair Oil is a time-tested Ayurvedic formulation.',
 '11111111-0000-0000-0000-000000000003',
 399.00, 599.00, 140.00, 'LO-HC-001', 100.00, 160, TRUE, TRUE,
 ARRAY['bhringraj','amla','hair-oil','hair-growth','ayurvedic'],
 'Sesamum Indicum (Sesame) Oil, Eclipta Alba (Bhringraj) Extract, Phyllanthus Emblica (Amla) Extract, Bacopa Monnieri (Brahmi) Extract',
 'Warm oil slightly. Massage into scalp for 10 minutes. Leave 1-2 hours. Wash with mild shampoo.',
 ARRAY['Promotes hair growth','Reduces hair fall','Prevents greying','Strengthens roots'],
 ARRAY['Ayurvedic','Cold-Pressed','Cruelty Free','Chemical Free'],
 '33059000', 18.00,
 'Bhringraj Amla Hair Oil | LavishOrganic',
 'Buy Bhringraj Amla Ayurvedic Hair Oil. Reduces hair fall, promotes growth. Chemical-free.'),

('22222222-0000-0000-0000-000000000007',
 'Plant Keratin Repair Shampoo', 'plant-keratin-repair-shampoo',
 'Sulphate-free repair shampoo with plant keratin, argan oil, and biotin for damaged hair.',
 'Restore damaged, frizzy hair with our Plant Keratin Repair Shampoo.',
 '11111111-0000-0000-0000-000000000003',
 549.00, 799.00, 195.00, 'LO-HC-002', 200.00, 120, TRUE, FALSE,
 ARRAY['shampoo','keratin','repair','damaged-hair','argan','sulphate-free'],
 'Aqua, Cocamidopropyl Betaine, Hydrolyzed Keratin, Argania Spinosa (Argan) Kernel Oil, Biotin, Panthenol, Glycerin',
 'Wet hair. Apply shampoo, massage scalp 2 minutes. Rinse. Use 3 times per week.',
 ARRAY['Repairs damage','Reduces frizz','Strengthens hair','Adds shine','Colour-safe'],
 ARRAY['Sulphate Free','Paraben Free','Cruelty Free','Colour Safe'],
 '33059000', 18.00,
 'Plant Keratin Repair Shampoo | LavishOrganic',
 'Buy Plant Keratin Repair Shampoo. Sulphate-free, with argan oil and biotin.'),

('22222222-0000-0000-0000-000000000008',
 'Lavender & Chamomile Sleep Pillow Mist', 'lavender-chamomile-sleep-pillow-mist',
 'Calming pillow mist with pure lavender, chamomile & valerian for deep, restful sleep.',
 'Our Lavender & Chamomile Sleep Mist is your nightly ritual for deep, restful sleep.',
 '11111111-0000-0000-0000-000000000004',
 299.00, 449.00, 100.00, 'LO-WL-001', 100.00, 200, TRUE, FALSE,
 ARRAY['lavender','sleep','aromatherapy','pillow-mist','chamomile'],
 'Aqua, Lavandula Angustifolia (Lavender) Essential Oil, Matricaria Chamomilla (Chamomile) Extract, Valeriana Officinalis Extract',
 'Shake well. Hold 20-30cm from pillow and spray 2-3 times before bedtime. Breathe deeply.',
 ARRAY['Promotes deep sleep','Reduces anxiety','Calming aroma','Drug-free','Natural'],
 ARRAY['Natural','Vegan','Cruelty Free'],
 '33073000', 18.00,
 'Lavender Sleep Pillow Mist | LavishOrganic',
 'Buy Lavender Chamomile Sleep Mist. Natural aromatherapy spray for restful sleep.'),

('22222222-0000-0000-0000-000000000009',
 'Moroccan Rose Clay Purifying Face Mask', 'moroccan-rose-clay-purifying-face-mask',
 'Deep-pore cleansing clay mask with Moroccan rose clay, kaolin & rose water.',
 'Our Moroccan Rose Clay Face Mask combines deep-cleansing pink clay with soothing rose water.',
 '11111111-0000-0000-0000-000000000001',
 599.00, 899.00, 210.00, 'LO-FC-004', 75.00, 100, TRUE, FALSE,
 ARRAY['clay-mask','rose-clay','pore-minimizing','deep-cleanse','face-mask'],
 'Kaolin Clay, Rosa Canina (Rose Hip) Clay, Rosa Damascena Flower Water, Glycerin, Aloe Barbadensis Gel, Vitamin E',
 'Apply even layer to clean, dry face. Leave 10-15 minutes. Rinse with warm water. Use 1-2x per week.',
 ARRAY['Deep cleanses pores','Controls oil','Smooths skin texture','Reduces blackheads'],
 ARRAY['Natural Clay','Cruelty Free','Vegan','Dermatologist Tested'],
 '33049910', 18.00,
 'Rose Clay Face Mask | LavishOrganic',
 'Buy Moroccan Rose Clay Face Mask. Deep pore cleansing, pore-minimizing.'),

('22222222-0000-0000-0000-000000000010',
 'Glow Starter Kit — Face Care Essentials', 'glow-starter-kit-face-care-essentials',
 'Complete face care starter kit: face wash, Vitamin C serum, and night cream. Save 30%.',
 'The LavishOrganic Glow Starter Kit includes our bestselling face wash, serum, and night cream.',
 '11111111-0000-0000-0000-000000000005',
 1599.00, 2447.00, 560.00, 'LO-CB-001', 180.00, 60, TRUE, TRUE,
 ARRAY['combo','gift-set','starter-kit','face-care','bestseller'],
 'Contains: Neem & Turmeric Face Wash (100ml), Rose Glow Vitamin C Serum (30ml), Saffron Night Cream (50ml)',
 'Morning: Cleanse → Vitamin C serum → SPF. Evening: Cleanse → Night Cream.',
 ARRAY['Complete skincare routine','Save 30% vs individual','Gift-ready packaging','3 bestsellers in one'],
 ARRAY['ECOCERT Certified','Cruelty Free','Dermatologist Tested','Vegan'],
 '33049910', 18.00,
 'Glow Starter Kit | LavishOrganic Face Care Set',
 'Buy LavishOrganic Glow Starter Kit. 3-piece face care set. Save 30%. Perfect gift.')
ON CONFLICT (id) DO NOTHING;

-- Product Images
INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES
('22222222-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=800', 'Rose Glow Vitamin C Serum', 0, TRUE),
('22222222-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800', 'Rose Glow Serum texture', 1, FALSE),
('22222222-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800', 'Neem Turmeric Face Wash', 0, TRUE),
('22222222-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=800', 'Saffron Night Cream', 0, TRUE),
('22222222-0000-0000-0000-000000000004', 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800', 'Coconut Vanilla Body Lotion', 0, TRUE),
('22222222-0000-0000-0000-000000000005', 'https://images.unsplash.com/photo-1601612628452-9e99ced43524?w=800', 'Coffee Body Scrub', 0, TRUE),
('22222222-0000-0000-0000-000000000006', 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=800', 'Bhringraj Amla Hair Oil', 0, TRUE),
('22222222-0000-0000-0000-000000000007', 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800', 'Plant Keratin Shampoo', 0, TRUE),
('22222222-0000-0000-0000-000000000008', 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800', 'Lavender Sleep Mist', 0, TRUE),
('22222222-0000-0000-0000-000000000009', 'https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?w=800', 'Rose Clay Face Mask', 0, TRUE),
('22222222-0000-0000-0000-000000000010', 'https://images.unsplash.com/photo-1512207736890-6ffed8a84e8d?w=800', 'Glow Starter Kit', 0, TRUE)
ON CONFLICT DO NOTHING;

-- Product Variants
INSERT INTO product_variants (product_id, name, value, price_modifier, stock_quantity, sku) VALUES
('22222222-0000-0000-0000-000000000001', 'Size', '30ml', 0, 100, 'LO-FC-001-30ML'),
('22222222-0000-0000-0000-000000000001', 'Size', '60ml', 400, 50, 'LO-FC-001-60ML'),
('22222222-0000-0000-0000-000000000002', 'Size', '100ml', 0, 120, 'LO-FC-002-100ML'),
('22222222-0000-0000-0000-000000000002', 'Size', '200ml', 200, 80, 'LO-FC-002-200ML'),
('22222222-0000-0000-0000-000000000006', 'Size', '100ml', 0, 100, 'LO-HC-001-100ML'),
('22222222-0000-0000-0000-000000000006', 'Size', '200ml', 250, 60, 'LO-HC-001-200ML')
ON CONFLICT DO NOTHING;

-- Coupons
INSERT INTO coupons (code, type, value, min_order_amount, max_discount, usage_limit, per_user_limit, is_active, valid_from, valid_until) VALUES
('WELCOME10', 'percentage', 10.00, 299.00, 150.00, NULL, 1, TRUE, NOW(), NOW() + INTERVAL '1 year'),
('ORGANIC20', 'percentage', 20.00, 599.00, 300.00, 500, 1, TRUE, NOW(), NOW() + INTERVAL '6 months')
ON CONFLICT (code) DO NOTHING;

-- Flash Sale Offer
INSERT INTO offers (title, description, image_url, link_url, type, discount_percentage, starts_at, ends_at, is_active, sort_order) VALUES
(
  'Summer Glow Sale — Up to 40% Off',
  'Treat your skin this summer! Get up to 40% off on our bestselling face care range.',
  'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=1920',
  '/shop?category=face-care&sort=discount',
  'flash_sale', 40.00, NOW(), NOW() + INTERVAL '7 days', TRUE, 1
);

-- Sample Reviews (approved, no user_id — public reviews)
INSERT INTO reviews (product_id, rating, title, body, is_verified, is_approved, created_at) VALUES
('22222222-0000-0000-0000-000000000001', 5,
 'Absolutely love this serum!',
 'I''ve been using the Rose Glow Serum for 6 weeks and the difference is incredible. My dark spots have faded significantly. Definitely repurchasing!',
 TRUE, TRUE, NOW() - INTERVAL '15 days'),
('22222222-0000-0000-0000-000000000001', 4,
 'Great results, mild tingling initially',
 'The serum works really well — my skin tone has evened out. Very happy with the purchase.',
 TRUE, TRUE, NOW() - INTERVAL '8 days'),
('22222222-0000-0000-0000-000000000002', 5,
 'Best face wash for oily skin',
 'My face doesn''t feel stripped but it clears all the oil and keeps breakouts at bay. Love that it''s sulphate-free.',
 TRUE, TRUE, NOW() - INTERVAL '20 days'),
('22222222-0000-0000-0000-000000000006', 5,
 'Reduced hair fall in 3 weeks',
 'I was losing so much hair. Used this 3x a week and in 3 weeks my hairfall reduced noticeably. Results speak for themselves.',
 TRUE, TRUE, NOW() - INTERVAL '12 days'),
('22222222-0000-0000-0000-000000000010', 5,
 'Perfect gift for my wife',
 'Bought the Glow Starter Kit as an anniversary gift. The packaging is gorgeous. My wife loved it!',
 FALSE, TRUE, NOW() - INTERVAL '5 days');

-- ============================================================
-- ALL DONE! 
--
-- NEXT STEPS (manual, in Supabase Dashboard):
--
-- 1. Authentication → Hooks → "Customize Access Token (JWT) Claims"
--    → Select function: public.custom_access_token_hook → Save
--
-- 2. Authentication → Providers → Enable "Google" OAuth
--    (Add your Google Client ID + Secret)
--
-- 3. Set your first admin user (after you sign up):
--    UPDATE profiles SET role = 'admin' WHERE id = 'YOUR-USER-UUID';
-- ============================================================
