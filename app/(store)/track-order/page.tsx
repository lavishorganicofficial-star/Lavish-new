'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Package, Search, Phone, ArrowLeft, CheckCircle, Truck, MapPin } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/store/uiStore';
import { formatCurrency, formatDate, cn } from '@/lib/utils';

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState('');
  
  const toast = useToast();
  const supabase = createClient();

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber || !phone) {
      setError('Please provide both Order Number and Mobile Number');
      return;
    }
    
    setError('');
    setLoading(true);
    setOrder(null);

    try {
      // Fetch order by order_number
      const { data, error: fetchErr } = await supabase
        .from('orders')
        .select('*, items:order_items(*)')
        .eq('order_number', orderNumber.toUpperCase().trim())
        .single();

      if (fetchErr || !data) {
        setError('Order not found. Please check your details.');
        setLoading(false);
        return;
      }

      // Verify phone number (could be user phone or guest phone depending on address/guest info)
      // Usually the shipping address has the phone, or we check guest_phone
      const addrPhone = data.shipping_address?.phone;
      const gstPhone = data.guest_phone;
      const matchPhone = phone.replace(/\D/g, '').slice(-10); // get last 10 digits
      
      const addrPhoneMatch = addrPhone?.replace(/\D/g, '').slice(-10) === matchPhone;
      const gstPhoneMatch = gstPhone?.replace(/\D/g, '').slice(-10) === matchPhone;

      if (!addrPhoneMatch && !gstPhoneMatch) {
        setError('Mobile number does not match this order.');
        setLoading(false);
        return;
      }

      setOrder(data);
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusDisplay = (status: string) => {
    const statusMap: Record<string, { label: string; icon: any; color: string; step: number }> = {
      pending: { label: 'Order Placed', icon: Package, color: 'text-sage-dark', step: 1 },
      awaiting_cod_confirmation: { label: 'Awaiting Confirmation', icon: Phone, color: 'text-amber-500', step: 1 },
      processing: { label: 'Processing', icon: Package, color: 'text-blue-500', step: 2 },
      shipped: { label: 'Shipped', icon: Truck, color: 'text-indigo-500', step: 3 },
      delivered: { label: 'Delivered', icon: CheckCircle, color: 'text-green-500', step: 4 },
      cancelled: { label: 'Cancelled', icon: Search, color: 'text-red-500', step: 0 },
    };
    return statusMap[status] || { label: status, icon: Package, color: 'text-gray-500', step: 1 };
  };

  return (
    <div className="min-h-screen bg-cream py-12">
      <div className="container max-w-2xl">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-charcoal-lighter hover:text-sage-dark mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to store
        </Link>

        <div className="text-center mb-10">
          <h1 className="font-display text-3xl font-medium text-charcoal mb-3">Track Your Order</h1>
          <p className="text-charcoal-lighter font-body">Enter your order details below to see the current status.</p>
        </div>

        <div className="card-flat p-8 mb-8">
          <form onSubmit={handleTrack} className="space-y-4">
            <div>
              <label className="label">Order Number *</label>
              <div className="relative">
                <Package className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  type="text" 
                  required 
                  value={orderNumber} 
                  onChange={e => setOrderNumber(e.target.value)} 
                  className="input w-full pl-11" 
                  placeholder="e.g. LO-20250526-0042" 
                />
              </div>
            </div>
            <div>
              <label className="label">Mobile Number *</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  type="tel" 
                  required 
                  value={phone} 
                  onChange={e => setPhone(e.target.value)} 
                  className="input w-full pl-11" 
                  placeholder="10-digit mobile number" 
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2">
              {loading ? 'Searching...' : 'Track Order'}
            </button>
          </form>
        </div>

        {order && (
          <div className="card-flat p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-sage-light/20 pb-6">
              <div>
                <p className="text-xs text-charcoal-lighter uppercase tracking-widest font-medium mb-1">Order Details</p>
                <h2 className="font-display text-2xl text-sage-dark">{order.order_number}</h2>
                <p className="text-sm text-charcoal-lighter font-body mt-1">{formatDate(order.created_at)}</p>
              </div>
              <div className="text-right">
                <p className="font-medium text-charcoal">{formatCurrency(order.total)}</p>
                <p className="text-xs text-charcoal-lighter mt-1 capitalize">{order.payment_method} · {order.payment_status.replace('_', ' ')}</p>
              </div>
            </div>

            {/* Tracking Timeline */}
            <div className="mb-8">
              <h3 className="font-display text-lg font-medium text-charcoal mb-6">Status</h3>
              
              {order.status === 'cancelled' ? (
                <div className="flex items-center gap-3 text-red-600 bg-red-50 p-4 rounded-xl">
                  <Search className="w-5 h-5" />
                  <span className="font-medium">This order was cancelled.</span>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-sage-light/30"></div>
                  
                  {[
                    { id: 'pending', label: 'Order Placed', desc: 'We have received your order.' },
                    { id: 'processing', label: 'Processing', desc: 'We are preparing your items.' },
                    { id: 'shipped', label: 'Shipped', desc: 'Your order is on the way.' },
                    { id: 'delivered', label: 'Delivered', desc: 'Package has been delivered.' }
                  ].map((step, idx) => {
                    const currentStepInfo = getStatusDisplay(order.status);
                    const isCompleted = currentStepInfo.step >= (idx + 1);
                    const isCurrent = currentStepInfo.step === (idx + 1);
                    
                    return (
                      <div key={step.id} className={cn("relative flex gap-4 mb-6 last:mb-0", !isCompleted && "opacity-50")}>
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center relative z-10 shrink-0 shadow-sm border-2",
                          isCompleted ? "bg-sage-dark border-sage-dark text-white" : "bg-white border-sage-light/50 text-sage-light"
                        )}>
                          {isCompleted ? <CheckCircle className="w-4 h-4" /> : <div className="w-2 h-2 bg-sage-light rounded-full" />}
                        </div>
                        <div className="pt-1.5">
                          <p className={cn("font-medium", isCurrent ? "text-sage-dark" : "text-charcoal")}>{step.label}</p>
                          <p className="text-xs text-charcoal-lighter mt-0.5">{step.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Order Items */}
            <div>
              <h3 className="font-display text-lg font-medium text-charcoal mb-4">Items Ordered</h3>
              <div className="space-y-4">
                {order.items.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-4 bg-sage-50/50 p-3 rounded-xl border border-sage-light/20">
                    <div className="w-16 h-16 bg-white rounded-lg overflow-hidden shrink-0">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.product_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300">
                          <Package className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-charcoal line-clamp-1">{item.product_name}</p>
                      <p className="text-xs text-charcoal-lighter mt-1">Qty: {item.quantity}</p>
                    </div>
                    <div className="font-medium text-charcoal text-sm">
                      {formatCurrency(item.total_price)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
