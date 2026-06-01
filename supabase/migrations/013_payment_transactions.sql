-- Master payment transactions table
-- Every money movement gets a row here
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_number  TEXT UNIQUE NOT NULL,
  -- Format: TXN-YYYYMMDD-XXXX (auto-generated)

  order_id            UUID REFERENCES orders(id) ON DELETE SET NULL,
  order_number        TEXT,
  user_id             UUID REFERENCES profiles(id) ON DELETE SET NULL,
  customer_name       TEXT,
  customer_phone      TEXT,
  customer_email      TEXT,

  type                TEXT NOT NULL CHECK (type IN (
                        'cod_pending',     -- COD order placed, payment not collected
                        'cod_collected',   -- Delivery agent collected cash
                        'cod_failed',      -- Customer refused to pay / returned
                        'refund_issued',   -- Admin issued refund (bank transfer)
                        'refund_pending',  -- Refund approved but not yet transferred
                        'adjustment',      -- Manual admin adjustment
                        'store_credit'     -- Store credit issued to customer
                      )),

  status              TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
                        'pending',    -- Awaiting action
                        'completed',  -- Transaction done
                        'failed',     -- Transaction failed
                        'cancelled'   -- Transaction cancelled
                      )),

  amount              DECIMAL(10,2) NOT NULL,
  -- Positive = money coming in, Negative = money going out

  subtotal            DECIMAL(10,2),
  discount_amount     DECIMAL(10,2) DEFAULT 0,
  shipping_amount     DECIMAL(10,2) DEFAULT 0,
  tax_amount          DECIMAL(10,2) DEFAULT 0,

  payment_method      TEXT DEFAULT 'COD',
  payment_collected_at TIMESTAMPTZ,
  collected_by        TEXT, -- delivery agent name or admin name

  refund_reason       TEXT,
  refund_method       TEXT, -- bank_transfer, upi, store_credit
  refund_bank_name    TEXT,
  refund_account      TEXT,
  refund_ifsc         TEXT,
  refund_upi_id       TEXT,
  refund_reference    TEXT, -- UTR number after bank transfer

  notes               TEXT,
  admin_id            UUID REFERENCES profiles(id) ON DELETE SET NULL,
  -- which admin last updated this

  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-generate transaction number
CREATE OR REPLACE FUNCTION generate_transaction_number()
RETURNS TEXT AS $$
DECLARE
  today     TEXT := TO_CHAR(NOW(), 'YYYYMMDD');
  seq_num   INT;
  txn_num   TEXT;
BEGIN
  SELECT COUNT(*) + 1 INTO seq_num
  FROM public.payment_transactions
  WHERE created_at::DATE = NOW()::DATE;
  txn_num := 'TXN-' || today || '-' || LPAD(seq_num::TEXT, 4, '0');
  RETURN txn_num;
END;
$$ LANGUAGE plpgsql;

-- Trigger: auto-insert transaction when order is placed
CREATE OR REPLACE FUNCTION create_transaction_on_order()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_method = 'COD' THEN
    INSERT INTO public.payment_transactions (
      transaction_number, order_id, order_number,
      user_id, amount, subtotal, discount_amount,
      shipping_amount, tax_amount,
      type, status, payment_method
    ) VALUES (
      generate_transaction_number(),
      NEW.id, NEW.order_number,
      NEW.user_id, NEW.total, NEW.subtotal,
      NEW.discount_amount, NEW.shipping_amount,
      NEW.tax_amount,
      'cod_pending', 'pending', 'COD'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists to allow re-running
DROP TRIGGER IF EXISTS trg_create_transaction ON public.orders;
CREATE TRIGGER trg_create_transaction
AFTER INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION create_transaction_on_order();

-- Trigger: update transaction when order delivered
CREATE OR REPLACE FUNCTION update_transaction_on_delivery()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    UPDATE public.payment_transactions
    SET
      type   = 'cod_collected',
      status = 'completed',
      payment_collected_at = NOW(),
      updated_at = NOW()
    WHERE order_id = NEW.id AND type = 'cod_pending';
  END IF;

  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    UPDATE public.payment_transactions
    SET
      type   = 'cod_failed',
      status = 'cancelled',
      updated_at = NOW()
    WHERE order_id = NEW.id AND type = 'cod_pending';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists to allow re-running
DROP TRIGGER IF EXISTS trg_update_transaction_on_delivery ON public.orders;
CREATE TRIGGER trg_update_transaction_on_delivery
AFTER UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION update_transaction_on_delivery();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_txn_order        ON public.payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_txn_user         ON public.payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_txn_type         ON public.payment_transactions(type);
CREATE INDEX IF NOT EXISTS idx_txn_status       ON public.payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_txn_created      ON public.payment_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_txn_number       ON public.payment_transactions(transaction_number);

-- RLS
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access on transactions" ON public.payment_transactions;
CREATE POLICY "Admin full access on transactions"
  ON public.payment_transactions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
