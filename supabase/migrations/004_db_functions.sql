-- ============================================================
-- Migration 004: Database Functions & Triggers
-- ============================================================

-- ============================================================
-- ORDER NUMBER GENERATOR
-- Format: LO-YYYYMMDD-XXXX (e.g., LO-20250529-0001)
-- ============================================================
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

-- ============================================================
-- GST INVOICE NUMBER GENERATOR
-- Format: LO/YYYY-YY/XXXX (e.g., LO/2025-26/0001)
-- Resets every financial year (April 1st)
-- ============================================================
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
  
  -- Indian FY: April to March
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

-- ============================================================
-- ATOMIC COUPON USAGE INCREMENT
-- Prevents race conditions on concurrent orders with same coupon
-- ============================================================
CREATE OR REPLACE FUNCTION increment_coupon_usage(coupon_code TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql AS $$
DECLARE
  coupon_record RECORD;
BEGIN
  -- Lock the row for update
  SELECT * INTO coupon_record
  FROM coupons
  WHERE code = coupon_code AND is_active = TRUE
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Check usage limit
  IF coupon_record.usage_limit IS NOT NULL 
     AND coupon_record.used_count >= coupon_record.usage_limit THEN
    RETURN FALSE;
  END IF;
  
  -- Increment
  UPDATE coupons
  SET used_count = used_count + 1
  WHERE code = coupon_code;
  
  RETURN TRUE;
END;
$$;

-- ============================================================
-- STOCK CHECK BEFORE ORDER ITEM INSERT
-- ============================================================
CREATE OR REPLACE FUNCTION check_stock_before_order()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  available_stock INT;
BEGIN
  -- Check variant stock if variant specified
  IF NEW.variant_id IS NOT NULL THEN
    SELECT stock_quantity INTO available_stock
    FROM product_variants WHERE id = NEW.variant_id;
    
    IF available_stock IS NOT NULL AND available_stock < NEW.quantity THEN
      RAISE EXCEPTION 'Insufficient stock for variant. Available: %, Requested: %',
        available_stock, NEW.quantity;
    END IF;
  ELSE
    -- Check product stock
    SELECT stock_quantity INTO available_stock
    FROM products WHERE id = NEW.product_id;
    
    IF available_stock IS NOT NULL AND available_stock < NEW.quantity THEN
      RAISE EXCEPTION 'Insufficient stock. Available: %, Requested: %',
        available_stock, NEW.quantity;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_check_stock
  BEFORE INSERT ON order_items
  FOR EACH ROW EXECUTE FUNCTION check_stock_before_order();

-- ============================================================
-- DEDUCT STOCK ON ORDER CONFIRMATION
-- ============================================================
CREATE OR REPLACE FUNCTION deduct_stock_on_confirm()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  -- Only deduct when status transitions to 'confirmed' or 'processing'
  IF NEW.status IN ('confirmed', 'processing') 
     AND (OLD.status = 'pending' OR OLD.status = 'awaiting_cod_confirmation') THEN
    
    -- Deduct variant stock
    UPDATE product_variants pv
    SET stock_quantity = pv.stock_quantity - oi.quantity
    FROM order_items oi
    WHERE oi.order_id = NEW.id
    AND oi.variant_id IS NOT NULL
    AND pv.id = oi.variant_id;
    
    -- Deduct product stock (for items without variant)
    UPDATE products p
    SET stock_quantity = p.stock_quantity - oi.quantity
    FROM order_items oi
    WHERE oi.order_id = NEW.id
    AND oi.variant_id IS NULL
    AND p.id = oi.product_id;
    
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_deduct_stock
  AFTER UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION deduct_stock_on_confirm();

-- ============================================================
-- UPDATE CUSTOMER STATS ON ORDER DELIVERED
-- ============================================================
CREATE OR REPLACE FUNCTION update_customer_stats_on_delivery()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    UPDATE profiles
    SET 
      total_orders = total_orders + 1,
      total_spent = total_spent + NEW.total
    WHERE id = NEW.user_id;
    
    -- Mark reviews as verified (purchase confirmed)
    -- This allows the customer to post a verified review
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_customer_stats
  AFTER UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_customer_stats_on_delivery();

-- ============================================================
-- AUTO-GENERATE ORDER NUMBER ON INSERT
-- ============================================================
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

-- ============================================================
-- PRODUCT AVERAGE RATING VIEW
-- ============================================================
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

-- ============================================================
-- LOW STOCK ALERTS VIEW
-- ============================================================
CREATE OR REPLACE VIEW low_stock_products AS
SELECT
  p.id,
  p.name,
  p.sku,
  p.stock_quantity,
  p.low_stock_threshold,
  c.name as category_name
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.track_inventory = TRUE
  AND p.is_active = TRUE
  AND p.stock_quantity <= p.low_stock_threshold
ORDER BY p.stock_quantity ASC;
