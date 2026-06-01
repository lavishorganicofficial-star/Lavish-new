'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Printer, Truck, RefreshCw, CheckCircle2, IndianRupee, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

type OrderStatus =
  | 'pending' | 'awaiting_cod_confirmation' | 'confirmed' | 'processing'
  | 'packed' | 'shipped' | 'out_for_delivery' | 'delivered'
  | 'cancelled' | 'returned' | 'refunded';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700',
  awaiting_cod_confirmation: 'bg-orange-50 text-orange-700',
  confirmed: 'bg-blue-50 text-blue-700',
  processing: 'bg-purple-50 text-purple-700',
  packed: 'bg-indigo-50 text-indigo-700',
  shipped: 'bg-cyan-50 text-cyan-700',
  out_for_delivery: 'bg-teal-50 text-teal-700',
  delivered: 'bg-sage-50 text-sage-dark',
  cancelled: 'bg-red-50 text-red-600',
  returned: 'bg-rose-50 text-rose-600',
  refunded: 'bg-gray-50 text-gray-600',
};

const ALL_STATUSES: OrderStatus[] = [
  'pending', 'awaiting_cod_confirmation', 'confirmed', 'processing',
  'packed', 'shipped', 'out_for_delivery', 'delivered',
  'cancelled', 'returned', 'refunded',
];

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  image_url?: string | null;
}

interface OrderDetailClientProps {
  order: {
    id: string;
    order_number: string;
    status: OrderStatus;
    payment_method: string;
    payment_status: string;
    subtotal: number;
    discount_amount: number;
    shipping_amount: number;
    tax_amount: number;
    total: number;
    coupon_code: string | null;
    razorpay_payment_id: string | null;
    gst_invoice_number: string | null;
    tracking_number: string | null;
    courier_name: string | null;
    created_at: string;
    shipping_address: Record<string, string>;
    items: OrderItem[];
    customer_name: string | null;
    customer_email: string | null;
    customer_phone: string | null;
    is_guest: boolean;
    user_id: string | null;
  };
}

