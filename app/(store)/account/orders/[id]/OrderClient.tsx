'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Package, MapPin, CreditCard,
  Printer, CheckCircle2, Clock, Truck 
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';
import { useToast } from '@/store/uiStore';
import { motion } from 'framer-motion';

const STATUS_COLORS: Record<string, string> = {
  pending:                    'bg-amber-50 text-amber-700 border-amber-200',
  awaiting_cod_confirmation:  'bg-orange-50 text-orange-700 border-orange-200',
  confirmed:                  'bg-blue-50 text-blue-700 border-blue-200',
  processing:                 'bg-purple-50 text-purple-700 border-purple-200',
  packed:                     'bg-indigo-50 text-indigo-700 border-indigo-200',
  shipped:                    'bg-cyan-50 text-cyan-700 border-cyan-200',
  out_for_delivery:           'bg-teal-50 text-teal-700 border-teal-200',
  delivered:                  'bg-sage-50 text-sage-dark border-sage-light',
  cancelled:                  'bg-red-50 text-red-600 border-red-200',
  returned:                   'bg-rose-50 text-rose-600 border-rose-200',
  refunded:                   'bg-gray-50 text-gray-600 border-gray-200',
};

const STATUS_STEPS = [
  { key: 'confirmed',       label: 'Confirmed' },
  { key: 'packed',          label: 'Packed' },
  { key: 'shipped',         label: 'Shipped' },
  { key: 'delivered',       label: 'Delivered' },
];

const STATUS_ORDER = [
  'pending', 'awaiting_cod_confirmation', 'confirmed',
  'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered',
];

