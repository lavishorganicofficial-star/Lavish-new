-- Stock movement log — every stock change is recorded
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id      UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  product_name    TEXT NOT NULL,
  variant_name    TEXT,

  movement_type   TEXT NOT NULL CHECK (movement_type IN (
                    'sale',          -- stock reduced by order
                    'return',        -- stock added back by return
                    'restock',       -- admin added new stock
                    'adjustment',    -- admin manual correction
                    'damage',        -- damaged stock written off
                    'opening'        -- initial opening stock entry
                  )),

  quantity_before INT NOT NULL,
  quantity_change INT NOT NULL,
  -- Positive = stock added, Negative = stock reduced
  quantity_after  INT NOT NULL,

  reference_id    UUID,
  -- order_id for sale/return, purchase_order_id for restock
  reference_type  TEXT,
  -- 'order', 'purchase_order', 'manual'

  reason          TEXT,
  admin_id        UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Purchase orders (when admin orders new stock from supplier)
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number           TEXT UNIQUE NOT NULL,
  -- Format: PO-YYYYMMDD-XXXX

  supplier_name       TEXT NOT NULL,
  supplier_phone      TEXT,
  supplier_email      TEXT,
  supplier_address    TEXT,

  status              TEXT DEFAULT 'draft' CHECK (status IN (
                        'draft',      -- Being prepared
                        'sent',       -- Sent to supplier
                        'confirmed',  -- Supplier confirmed
                        'partial',    -- Partially received
                        'received',   -- Fully received
                        'cancelled'   -- Cancelled
                      )),

  total_items         INT DEFAULT 0,
  total_quantity      INT DEFAULT 0,
  total_cost          DECIMAL(10,2) DEFAULT 0,

  expected_date       DATE,
  received_date       DATE,
  notes               TEXT,
  admin_id            UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Purchase order line items
CREATE TABLE IF NOT EXISTS public.purchase_order_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id        UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id        UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  product_name      TEXT NOT NULL,
  variant_name      TEXT,
  quantity_ordered  INT NOT NULL,
  quantity_received INT DEFAULT 0,
  cost_per_unit     DECIMAL(10,2) NOT NULL,
  total_cost        DECIMAL(10,2) GENERATED ALWAYS AS
                      (quantity_ordered * cost_per_unit) STORED,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-generate PO number
CREATE OR REPLACE FUNCTION generate_po_number()
RETURNS TEXT AS $$
DECLARE
  today   TEXT := TO_CHAR(NOW(), 'YYYYMMDD');
  seq_num INT;
BEGIN
  SELECT COUNT(*) + 1 INTO seq_num
  FROM public.purchase_orders
  WHERE created_at::DATE = NOW()::DATE;
  RETURN 'PO-' || today || '-' || LPAD(seq_num::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Trigger: log stock movement when order placed (sale)
CREATE OR REPLACE FUNCTION log_stock_on_order()
RETURNS TRIGGER AS $$
DECLARE
  item RECORD;
BEGIN
  FOR item IN
    SELECT oi.product_id, oi.variant_id, oi.product_name,
           oi.variant_name, oi.quantity
    FROM public.order_items oi
    WHERE oi.order_id = NEW.id
  LOOP
    INSERT INTO public.stock_movements (
      product_id, variant_id, product_name, variant_name,
      movement_type, quantity_before, quantity_change, quantity_after,
      reference_id, reference_type
    )
    SELECT
      item.product_id,
      item.variant_id,
      item.product_name,
      item.variant_name,
      'sale',
      p.stock_quantity,
      -item.quantity,
      p.stock_quantity - item.quantity,
      NEW.id,
      'order'
    FROM public.products p WHERE p.id = item.product_id;
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_log_stock_on_order ON public.orders;
CREATE TRIGGER trg_log_stock_on_order
AFTER INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION log_stock_on_order();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON public.stock_movements(product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type    ON public.stock_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_stock_movements_date    ON public.stock_movements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_po_status               ON public.purchase_orders(status);

-- RLS — admin only
ALTER TABLE public.stock_movements   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin only - stock_movements" ON public.stock_movements;
CREATE POLICY "Admin only - stock_movements"
  ON public.stock_movements FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admin only - purchase_orders" ON public.purchase_orders;
CREATE POLICY "Admin only - purchase_orders"
  ON public.purchase_orders FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admin only - purchase_order_items" ON public.purchase_order_items;
CREATE POLICY "Admin only - purchase_order_items"
  ON public.purchase_order_items FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
