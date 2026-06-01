import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { getSellerGSTInfo, calculateOrderGST, getStateCode } from '@/lib/gst';
import type { OrderItem } from '@/types';

// Force Node.js runtime
export const runtime = 'nodejs';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

const inWords = (n: number): string => {
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const convert = (num: number): string => {
    if (num < 20) return a[num];
    if (num < 100) return b[Math.floor(num / 10)] + (num % 10 ? ' ' + a[num % 10] : '');
    if (num < 1000) return a[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' ' + convert(num % 100) : '');
    if (num < 100000) return convert(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 ? ' ' + convert(num % 1000) : '');
    if (num < 10000000) return convert(Math.floor(num / 100000)) + ' Lakh' + (num % 100000 ? ' ' + convert(num % 100000) : '');
    return convert(Math.floor(num / 10000000)) + ' Crore' + (num % 10000000 ? ' ' + convert(num % 10000000) : '');
  };
  const rupees = Math.floor(n);
  const paise = Math.round((n - rupees) * 100);
  let result = 'Rupees ' + convert(rupees);
  if (paise > 0) result += ' and ' + convert(paise) + ' Paise';
  return result + ' Only';
};

/**
 * GET /api/invoice/[orderId]
 * Generates a print-ready HTML GST Tax Invoice.
 * Works for both customers (own orders) and admins (any order).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;

    // Auth: cookie client reads the session
    const userClient = await createClient();
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // DB: admin client bypasses RLS
    const supabase = await createAdminClient();

    const { data: order, error } = await supabase
      .from('orders')
      .select('*, items:order_items(*)')
      .eq('id', orderId)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Ownership / role check
    // Check profiles table for admin role (app_metadata.user_role is not always set)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    const isAdmin = profile?.role === 'admin';

    if (!isAdmin && order.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Auto-assign invoice number if missing
    if (!order.gst_invoice_number) {
      const fallback = `LVO/${order.order_number}`;
      await supabase.from('orders').update({ gst_invoice_number: fallback }).eq('id', orderId);
      order.gst_invoice_number = fallback;
    }

    const addr = order.shipping_address as Record<string, string>;
    const items = (order.items ?? []) as OrderItem[];

    // Check GST Enable Setting
    const { data: gstSetting } = await supabase.from('store_settings').select('value').eq('key', 'gst_enabled').single();
    const isGstEnabled = gstSetting?.value?.toString() === 'true';

    // GST Calculation
    const business = getSellerGSTInfo();
    const gstResult = isGstEnabled 
      ? calculateOrderGST(items, addr.state ?? '') 
      : calculateOrderGST(items, addr.state ?? '', false); // false = disabled
    const isInterstate = isGstEnabled && gstResult.is_interstate;

    const invoiceDate = new Date(order.created_at).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'long', year: 'numeric',
    });

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>${isGstEnabled ? 'Tax Invoice' : 'Invoice'} — ${order.order_number}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 10px; color: #2C2C2C; background: #fff; }
    .page { width: 210mm; min-height: 297mm; padding: 12mm; margin: 0 auto; }
    /* Header */
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2.5px solid #4A6741; padding-bottom: 8px; margin-bottom: 10px; }
    .brand { font-size: 22px; font-weight: 900; color: #4A6741; letter-spacing: 2px; }
    .brand-sub { font-size: 8px; color: #7D9B76; margin-top: 2px; }
    .invoice-title { text-align: right; }
    .invoice-title h1 { font-size: 16px; font-weight: bold; color: #4A6741; }
    .invoice-title p { font-size: 9px; color: #666; margin-top: 2px; }
    /* Info boxes */
    .info-row { display: flex; gap: 12px; margin-bottom: 10px; }
    .info-box { flex: 1; background: #FAF7F2; border-radius: 4px; padding: 8px; }
    .info-box .label { font-size: 7px; color: #999; text-transform: uppercase; letter-spacing: 0.8px; font-weight: bold; margin-bottom: 4px; }
    .info-box .value { font-size: 9px; color: #2C2C2C; line-height: 1.6; }
    .info-box .value strong { font-weight: 700; }
    /* Supply type badge */
    .supply-type { font-size: 8px; color: #4A6741; font-weight: bold; margin-bottom: 8px; padding: 3px 6px; background: #EEF4ED; border-radius: 3px; display: inline-block; }
    /* Table */
    table { width: 100%; border-collapse: collapse; font-size: 8.5px; margin-top: 6px; }
    thead tr { background: #4A6741; color: #fff; }
    thead th { padding: 5px 6px; text-align: left; font-weight: bold; font-size: 8px; }
    thead th.right { text-align: right; }
    thead th.center { text-align: center; }
    tbody tr:nth-child(even) { background: #FAF7F2; }
    tbody td { padding: 5px 6px; border-bottom: 0.5px solid #E8E4DE; vertical-align: top; }
    tbody td.right { text-align: right; }
    tbody td.center { text-align: center; }
    .product-name { font-weight: 600; }
    .product-gst { font-size: 7px; color: #888; }
    /* Totals */
    .totals-section { display: flex; justify-content: flex-end; margin-top: 10px; }
    .totals-box { width: 250px; }
    .totals-row { display: flex; justify-content: space-between; padding: 3px 0; border-bottom: 0.5px solid #E8E4DE; font-size: 9px; }
    .totals-row .tl { color: #666; }
    .totals-row .tv { color: #2C2C2C; font-weight: 500; }
    .grand-total { background: #4A6741; color: #fff; padding: 6px 8px; border-radius: 3px; margin-top: 4px; display: flex; justify-content: space-between; font-size: 11px; font-weight: bold; }
    /* Amount in words */
    .amount-words { background: #FAF7F2; border-radius: 4px; padding: 6px 8px; margin-top: 10px; font-size: 8.5px; }
    .amount-words strong { color: #4A6741; }
    /* Declaration */
    .declaration { margin-top: 10px; background: #FAF7F2; border-radius: 4px; padding: 8px; font-size: 7.5px; color: #555; line-height: 1.6; }
    /* Footer */
    .footer { margin-top: 12px; border-top: 0.5px solid #E8E4DE; padding-top: 8px; display: flex; justify-content: space-between; font-size: 7.5px; color: #888; }
    @media print {
      body { margin: 0; }
      .page { padding: 10mm; }
      .no-print { display: none !important; }
    }
    /* Print button */
    .print-btn { position: fixed; top: 16px; right: 16px; background: #4A6741; color: #fff; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: bold; z-index: 100; }
  </style>
</head>
<body>
  <button class="print-btn no-print" onclick="window.print()">🖨 Print / Save PDF</button>

  <div class="page">
    <!-- Header -->
    <div class="header">
      <div>
        <div class="brand">LAVISHORGANIC</div>
        <div class="brand-sub">100% Organic · Cruelty Free · Made in India</div>
      </div>
      <div class="invoice-title">
        <h1>${isGstEnabled ? 'TAX INVOICE' : 'INVOICE'}</h1>
        ${isGstEnabled && order.gst_invoice_number ? `<p>Invoice No: <strong>${order.gst_invoice_number}</strong></p>` : ''}
        <p>Order No: <strong>${order.order_number}</strong></p>
        <p>Date: ${invoiceDate}</p>
      </div>
    </div>

    <!-- Seller & Buyer -->
    <div class="info-row">
      <div class="info-box">
        <div class="label">Sold By (Seller)</div>
        <div class="value">
          <strong>${business.business_name}</strong><br/>
          ${business.address}<br/>
          State: ${business.state} (${business.state_code})<br/>
          ${isGstEnabled ? `GSTIN: <strong>${business.gstin}</strong>` : ''}
        </div>
      </div>
      <div class="info-box">
        <div class="label">Billed To (Buyer)</div>
        <div class="value">
          <strong>${addr.name ?? ''}</strong><br/>
          ${addr.line1 ?? ''}${addr.line2 ? ', ' + addr.line2 : ''}<br/>
          ${addr.city ?? ''}, ${addr.state ?? ''} — ${addr.pincode ?? ''}<br/>
          State Code: ${getStateCode(addr.state ?? '')}<br/>
          Phone: ${addr.phone ?? ''}
        </div>
      </div>
    </div>

    <!-- Supply Type -->
    ${isGstEnabled ? `
    <div class="supply-type">
      ${isInterstate ? '⚡ Inter-State Supply (IGST Applicable)' : '🏠 Intra-State Supply (CGST + SGST Applicable)'}
    </div>` : ''}

    <!-- Items Table -->
    <table>
      <thead>
        <tr>
          <th style="width:35%">Product Description</th>
          <th class="center">HSN</th>
          <th class="center">Qty</th>
          <th class="right">Rate (₹)</th>
          ${isGstEnabled ? '<th class="right">Taxable (₹)</th>' : ''}
          ${isGstEnabled ? (isInterstate
            ? '<th class="right">IGST (₹)</th>'
            : '<th class="right">CGST (₹)</th><th class="right">SGST (₹)</th>'
          ) : ''}
          <th class="right">Total (₹)</th>
        </tr>
      </thead>
      <tbody>
        ${gstResult.items.map((item) => {
          const gb = item.gst_breakdown;
          return `
          <tr>
            <td>
              <div class="product-name">${item.product_name}</div>
              ${isGstEnabled ? `<div class="product-gst">GST: ${item.gst_rate ?? 18}%</div>` : ''}
            </td>
            <td class="center">${item.hsn_code ?? 'N/A'}</td>
            <td class="center">${item.quantity}</td>
            <td class="right">${fmt(item.unit_price)}</td>
            ${isGstEnabled ? `<td class="right">${fmt(gb.taxable_amount)}</td>` : ''}
            ${isGstEnabled ? (isInterstate
              ? `<td class="right">${fmt(gb.igst_amount)}<br/><span style="font-size:7px;color:#888">${gb.igst_rate}%</span></td>`
              : `<td class="right">${fmt(gb.cgst_amount)}<br/><span style="font-size:7px;color:#888">${gb.cgst_rate}%</span></td>
                 <td class="right">${fmt(gb.sgst_amount)}<br/><span style="font-size:7px;color:#888">${gb.sgst_rate}%</span></td>`
            ) : ''}
            <td class="right"><strong>${fmt(item.total_price)}</strong></td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>

    <!-- Totals -->
    <div class="totals-section">
      <div class="totals-box">
        <div class="totals-row"><span class="tl">Subtotal ${isGstEnabled ? '(Taxable)' : ''}</span><span class="tv">₹${fmt(gstResult.total_taxable)}</span></div>
        ${isGstEnabled ? (isInterstate
          ? `<div class="totals-row"><span class="tl">IGST</span><span class="tv">₹${fmt(gstResult.total_igst)}</span></div>`
          : `<div class="totals-row"><span class="tl">CGST</span><span class="tv">₹${fmt(gstResult.total_cgst)}</span></div>
             <div class="totals-row"><span class="tl">SGST</span><span class="tv">₹${fmt(gstResult.total_sgst)}</span></div>`
        ) : ''}
        ${(order.shipping_amount ?? 0) > 0
          ? `<div class="totals-row"><span class="tl">Shipping</span><span class="tv">₹${fmt(order.shipping_amount)}</span></div>`
          : ''
        }
        ${(order.discount_amount ?? 0) > 0
          ? `<div class="totals-row"><span class="tl">Discount</span><span class="tv" style="color:#4A6741">−₹${fmt(order.discount_amount)}</span></div>`
          : ''
        }
        <div class="grand-total">
          <span>Grand Total</span>
          <span>₹${fmt(order.total)}</span>
        </div>
      </div>
    </div>

    <!-- Amount in Words -->
    <div class="amount-words">
      <strong>Amount in Words:</strong> ${inWords(order.total)}
    </div>

    <!-- Declaration -->
    <div class="declaration">
      <strong>Declaration:</strong> We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct. This is a system-generated invoice and does not require a physical signature.
      ${order.payment_method === 'cod' ? '<br/><strong>Payment:</strong> Cash on Delivery — Amount to be collected at the time of delivery.' : ''}
    </div>

    <!-- Footer -->
    <div class="footer">
      <div>${business.business_name} · ${business.address} ${isGstEnabled ? `· GSTIN: ${business.gstin}` : ''}</div>
      <div>Thank you for choosing organic! 🌿</div>
    </div>
  </div>

  <script>
    // Auto-open print dialog after a short delay for better rendering
    setTimeout(() => window.print(), 300);
  </script>
</body>
</html>`;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'private, no-cache',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[GET /api/invoice/[orderId]] Failed:', message);
    return NextResponse.json({ error: 'Failed to generate invoice', detail: message }, { status: 500 });
  }
}