export default function OrderDetailClient({ order }: OrderDetailClientProps) {
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>(order.status);
  const [updating, setUpdating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  // Shipping modal state
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [courierName, setCourierName] = useState(order.courier_name ?? '');
  const [trackingNumber, setTrackingNumber] = useState(order.tracking_number ?? '');
  // Payment recording state
  const [paymentStatus, setPaymentStatus] = useState(order.payment_status);
  const [paymentMethod, setPaymentMethod] = useState(order.payment_method);
  const [paymentReference, setPaymentReference] = useState('');
  const [recordingPayment, setRecordingPayment] = useState(false);

  const addr = order.shipping_address;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const updateStatus = async (overrideTracking?: { courier: string; tracking: string }) => {
    if (selectedStatus === status && !overrideTracking) return;
    // If shipping, require courier + tracking
    if (selectedStatus === 'shipped' && !overrideTracking) {
      setShowShippingModal(true);
      return;
    }
    setUpdating(true);
    try {
      const body: Record<string, string> = { status: selectedStatus };
      if (overrideTracking) {
        body.tracking_number = overrideTracking.tracking;
        body.courier_name = overrideTracking.courier;
      }
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setStatus(selectedStatus);
      setShowShippingModal(false);
      showToast('Order status updated!');
    } catch (e: unknown) {
      showToast(`Error: ${e instanceof Error ? e.message : 'Failed'}`);
    } finally {
      setUpdating(false);
    }
  };

  const recordPayment = async () => {
    setRecordingPayment(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_status: 'paid',
          payment_reference: paymentReference,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setPaymentStatus('paid');
      setPaymentReference('');
      showToast('Payment recorded successfully!');
    } catch (e: unknown) {
      showToast(`Error: ${e instanceof Error ? e.message : 'Failed'}`);
    } finally {
      setRecordingPayment(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/admin/orders" className="btn-icon"><ArrowLeft className="w-4 h-4" /></Link>
          <div>
            <h1 className="font-display text-2xl font-medium text-charcoal">Order {order.order_number}</h1>
            <p className="text-sm text-charcoal-lighter mt-0.5">
              {new Date(order.created_at).toLocaleDateString('en-IN', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link href={`/api/invoice/${order.id}`} target="_blank"
            className="btn-secondary flex items-center gap-2 text-sm">
            <Printer className="w-4 h-4" /> Invoice
          </Link>
          <Link href={`/api/admin/shipping-label/${order.id}`} target="_blank"
            className="btn-secondary flex items-center gap-2 text-sm">
            <Truck className="w-4 h-4" /> Label
          </Link>
          <span className={`text-sm px-3 py-1.5 rounded-full font-medium capitalize ${STATUS_COLORS[status] ?? 'bg-gray-50 text-gray-600'}`}>
            {status.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Items + Status */}
        <div className="lg:col-span-2 space-y-4">

          {/* Order Items */}
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-sage-light/20">
              <h2 className="font-medium text-charcoal">Order Items ({order.items?.length})</h2>
            </div>
            <div className="divide-y divide-sage-light/10">
              {order.items?.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-4">
                  {item.image_url
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={item.image_url} alt="" className="w-14 h-14 rounded-lg object-cover bg-sage-50 flex-shrink-0" />
                    : <div className="w-14 h-14 rounded-lg bg-sage-50 flex-shrink-0" />
                  }
                  <div className="flex-1">
                    <p className="text-sm font-medium text-charcoal">{item.product_name}</p>
                    <p className="text-xs text-charcoal-lighter">Qty: {item.quantity} × {formatCurrency(item.unit_price)}</p>
                  </div>
                  <span className="text-sm font-semibold text-charcoal">{formatCurrency(item.total_price)}</span>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-sage-light/20 bg-sage-50/30 space-y-2">
              <div className="flex justify-between text-sm text-charcoal-lighter">
                <span>Subtotal</span><span>{formatCurrency(order.subtotal ?? 0)}</span>
              </div>
              {order.shipping_amount > 0 && (
                <div className="flex justify-between text-sm text-charcoal-lighter">
                  <span>Shipping</span><span>{formatCurrency(order.shipping_amount)}</span>
                </div>
              )}
              {order.tax_amount > 0 && (
                <div className="flex justify-between text-sm text-charcoal-lighter">
                  <span>GST (included)</span><span>{formatCurrency(order.tax_amount)}</span>
                </div>
              )}
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-sm text-sage-dark">
                  <span>Discount {order.coupon_code ? `(${order.coupon_code})` : ''}</span>
                  <span>−{formatCurrency(order.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-charcoal pt-2 border-t border-sage-light/20">
                <span>Total</span><span>{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Update Status */}
          <div className="card p-5">
            <h2 className="font-medium text-charcoal mb-4">Update Order Status</h2>
            <div className="flex gap-3">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as OrderStatus)}
                className="input flex-1"
              >
                {ALL_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                  </option>
                ))}
              </select>
              <button
                onClick={() => updateStatus()}
                disabled={updating || selectedStatus === status}
                className="btn-primary flex items-center gap-2 disabled:opacity-50"
              >
                {updating
                  ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <RefreshCw className="w-4 h-4" />}
                Update
              </button>
            </div>
            {order.tracking_number && (
              <p className="text-xs text-charcoal-lighter mt-3">
                Tracking: <span className="font-mono font-medium text-charcoal">{order.tracking_number}</span>
              </p>
            )}
            {order.courier_name && (
              <p className="text-xs text-charcoal-lighter mt-1">
                Courier: <span className="font-medium text-charcoal">{order.courier_name}</span>
              </p>
            )}
            {order.gst_invoice_number && (
              <p className="text-xs text-charcoal-lighter mt-1">
                Invoice: <span className="font-mono font-medium text-charcoal">{order.gst_invoice_number}</span>
              </p>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">
          {/* Customer */}
          <div className="card p-5">
            <h2 className="font-medium text-charcoal mb-3 flex items-center justify-between">
              <span>Customer {order.is_guest && <span className="text-xs text-gray-400 font-normal italic ml-2">(Guest Order)</span>}</span>
            </h2>
            <div className="space-y-1">
              {order.is_guest ? (
                <p className="text-sm font-medium text-gray-600">{order.customer_name ?? addr?.name ?? '—'}</p>
              ) : (
                <p className="text-sm font-medium text-charcoal">
                  {order.user_id ? (
                    <Link href={`/admin/customers/${order.user_id}`} className="hover:underline text-sage-dark">
                      {order.customer_name ?? addr?.name ?? '—'}
                    </Link>
                  ) : (
                    order.customer_name ?? addr?.name ?? '—'
                  )}
                </p>
              )}
              <p className="text-xs text-charcoal-lighter">{order.customer_email ?? '—'}</p>
              <p className="text-xs text-charcoal-lighter">{order.customer_phone ?? addr?.phone ?? '—'}</p>
              
              {order.is_guest && <p className="text-[11px] text-gray-400 mt-2 italic">[No account]</p>}
              
              {(order.customer_phone || addr?.phone) && (
                <a 
                  href={`https://wa.me/91${(order.customer_phone || addr?.phone || '').replace(/\D/g, '').slice(-10)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-3 text-xs font-medium text-green-600 bg-green-50 px-2.5 py-1.5 rounded-lg border border-green-100 hover:bg-green-100 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 2C6.477 2 2 6.477 2 12c0 1.756.456 3.407 1.257 4.843L2 22l5.328-1.196A9.957 9.957 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.326a8.315 8.315 0 0 1-4.248-1.16l-.304-.18-3.155.709.72-3.007-.198-.315A8.31 8.31 0 0 1 3.673 12c0-4.59 3.737-8.327 8.327-8.327 4.59 0 8.327 3.737 8.327 8.327 0 4.59-3.737 8.327-8.327 8.327z"/></svg>
                  WhatsApp Customer
                </a>
              )}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="card p-5">
            <h2 className="font-medium text-charcoal mb-3">Shipping Address</h2>
            <div className="text-sm text-charcoal-lighter space-y-0.5">
              <p className="text-charcoal font-medium">{addr?.name}</p>
              <p>{addr?.line1}</p>
              {addr?.line2 && <p>{addr.line2}</p>}
              <p>{addr?.city}, {addr?.state}</p>
              <p className="font-mono tracking-wide">{addr?.pincode}</p>
              <p className="mt-1 font-medium text-charcoal">{addr?.phone}</p>
            </div>
          </div>

          {/* Payment */}
          <div className="card p-5">
            <h2 className="font-medium text-charcoal mb-3">Payment</h2>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-charcoal-lighter">Method</span>
                <span className="font-medium text-charcoal uppercase">{paymentMethod}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-charcoal-lighter">Status</span>
                <span className={`font-medium flex items-center gap-1 ${paymentStatus === 'paid' ? 'text-sage-dark' : paymentStatus === 'failed' ? 'text-red-500' : 'text-amber-600'}`}>
                  {paymentStatus === 'paid'
                    ? <CheckCircle2 className="w-3.5 h-3.5" />
                    : <AlertCircle className="w-3.5 h-3.5" />}
                  {paymentStatus}
                </span>
              </div>
              {order.razorpay_payment_id && (
                <div className="pt-2 border-t border-sage-light/20">
                  <p className="text-xs text-charcoal-lighter">Razorpay ID</p>
                  <p className="font-mono text-xs text-charcoal">{order.razorpay_payment_id}</p>
                </div>
              )}
            </div>

            {/* Manual Payment Recording — show when not yet paid */}
            {paymentStatus !== 'paid' && (
              <div className="mt-4 pt-4 border-t border-sage-light/20">
                <div className="flex items-center gap-2 mb-3">
                  <IndianRupee className="w-4 h-4 text-sage-dark" />
                  <p className="text-sm font-medium text-charcoal">Record Payment</p>
                </div>
                <div className="space-y-2">
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="input w-full text-sm"
                  >
                    <option value="cod">COD (Cash on Delivery)</option>
                    <option value="cash">Cash</option>
                    <option value="upi">UPI</option>
                    <option value="bank_transfer">Bank Transfer / NEFT</option>
                    <option value="cheque">Cheque</option>
                    <option value="card">Card (POS)</option>
                  </select>
                  <input
                    type="text"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder="Reference / UTR / Transaction ID (optional)"
                    className="input w-full text-sm"
                  />
                  <button
                    onClick={recordPayment}
                    disabled={recordingPayment}
                    className="btn-primary w-full flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                  >
                    {recordingPayment
                      ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : <CheckCircle2 className="w-4 h-4" />}
                    Mark as Paid
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Shipping Info Modal */}
      {showShippingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
            <h3 className="font-display text-xl font-semibold text-charcoal mb-1">Shipping Details</h3>
            <p className="text-xs text-charcoal-lighter mb-4">Enter courier and tracking info before marking as Shipped</p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-charcoal-lighter mb-1">Courier / Carrier Name *</label>
                <input
                  type="text"
                  className="input w-full"
                  placeholder="e.g. Delhivery, DTDC, Blue Dart"
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-charcoal-lighter mb-1">Tracking Number *</label>
                <input
                  type="text"
                  className="input w-full"
                  placeholder="e.g. DL1234567890IN"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowShippingModal(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                disabled={!courierName.trim() || !trackingNumber.trim() || updating}
                onClick={() => updateStatus({ courier: courierName.trim(), tracking: trackingNumber.trim() })}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                {updating
                  ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                  : 'Confirm & Ship'
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-sage-dark text-white px-4 py-3 rounded-xl text-sm font-medium shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