export function OrderClient({ initialOrder }: { initialOrder: any }) {
  const [order, setOrder] = useState(initialOrder);
  const supabase = createClient();
  const toast = useToast();

  useEffect(() => {
    const channel = supabase
      .channel(`order-${order.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${order.id}`
      }, (payload) => {
        const newStatus = payload.new.status;
        if (newStatus !== order.status) {
          toast.success('Order Status Updated', `Status changed to ${newStatus.replace(/_/g, ' ')}`);
        }
        setOrder((prev: any) => ({ ...prev, ...payload.new }));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [order.id, order.status, supabase, toast]);

  const addr = order.shipping_address as Record<string, string>;
  const items = (order.items ?? []) as Array<any>;
  const currentStepIndex = STATUS_ORDER.indexOf(order.status);
  const isCancelled = ['cancelled', 'returned', 'refunded'].includes(order.status);

  // Maps a status key to its timestamp field
  const getTimestampForStep = (stepKey: string) => {
    switch (stepKey) {
      case 'confirmed': return order.confirmed_at;
      case 'packed': return order.packed_at;
      case 'shipped': return order.shipped_at;
      case 'delivered': return order.delivered_at;
      default: return null;
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/account/orders" className="btn-icon">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <h1 className="font-display text-2xl font-medium text-charcoal">
            Order {order.order_number}
          </h1>
          <p className="text-sm text-charcoal-lighter mt-0.5">
            Placed on {new Date(order.created_at).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'long', year: 'numeric',
            })}
          </p>
        </div>
        <span className={`text-xs px-3 py-1.5 rounded-full font-medium capitalize border transition-colors ${STATUS_COLORS[order.status] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
          {order.status.replace(/_/g, ' ')}
        </span>
      </div>

      {/* Progress Tracker */}
      {!isCancelled && (
        <div className="card p-5">
          <h2 className="font-medium text-charcoal mb-8 flex items-center gap-2">
            <Truck className="w-4 h-4 text-sage-dark" /> Delivery Progress
          </h2>
          <div className="flex items-start justify-between gap-1 relative px-4">
            {STATUS_STEPS.map((step, i) => {
              const stepIndex = STATUS_ORDER.indexOf(step.key);
              const isDone = currentStepIndex >= stepIndex;
              const isCurrent = STATUS_ORDER[currentStepIndex] === step.key || 
                               (currentStepIndex > stepIndex && currentStepIndex < (STATUS_ORDER.indexOf(STATUS_STEPS[i+1]?.key) || 99));
              const ts = getTimestampForStep(step.key);

              return (
                <div key={step.key} className="flex-1 flex flex-col items-center gap-2 relative z-10">
                  {i < STATUS_STEPS.length - 1 && (
                    <div className={`absolute top-3 left-1/2 w-full h-1 -z-10 transition-colors duration-500 ${isDone && !isCurrent ? 'bg-sage-dark' : 'bg-sage-light/30'}`} />
                  )}
                  
                  <div className="relative">
                    {isCurrent && (
                      <motion.div
                        className="absolute inset-0 rounded-full bg-blue-400"
                        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}
                    <div className={`relative w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-300 ${
                      isDone
                        ? 'bg-sage-dark text-white'
                        : isCurrent 
                          ? 'bg-blue-500 text-white'
                          : 'bg-white border-2 border-sage-light/40 text-charcoal-lighter'
                    }`}>
                      {isDone ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                    </div>
                  </div>

                  <div className="text-center mt-2 h-10">
                    <span className={`block text-xs leading-tight mb-1 ${isDone || isCurrent ? 'text-charcoal font-semibold' : 'text-charcoal-lighter'}`}>
                      {step.label}
                    </span>
                    {ts && (
                      <span className="block text-[10px] text-charcoal-light">
                        {format(new Date(ts), "d MMM, h:mm a")}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tracking Info */}
          {(order.tracking_number || order.courier_name) && (
            <div className="mt-4 pt-3 border-t border-sage-light/20">
              <div className="flex items-start gap-3 bg-cyan-50 border border-cyan-200 rounded-xl p-3">
                <Truck className="w-4 h-4 text-cyan-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 text-sm">
                  <p className="font-semibold text-cyan-800 mb-1">Shipping Info</p>
                  {order.courier_name && (
                    <p className="text-cyan-700">
                      Courier: <span className="font-medium">{order.courier_name}</span>
                    </p>
                  )}
                  {order.tracking_number && (
                    <p className="text-cyan-700 mt-0.5">
                      Tracking ID: <span className="font-mono font-semibold tracking-wide">{order.tracking_number}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Order Items */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-sage-light/20 flex items-center gap-2">
          <Package className="w-4 h-4 text-sage-dark" />
          <h2 className="font-medium text-charcoal">Items Ordered ({items.length})</h2>
        </div>
        <div className="divide-y divide-sage-light/10">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-4 p-4">
              {item.image_url
                ? <img src={item.image_url} alt={item.product_name} className="w-16 h-16 rounded-xl object-cover bg-sage-50 flex-shrink-0" />
                : <div className="w-16 h-16 rounded-xl bg-sage-50 flex-shrink-0 flex items-center justify-center">
                    <Package className="w-6 h-6 text-sage-light" />
                  </div>
              }
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-charcoal">{item.product_name}</p>
                <p className="text-xs text-charcoal-lighter mt-0.5">
                  Qty: {item.quantity} × {formatCurrency(item.unit_price)}
                </p>
              </div>
              <span className="text-sm font-semibold text-charcoal flex-shrink-0">
                {formatCurrency(item.total_price)}
              </span>
            </div>
          ))}
        </div>

        {/* Price Breakdown */}
        <div className="p-4 border-t border-sage-light/20 bg-sage-50/30 space-y-2">
          <div className="flex justify-between text-sm text-charcoal-lighter">
            <span>Subtotal</span><span>{formatCurrency(order.subtotal ?? 0)}</span>
          </div>
          {(order.shipping_amount ?? 0) > 0 && (
            <div className="flex justify-between text-sm text-charcoal-lighter">
              <span>Shipping</span><span>{formatCurrency(order.shipping_amount)}</span>
            </div>
          )}
          {(order.tax_amount ?? 0) > 0 && (
            <div className="flex justify-between text-sm text-charcoal-lighter">
              <span>GST (included)</span><span>{formatCurrency(order.tax_amount)}</span>
            </div>
          )}
          {(order.discount_amount ?? 0) > 0 && (
            <div className="flex justify-between text-sm text-sage-dark">
              <span>Discount {order.coupon_code ? `(${order.coupon_code})` : ''}</span>
              <span>−{formatCurrency(order.discount_amount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-charcoal pt-2 border-t border-sage-light/20">
            <span>Total Paid</span>
            <span className="text-lg">{formatCurrency(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Address + Payment */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="card p-5">
          <h2 className="font-medium text-charcoal mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-sage-dark" /> Shipping Address
          </h2>
          <div className="text-sm text-charcoal-lighter space-y-0.5">
            <p className="text-charcoal font-medium">{addr?.name}</p>
            <p>{addr?.line1}</p>
            {addr?.line2 && <p>{addr.line2}</p>}
            <p>{addr?.city}, {addr?.state}</p>
            <p className="font-mono tracking-wide">{addr?.pincode}</p>
            <p className="mt-1 font-medium text-charcoal">{addr?.phone}</p>
          </div>
        </div>

        <div className="card p-5">
          <h2 className="font-medium text-charcoal mb-3 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-sage-dark" /> Payment
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-charcoal-lighter">Method</span>
              <span className="font-medium text-charcoal uppercase">{order.payment_method}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-charcoal-lighter">Status</span>
              <span className={`font-medium ${order.payment_status === 'paid' ? 'text-sage-dark' : 'text-amber-600'}`}>
                {order.payment_status === 'paid' && <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" />}
                {order.payment_status}
              </span>
            </div>
            {order.gst_invoice_number && (
              <div className="flex justify-between pt-2 border-t border-sage-light/20">
                <span className="text-charcoal-lighter">Invoice No.</span>
                <span className="font-mono text-xs text-charcoal">{order.gst_invoice_number}</span>
              </div>
            )}
          </div>
          {order.gst_invoice_number && (
            <a
              href={`/api/invoice/${order.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex items-center gap-2 text-xs text-sage-dark font-medium hover:underline"
            >
              <Printer className="w-3.5 h-3.5" />
              Download GST Invoice
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
