import { redirect } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Package, ArrowRight, Clock, UserPlus } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/server';

interface OrderSuccessPageProps {
  searchParams: Promise<{ order?: string; method?: string }>;
}

export default async function OrderSuccessPage({ searchParams }: OrderSuccessPageProps) {
  // ✅ Next.js 15: searchParams is a Promise — must be awaited
  const { order: orderNumber, method } = await searchParams;

  if (!orderNumber) redirect('/');

  const isCOD = method === 'cod';

  // Fetch order to check if guest
  const supabase = await createAdminClient();
  const { data: order } = await supabase
    .from('orders')
    .select('is_guest, guest_email')
    .eq('order_number', orderNumber)
    .single();

  const isGuest = order?.is_guest ?? false;

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-6">
      <div className="max-w-lg w-full text-center">

        {/* Icon */}
        <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${isCOD ? 'bg-amber-50' : 'bg-green-50'}`}>
          {isCOD
            ? <Clock className="w-12 h-12 text-amber-500" />
            : <CheckCircle className="w-12 h-12 text-green-500" />}
        </div>

        <h1 className="font-display text-4xl font-medium text-charcoal mb-3">
          {isCOD ? 'Order Placed! 🎉' : 'Payment Successful! ✅'}
        </h1>

        <p className="text-charcoal-lighter font-body mb-2 text-base leading-relaxed">
          {isCOD
            ? 'Your COD order has been received. We will confirm and dispatch your order within 24–48 hours.'
            : "Your payment is confirmed. We're preparing your organic goodies!"}
        </p>

        {/* Order Number Box */}
        <div className="bg-white rounded-2xl p-6 mb-8 border border-sage-light/40 shadow-sm">
          <p className="text-xs text-charcoal-lighter font-body uppercase tracking-widest mb-2">Order Number</p>
          <p className="font-display text-3xl font-semibold text-sage-dark tracking-wide">{orderNumber}</p>
          {isCOD && (
            <p className="text-xs text-amber-600 mt-3 font-body">
              💳 Pay in cash when your order arrives
            </p>
          )}
        </div>

        {/* Steps */}
        <div className="flex justify-center gap-6 mb-8 text-xs text-charcoal-lighter font-body">
          <div className="flex flex-col items-center gap-1">
            <div className="w-8 h-8 bg-sage-dark rounded-full flex items-center justify-center text-white text-xs font-bold">1</div>
            <span>Order Placed</span>
          </div>
          <div className="w-8 h-px bg-sage-light/40 self-center mt-[-1rem]" />
          <div className="flex flex-col items-center gap-1">
            <div className="w-8 h-8 bg-sage-light/30 rounded-full flex items-center justify-center text-charcoal-lighter text-xs font-bold">2</div>
            <span>Processing</span>
          </div>
          <div className="w-8 h-px bg-sage-light/40 self-center mt-[-1rem]" />
          <div className="flex flex-col items-center gap-1">
            <div className="w-8 h-8 bg-sage-light/30 rounded-full flex items-center justify-center text-charcoal-lighter text-xs font-bold">3</div>
            <span>Delivered</span>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
          <Link href={isGuest ? `/track-order?order=${orderNumber}` : "/account/orders"} className="btn-primary">
            <Package className="w-4 h-4" />
            Track My Order
          </Link>
          <Link href="/shop" className="btn-secondary">
            Continue Shopping
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {isGuest && (
          <div className="bg-sage-50 rounded-2xl p-6 border border-sage-dark/20 text-left relative overflow-hidden shadow-sm">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-sage-light/20 rounded-full blur-xl"></div>
            <h3 className="font-display text-lg font-medium text-charcoal mb-2 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-sage-dark" />
              Save time on your next order!
            </h3>
            <p className="text-sm text-charcoal-lighter font-body mb-4 leading-relaxed">
              Create a free account to track all your orders in one place, save your address for faster checkout, and get exclusive member discounts.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href={`/register?email=${encodeURIComponent(order?.guest_email || '')}`} className="btn-primary py-2.5 text-sm bg-sage-dark hover:bg-sage-700">
                Create Account
              </Link>
            </div>
          </div>
        )}

        {!isGuest && (
          <p className="text-xs text-charcoal-lighter mt-6 font-body">
            A confirmation email has been sent to your registered email address.
          </p>
        )}
      </div>
    </div>
  );
}
