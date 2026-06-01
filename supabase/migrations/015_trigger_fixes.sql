-- Fix 1: Update create_transaction_on_order to check for 'cod' case-insensitively
CREATE OR REPLACE FUNCTION create_transaction_on_order()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_method ILIKE 'cod' THEN
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

-- Fix 2: Move the stock movement logging trigger to order_items, because order_items are inserted AFTER orders
DROP TRIGGER IF EXISTS trg_log_stock_on_order ON public.orders;

CREATE OR REPLACE FUNCTION log_stock_on_order_item()
RETURNS TRIGGER AS $$
DECLARE
  current_stock INT;
BEGIN
  -- Get current stock
  SELECT stock_quantity INTO current_stock FROM public.products WHERE id = NEW.product_id;

  INSERT INTO public.stock_movements (
    product_id, variant_id, product_name, variant_name,
    movement_type, quantity_before, quantity_change, quantity_after,
    reference_id, reference_type
  ) VALUES (
    NEW.product_id,
    NEW.variant_id,
    NEW.product_name,
    NEW.variant_name,
    'sale',
    current_stock,
    -NEW.quantity,
    current_stock - NEW.quantity,
    NEW.order_id,
    'order'
  );

  -- Actually deduct the stock in the products table too!
  UPDATE public.products 
  SET stock_quantity = stock_quantity - NEW.quantity
  WHERE id = NEW.product_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_log_stock_on_order_item
AFTER INSERT ON public.order_items
FOR EACH ROW EXECUTE FUNCTION log_stock_on_order_item();
