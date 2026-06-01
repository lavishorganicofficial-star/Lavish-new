-- ============================================================
-- Migration 002: Row Level Security Policies
-- LavishOrganic E-Commerce Database
-- ============================================================

-- Enable RLS on all tables
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

-- Helper function: check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT COALESCE(
    (auth.jwt() ->> 'user_role') = 'admin',
    FALSE
  );
$$;

-- Helper function: check if current user is influencer or admin
CREATE OR REPLACE FUNCTION is_influencer_or_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT COALESCE(
    (auth.jwt() ->> 'user_role') IN ('influencer', 'admin'),
    FALSE
  );
$$;

-- ============================================================
-- PROFILES
-- ============================================================
-- Users can read their own profile; admins can read all
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id OR is_admin());

-- Users can update their own profile
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = 'customer'); -- can't self-elevate role

-- Admins can update any profile (including role changes)
CREATE POLICY "profiles_update_admin" ON profiles
  FOR UPDATE USING (is_admin());

-- ============================================================
-- ADDRESSES
-- ============================================================
CREATE POLICY "addresses_select_own" ON addresses
  FOR SELECT USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "addresses_insert_own" ON addresses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "addresses_update_own" ON addresses
  FOR UPDATE USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "addresses_delete_own" ON addresses
  FOR DELETE USING (auth.uid() = user_id OR is_admin());

-- ============================================================
-- CATEGORIES (public read, admin write)
-- ============================================================
CREATE POLICY "categories_public_read" ON categories
  FOR SELECT USING (is_active = TRUE OR is_admin());

CREATE POLICY "categories_admin_write" ON categories
  FOR ALL USING (is_admin());

-- ============================================================
-- PRODUCTS (public read, admin write)
-- ============================================================
CREATE POLICY "products_public_read" ON products
  FOR SELECT USING (is_active = TRUE OR is_admin());

CREATE POLICY "products_admin_write" ON products
  FOR ALL USING (is_admin());

-- ============================================================
-- PRODUCT IMAGES (public read, admin write)
-- ============================================================
CREATE POLICY "product_images_public_read" ON product_images
  FOR SELECT USING (TRUE);

CREATE POLICY "product_images_admin_write" ON product_images
  FOR ALL USING (is_admin());

-- ============================================================
-- PRODUCT VARIANTS (public read, admin write)
-- ============================================================
CREATE POLICY "product_variants_public_read" ON product_variants
  FOR SELECT USING (TRUE);

CREATE POLICY "product_variants_admin_write" ON product_variants
  FOR ALL USING (is_admin());

-- ============================================================
-- REVIEWS
-- ============================================================
-- Public read of approved reviews
CREATE POLICY "reviews_public_read" ON reviews
  FOR SELECT USING (is_approved = TRUE OR auth.uid() = user_id OR is_admin());

-- Authenticated users can insert reviews (verified purchase check handled in API)
CREATE POLICY "reviews_insert_auth" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id AND auth.uid() IS NOT NULL);

-- Users can update their own (not yet approved) reviews
CREATE POLICY "reviews_update_own" ON reviews
  FOR UPDATE USING (auth.uid() = user_id AND is_approved = FALSE);

-- Admins can manage all reviews
CREATE POLICY "reviews_admin_all" ON reviews
  FOR ALL USING (is_admin());

-- ============================================================
-- ORDERS
-- ============================================================
CREATE POLICY "orders_select_own" ON orders
  FOR SELECT USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "orders_insert_auth" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id AND auth.uid() IS NOT NULL);

-- Only admins can update order status
CREATE POLICY "orders_update_admin" ON orders
  FOR UPDATE USING (is_admin());

-- ============================================================
-- ORDER ITEMS
-- ============================================================
CREATE POLICY "order_items_select_own" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_items.order_id
      AND (o.user_id = auth.uid() OR is_admin())
    )
  );

CREATE POLICY "order_items_insert_auth" ON order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_items.order_id
      AND o.user_id = auth.uid()
    )
  );

-- ============================================================
-- CART ITEMS
-- ============================================================
CREATE POLICY "cart_select_own" ON cart_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "cart_insert_own" ON cart_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "cart_update_own" ON cart_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "cart_delete_own" ON cart_items
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- WISHLIST ITEMS
-- ============================================================
CREATE POLICY "wishlist_select_own" ON wishlist_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "wishlist_insert_own" ON wishlist_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "wishlist_delete_own" ON wishlist_items
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- COUPONS (public read of active, admin write)
-- ============================================================
CREATE POLICY "coupons_public_read" ON coupons
  FOR SELECT USING (is_active = TRUE OR is_admin());

CREATE POLICY "coupons_admin_write" ON coupons
  FOR ALL USING (is_admin());

-- ============================================================
-- COUPON USAGE
-- ============================================================
CREATE POLICY "coupon_usage_own" ON coupon_usage
  FOR SELECT USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "coupon_usage_insert" ON coupon_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- OFFERS (public read, admin write)
-- ============================================================
CREATE POLICY "offers_public_read" ON offers
  FOR SELECT USING (is_active = TRUE OR is_admin());

CREATE POLICY "offers_admin_write" ON offers
  FOR ALL USING (is_admin());

-- ============================================================
-- INFLUENCER PROFILES
-- ============================================================
-- Influencers can read their own profile; admins can read all
CREATE POLICY "influencer_profiles_own" ON influencer_profiles
  FOR SELECT USING (auth.uid() = id OR is_admin());

-- Users can insert their own application
CREATE POLICY "influencer_profiles_insert" ON influencer_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Only admins can update (approve/reject/set commission)
CREATE POLICY "influencer_profiles_admin_update" ON influencer_profiles
  FOR UPDATE USING (is_admin());

-- ============================================================
-- COMMISSION TRANSACTIONS
-- ============================================================
CREATE POLICY "commission_own" ON commission_transactions
  FOR SELECT USING (auth.uid() = influencer_id OR is_admin());

CREATE POLICY "commission_admin_write" ON commission_transactions
  FOR ALL USING (is_admin());

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE POLICY "notifications_own" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "notifications_admin_insert" ON notifications
  FOR INSERT WITH CHECK (is_admin() OR auth.uid() IS NOT NULL);

-- ============================================================
-- SHIPROCKET TOKENS (admin only)
-- ============================================================
CREATE POLICY "shiprocket_tokens_admin" ON shiprocket_tokens
  FOR ALL USING (is_admin());

-- Service role bypasses RLS (for API routes using service role key)
-- No additional policy needed — service role always bypasses RLS

-- ============================================================
-- STORE SETTINGS (public read, admin write)
-- ============================================================
CREATE POLICY "store_settings_public_read" ON store_settings
  FOR SELECT USING (TRUE);

CREATE POLICY "store_settings_admin_write" ON store_settings
  FOR ALL USING (is_admin());
