import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * GET /api/admin/shipping-label/[orderId]
 * Returns a print-ready HTML shipping label for the given order.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;
  const supabase = await createAdminClient();

  const { data: order, error } = await supabase
    .from('orders')
    .select('*, items:order_items(product_name, quantity, unit_price)')
    .eq('id', orderId)
    .single();

  if (error || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  const addr = order.shipping_address as Record<string, string>;
  const items = (order.items ?? []) as Array<{ product_name: string; quantity: number; unit_price: number }>;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Shipping Label — ${order.order_number}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, Helvetica, sans-serif; background: #fff; color: #111; }
    .page { width: 100mm; min-height: 150mm; padding: 6mm; border: 2px solid #000; margin: 10px auto; }
    .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 4mm; margin-bottom: 4mm; }
    .brand { font-size: 14pt; font-weight: bold; letter-spacing: -0.5px; }
    .brand span { color: #4A6741; }
    .order-no { font-size: 9pt; font-weight: bold; font-family: monospace; background: #000; color: #fff; padding: 2px 6px; border-radius: 3px; }
    .section-label { font-size: 7pt; text-transform: uppercase; letter-spacing: 0.8px; color: #666; margin-bottom: 1mm; }
    .from-section { margin-bottom: 3mm; }
    .divider { border: none; border-top: 1px dashed #aaa; margin: 3mm 0; }
    .to-section { margin-bottom: 3mm; }
    .to-name { font-size: 13pt; font-weight: bold; line-height: 1.2; }
    .to-addr { font-size: 9pt; line-height: 1.5; color: #222; }
    .to-pin { font-size: 14pt; font-weight: bold; letter-spacing: 2px; margin-top: 2mm; }
    .to-phone { font-size: 10pt; font-weight: bold; margin-top: 1mm; }
    .items-section { border-top: 2px solid #000; padding-top: 3mm; margin-top: 3mm; }
    .item-row { display: flex; justify-content: space-between; font-size: 8pt; line-height: 1.6; }
    .footer { border-top: 2px solid #000; padding-top: 3mm; margin-top: 3mm; display: flex; justify-content: space-between; font-size: 8pt; }
    .payment-badge { font-weight: bold; padding: 1mm 3mm; border: 1.5px solid #000; border-radius: 3px; font-size: 8pt; }
    .cod { background: #fff3cd; }
    .paid { background: #d4edda; }
    @media print {
      body { margin: 0; }
      .page { border: 2px solid #000; margin: 0; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="brand">Lavish<span>Organic</span></div>
      <div class="order-no">${order.order_number}</div>
    </div>

    <div class="from-section">
      <div class="section-label">From</div>
      <div style="font-size:8pt; line-height:1.5;">
        LavishOrganic Pvt. Ltd.<br/>
        ${process.env.NEXT_PUBLIC_BUSINESS_ADDRESS ?? 'Mumbai, Maharashtra — 400001'}<br/>
        ${process.env.NEXT_PUBLIC_BUSINESS_PHONE ?? '+91 98765 43210'}
      </div>
    </div>

    <hr class="divider" />

    <div class="to-section">
      <div class="section-label">Ship To</div>
      <div class="to-name">${addr.name ?? ''}</div>
      <div class="to-addr">
        ${addr.line1 ?? ''}${addr.line2 ? ', ' + addr.line2 : ''}<br/>
        ${addr.city ?? ''}, ${addr.state ?? ''}
      </div>
      <div class="to-pin">${addr.pincode ?? ''}</div>
      <div class="to-phone">📞 ${addr.phone ?? ''}</div>
    </div>

    <div class="items-section">
      <div class="section-label">Items</div>
      ${items.map(i => `
        <div class="item-row">
          <span>${i.product_name}</span>
          <span>×${i.quantity}</span>
        </div>
      `).join('')}
    </div>

    <div class="footer">
      <div>
        <div><strong>Invoice:</strong> ${order.gst_invoice_number ?? 'Pending'}</div>
        <div><strong>Date:</strong> ${new Date(order.created_at).toLocaleDateString('en-IN')}</div>
        <div><strong>Total:</strong> ₹${Number(order.total).toFixed(2)}</div>
      </div>
      <div class="payment-badge ${order.payment_method === 'cod' ? 'cod' : 'paid'}">
        ${order.payment_method === 'cod' ? 'COD — ₹' + Number(order.total).toFixed(2) : 'PREPAID'}
      </div>
    </div>
  </div>
  <script>window.onload = () => window.print();</script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'private, no-cache',
    },
  });
}
