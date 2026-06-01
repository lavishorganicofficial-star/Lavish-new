/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShoppingBag, CreditCard, Banknote, Tag, X, Lock, ArrowLeft, Mail, User, Phone, Zap } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useToast } from '@/store/uiStore';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency, isValidIndianPhone, isValidPincode, cn } from '@/lib/utils';
import { trackCheckoutStart, trackCheckoutComplete, trackCouponApply, getVisitorId } from '@/lib/analytics';
import { getReferral, clearReferral } from '@/lib/referral';
import type { AddressSnapshot } from '@/types';

type PaymentMethod = 'razorpay' | 'cod';

export default function CheckoutPage() {
  const router = useRouter();
  const toast = useToast();
  const supabase = createClient();
  const { items, totals, coupon, applyCoupon, removeCoupon, clearCart } = useCartStore();

  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('razorpay');

  // Auth & Guest state
  const [authStatus, setAuthStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
  const [checkoutMode, setCheckoutMode] = useState<'login_prompt' | 'guest' | 'user'>('login_prompt');
  
  // Guest Details
  const [guestDetails, setGuestDetails] = useState({ name: '', phone: '', email: '' });
  const [guestErrors, setGuestErrors] = useState<{name?: string, phone?: string}>({});
  const [guestStepComplete, setGuestStepComplete] = useState(false);

  // Address State
  const [address, setAddress] = useState<AddressSnapshot>({
    name: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '',
  });
  const [addressErrors, setAddressErrors] = useState<Partial<Record<keyof AddressSnapshot, string>>>({});
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [isAddingNew, setIsAddingNew] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [isCodBanned, setIsCodBanned] = useState(false);

  // Login form state for quick login inside checkout
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    trackCheckoutStart();
  }, []);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    const fetchProfileAndAddresses = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setAuthStatus('unauthenticated');
        setCheckoutMode('login_prompt');
        return;
      }
      
      setAuthStatus('authenticated');
      setCheckoutMode('user');
      
      const [profileRes, addrRes] = await Promise.all([
        supabase.from('profiles').select('full_name, phone, cod_banned').eq('id', user.id).single(),
        supabase.from('addresses').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      ]);

      if (profileRes.data?.cod_banned) {
        setIsCodBanned(true);
        if (paymentMethod === 'cod') setPaymentMethod('razorpay');
      }

      if (addrRes.data && addrRes.data.length > 0) {
        setSavedAddresses(addrRes.data);
        setSelectedAddressId(addrRes.data[0].id);
        setIsAddingNew(false);
        setAddress(addrRes.data[0]);
      } else {
        setIsAddingNew(true);
        if (profileRes.data) {
          setAddress((a) => ({
            ...a,
            name: profileRes.data.full_name ?? '',
            phone: profileRes.data.phone ?? '',
          }));
        }
      }
    };
    fetchProfileAndAddresses();
  }, []);

  const handleQuickLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });
      if (error) throw error;
      window.location.reload(); // Reload to fetch user context fully
    } catch (err: any) {
      toast.error('Login Failed', err.message);
      setLoginLoading(false);
    }
  };

  const handleGuestContinue = () => {
    const errs: any = {};
    if (!guestDetails.name.trim()) errs.name = 'Name is required';
    if (!guestDetails.phone || !isValidIndianPhone(guestDetails.phone)) errs.phone = 'Valid 10-digit mobile required';
    
    if (Object.keys(errs).length > 0) {
      setGuestErrors(errs);
      return;
    }
    
    // Auto-fill address with guest details
    setAddress(prev => ({
      ...prev,
      name: guestDetails.name,
      phone: guestDetails.phone
    }));
    
    setGuestErrors({});
    setGuestStepComplete(true);
  };

  const handleSelectAddress = (addr: any) => {
    setSelectedAddressId(addr.id);
    setIsAddingNew(false);
    setAddress({
      name: addr.name, phone: addr.phone, line1: addr.line1, line2: addr.line2 || '', city: addr.city, state: addr.state, pincode: addr.pincode
    });
    setAddressErrors({});
  };

  const handleAddNewAddress = () => {
    setSelectedAddressId(null);
    setIsAddingNew(true);
    setAddress({ name: checkoutMode === 'guest' ? guestDetails.name : '', phone: checkoutMode === 'guest' ? guestDetails.phone : '', line1: '', line2: '', city: '', state: '', pincode: '' });
    setAddressErrors({});
  };

  if (items.length === 0) {
    return (
      <div className="section text-center">
        <div className="container max-w-md mx-auto py-20">
          <ShoppingBag className="w-16 h-16 text-sage-light mx-auto mb-4" />
          <h1 className="font-display text-2xl mb-2">Your cart is empty</h1>
          <p className="text-charcoal-lighter mb-6 font-body text-sm">Add items to your cart before checking out.</p>
          <Link href="/shop" className="btn-primary">Browse Products</Link>
        </div>
      </div>
    );
  }

  const validateAddress = () => {
    const errs: typeof addressErrors = {};
    if (!address.name.trim()) errs.name = 'Full name is required';
    if (!address.phone || !isValidIndianPhone(address.phone)) errs.phone = 'Valid 10-digit mobile required';
    if (!address.line1.trim()) errs.line1 = 'Address line 1 is required';
    if (!address.city.trim()) errs.city = 'City is required';
    if (!address.state.trim()) errs.state = 'State is required';
    if (!isValidPincode(address.pincode)) errs.pincode = 'Valid 6-digit pincode required';
    setAddressErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const applyDiscount = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const res = await fetch('/api/coupon/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode, subtotal: totals.subtotal }),
      });
      const data = await res.json();
      if (data.success && data.data.valid) {
        applyCoupon(data.data);
        toast.success('Coupon applied!', data.data.message);
        trackCouponApply(couponCode, true);
      } else {
        toast.error('Invalid coupon', data.data.message ?? 'Coupon not valid');
        trackCouponApply(couponCode, false);
      }
    } catch {
      toast.error('Error', 'Failed to validate coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  const placeOrder = async () => {
    if (!validateAddress()) {
      return;
    }
    setLoading(true);

    try {
      // Save new address if logged in and adding new
      if (checkoutMode === 'user' && isAddingNew) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('addresses').insert({
            user_id: user.id,
            name: address.name,
            phone: address.phone,
            line1: address.line1,
            line2: address.line2,
            city: address.city,
            state: address.state,
            pincode: address.pincode,
            is_default: savedAddresses.length === 0
          });
        }
      }

      const referral = getReferral();
      const visitorId = getVisitorId();

      const payload = {
        items: items.map((i) => ({
          product_id: i.product_id,
          variant_id: i.variant_id,
          quantity: i.quantity,
        })),
        shipping_address: address,
        coupon_code: coupon?.valid ? couponCode : undefined,
        payment_method: paymentMethod,
        notes: null,
        referralCode: referral?.code || null,
        visitorId: visitorId || null,
        // Guest info
        isGuest: checkoutMode === 'guest',
        guestName: guestDetails.name,
        guestEmail: guestDetails.email,
        guestPhone: guestDetails.phone
      };

      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const orderData = await orderRes.json();
      if (!orderData.success) {
        toast.error('Order failed', orderData.error);
        setLoading(false);
        return;
      }

      const { order_id, order_number } = orderData.data;
      const finalTotal = totals.total;

      if (paymentMethod === 'cod') {
        trackCheckoutComplete(order_id, finalTotal);
        clearCart();
        clearReferral();
        router.push(`/order-success?order=${order_number}&method=cod`);
        return;
      }

      const payRes = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id }),
      });
      const payData = await payRes.json();
      if (!payData.success) {
        toast.error('Payment setup failed', payData.error);
        setLoading(false);
        return;
      }

      const { razorpay_order_id, amount, currency, key_id } = payData.data;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rzp = new (window as any).Razorpay({
        key: key_id,
        amount,
        currency,
        name: 'LavishOrganic',
        description: `Order #${order_number}`,
        order_id: razorpay_order_id,
        prefill: {
          name: address.name,
          email: checkoutMode === 'guest' ? guestDetails.email : '',
          contact: address.phone,
        },
        theme: { color: '#4A6741' },
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          const verifyRes = await fetch('/api/payment/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...response, order_id }),
          });
          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            trackCheckoutComplete(order_id, finalTotal);
            clearCart();
            clearReferral();
            router.push(`/order-success?order=${order_number}`);
          } else {
            toast.error('Payment verification failed', 'Please contact support.');
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            toast.info('Payment cancelled', 'Your order has been saved. Complete payment anytime.');
          },
        },
      });
      rzp.open();
    } catch (err) {
      console.error('[Checkout] Error:', err);
      toast.error('Something went wrong', 'Please try again.');
      setLoading(false);
    }
  };

  const INDIAN_STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir',
    'Jharkhand', 'Karnataka', 'Kerala', 'Ladakh', 'Madhya Pradesh', 'Maharashtra',
    'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan',
    'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand',
    'West Bengal', 'Delhi', 'Chandigarh',
  ];

  if (authStatus === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="w-8 h-8 border-4 border-sage-dark border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="section bg-cream min-h-screen pb-20">
      <div className="container max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/cart" className="text-charcoal-lighter hover:text-charcoal transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-display text-3xl font-medium text-charcoal">Checkout</h1>
          <div className="ml-auto flex items-center gap-2 text-xs text-charcoal-lighter font-body">
            <Lock className="w-3.5 h-3.5 text-sage-dark" />
            Secure checkout
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Left: Form Flow */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* ENTRY SCREEN: Guest vs Login */}
            {checkoutMode === 'login_prompt' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="card-flat p-8 text-center border-2 border-sage-dark/20 bg-sage-50/30">
                  <h2 className="font-display text-2xl font-medium text-charcoal mb-2">How would you like to continue?</h2>
                  <p className="text-sm text-charcoal-lighter mb-8">Choose the fastest way to complete your purchase.</p>
                  
                  <button 
                    onClick={() => setCheckoutMode('guest')}
                    className="w-full bg-sage-dark hover:bg-sage-700 text-white py-4 rounded-xl font-medium text-lg flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg"
                  >
                    <Zap className="w-5 h-5" />
                    Continue as Guest
                  </button>
                  <p className="text-xs text-charcoal-lighter mt-3 font-medium">No account needed. Fast checkout.</p>
                </div>

                <div className="flex items-center gap-4 py-2">
                  <div className="flex-1 h-px bg-sage-light/30"></div>
                  <span className="text-sm font-medium text-charcoal-lighter uppercase tracking-widest">Already a customer?</span>
                  <div className="flex-1 h-px bg-sage-light/30"></div>
                </div>

                <div className="card-flat p-8">
                  <form onSubmit={handleQuickLogin} className="space-y-4">
                    <div>
                      <label className="label">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input type="email" required value={loginEmail} onChange={e => setLoginEmail(e.target.value)} className="input w-full pl-11" placeholder="you@example.com" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="label mb-0">Password</label>
                        <Link href="/forgot-password" className="text-xs text-sage-dark hover:underline font-medium">Forgot password?</Link>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input type={showPassword ? "text" : "password"} required value={loginPassword} onChange={e => setLoginPassword(e.target.value)} className="input w-full pl-11 pr-11" placeholder="••••••••" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          {showPassword ? <X className="w-4 h-4"/> : <User className="w-4 h-4"/>}
                        </button>
                      </div>
                    </div>
                    <button type="submit" disabled={loginLoading} className="btn-secondary w-full py-3 mt-2">
                      {loginLoading ? 'Signing in...' : 'Sign In & Checkout'}
                    </button>
                  </form>
                </div>

                <div className="text-center pt-2">
                  <p className="text-sm text-charcoal-lighter">
                    New here? <Link href="/register?redirectTo=/checkout" className="text-sage-dark font-medium hover:underline">Create Account &amp; Checkout</Link>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">(Save your details for faster checkout next time)</p>
                </div>
              </div>
            )}

            {/* GUEST DETAILS STEP */}
            {checkoutMode === 'guest' && !guestStepComplete && (
              <div className="card-flat p-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display text-xl font-medium text-charcoal">Guest Details</h2>
                  <button onClick={() => setCheckoutMode('login_prompt')} className="text-xs font-medium text-sage-dark hover:underline">
                    Back
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="label">Full Name *</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input type="text" value={guestDetails.name} onChange={e => setGuestDetails(prev => ({...prev, name: e.target.value}))} className={cn("input w-full !pl-11", guestErrors.name && "input-error")} placeholder="Priya Sharma" />
                    </div>
                    {guestErrors.name && <p className="error-text">{guestErrors.name}</p>}
                  </div>
                  
                  <div>
                    <label className="label">Mobile Number *</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <span className="absolute left-11 top-1/2 -translate-y-1/2 text-charcoal font-medium">+91</span>
                      <input type="tel" value={guestDetails.phone} onChange={e => setGuestDetails(prev => ({...prev, phone: e.target.value.replace(/\D/g, '').slice(0,10)}))} className={cn("input w-full !pl-20", guestErrors.phone && "input-error")} placeholder="10-digit number" />
                    </div>
                    <p className="text-xs text-charcoal-lighter mt-1.5 ml-1">We'll send order updates on WhatsApp</p>
                    {guestErrors.phone && <p className="error-text">{guestErrors.phone}</p>}
                  </div>
                  
                  <div>
                    <label className="label">Email Address (Optional)</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input type="email" value={guestDetails.email} onChange={e => setGuestDetails(prev => ({...prev, email: e.target.value}))} className="input w-full !pl-11" placeholder="you@example.com" />
                    </div>
                    <p className="text-xs text-charcoal-lighter mt-1.5 ml-1">For order confirmation email</p>
                  </div>
                  
                  <div className="pt-4">
                    <button onClick={handleGuestContinue} className="btn-primary w-full py-4 text-base">
                      Continue to Address →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* MAIN CHECKOUT (Address + Payment) */}
            {((checkoutMode === 'user') || (checkoutMode === 'guest' && guestStepComplete)) && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                {/* Address Selection */}
                <div className="card-flat p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="font-display text-xl font-medium text-charcoal">Delivery Address</h2>
                    {checkoutMode === 'guest' && (
                      <button onClick={() => setGuestStepComplete(false)} className="text-xs font-medium text-sage-dark hover:underline">
                        Edit Contact Info
                      </button>
                    )}
                  </div>
                  
                  {savedAddresses.length > 0 && (
                    <div className="space-y-3 mb-6">
                      {savedAddresses.map((addr) => (
                        <label
                          key={addr.id}
                          className={cn(
                            "flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors",
                            selectedAddressId === addr.id ? "border-sage-dark bg-sage-50/50" : "border-sage-light/30 hover:border-sage-light"
                          )}
                        >
                          <div className="pt-1">
                            <input 
                              type="radio" 
                              name="selected_address" 
                              className="w-4 h-4 text-sage-dark focus:ring-sage-dark"
                              checked={selectedAddressId === addr.id}
                              onChange={() => handleSelectAddress(addr)}
                            />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-charcoal">{addr.name}</p>
                            <p className="text-sm text-charcoal-lighter mt-1 leading-relaxed">
                              {addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}<br/>
                              {addr.city}, {addr.state} {addr.pincode}
                            </p>
                            <p className="text-sm text-charcoal-lighter mt-1 font-medium">{addr.phone}</p>
                          </div>
                        </label>
                      ))}
                      
                      {!isAddingNew && (
                        <button 
                          onClick={handleAddNewAddress}
                          className="w-full py-4 rounded-xl border-2 border-dashed border-sage-light/50 text-sage-dark font-medium hover:bg-sage-50/50 hover:border-sage-light transition-all flex items-center justify-center gap-2"
                        >
                          + Add New Address
                        </button>
                      )}
                    </div>
                  )}

                  {/* New Address Form */}
                  {isAddingNew && (
                    <div className={cn("grid sm:grid-cols-2 gap-4", savedAddresses.length > 0 && "pt-6 border-t border-sage-light/30")}>
                      <div className="sm:col-span-2 flex items-center justify-between">
                        <h3 className="font-medium text-charcoal">{checkoutMode === 'guest' ? 'Where should we deliver?' : 'Enter New Address'}</h3>
                        {savedAddresses.length > 0 && (
                          <button 
                            onClick={() => handleSelectAddress(savedAddresses[0])}
                            className="text-xs font-medium text-sage-dark hover:underline"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                      
                      {/* Only show Name/Phone if User, Guest info is pre-filled and locked here or hidden, but for simplicity we keep it editable or just read-only */}
                      <div className="sm:col-span-2">
                        <label htmlFor="co-name" className="label">Full Name *</label>
                        <input id="co-name" type="text" value={address.name}
                          onChange={(e) => setAddress((a) => ({ ...a, name: e.target.value }))}
                          className={cn('input', addressErrors.name && 'input-error')} placeholder="Priya Sharma" 
                          readOnly={checkoutMode === 'guest'} 
                          disabled={checkoutMode === 'guest'}
                        />
                        {addressErrors.name && <p className="error-text">{addressErrors.name}</p>}
                      </div>
                      <div>
                        <label htmlFor="co-phone" className="label">Mobile Number *</label>
                        <input id="co-phone" type="tel" value={address.phone}
                          onChange={(e) => setAddress((a) => ({ ...a, phone: e.target.value }))}
                          className={cn('input', addressErrors.phone && 'input-error')} placeholder="10-digit number" maxLength={10} 
                          readOnly={checkoutMode === 'guest'} 
                          disabled={checkoutMode === 'guest'}
                        />
                        {addressErrors.phone && <p className="error-text">{addressErrors.phone}</p>}
                      </div>
                      <div>
                        <label htmlFor="co-pincode" className="label">Pincode *</label>
                        <input id="co-pincode" type="text" value={address.pincode}
                          onChange={(e) => setAddress((a) => ({ ...a, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                          className={cn('input', addressErrors.pincode && 'input-error')} placeholder="380001" maxLength={6} />
                        {addressErrors.pincode && <p className="error-text">{addressErrors.pincode}</p>}
                      </div>
                      <div className="sm:col-span-2">
                        <label htmlFor="co-line1" className="label">Address Line 1 *</label>
                        <input id="co-line1" type="text" value={address.line1}
                          onChange={(e) => setAddress((a) => ({ ...a, line1: e.target.value }))}
                          className={cn('input', addressErrors.line1 && 'input-error')} placeholder="House/Flat no., Street" />
                        {addressErrors.line1 && <p className="error-text">{addressErrors.line1}</p>}
                      </div>
                      <div className="sm:col-span-2">
                        <label htmlFor="co-line2" className="label">Address Line 2 (optional)</label>
                        <input id="co-line2" type="text" value={address.line2 ?? ''}
                          onChange={(e) => setAddress((a) => ({ ...a, line2: e.target.value }))}
                          className="input" placeholder="Landmark, Area" />
                      </div>
                      <div>
                        <label htmlFor="co-city" className="label">City *</label>
                        <input id="co-city" type="text" value={address.city}
                          onChange={(e) => setAddress((a) => ({ ...a, city: e.target.value }))}
                          className={cn('input', addressErrors.city && 'input-error')} placeholder="Ahmedabad" />
                        {addressErrors.city && <p className="error-text">{addressErrors.city}</p>}
                      </div>
                      <div>
                        <label htmlFor="co-state" className="label">State *</label>
                        <select id="co-state" value={address.state}
                          onChange={(e) => setAddress((a) => ({ ...a, state: e.target.value }))}
                          className={cn('select', addressErrors.state && 'input-error')}>
                          <option value="">Select state</option>
                          {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                        {addressErrors.state && <p className="error-text">{addressErrors.state}</p>}
                      </div>
                    </div>
                  )}
                </div>

                {/* Payment Method */}
                <div className="card-flat p-6">
                  <h2 className="font-display text-xl font-medium text-charcoal mb-5">Payment Method</h2>
                  <div className="space-y-3">
                    <label
                      className={cn(
                        'flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all',
                        paymentMethod === 'razorpay' ? 'border-sage-dark bg-sage-50' : 'border-sage-light/30 hover:border-sage-light'
                      )}
                    >
                      <input type="radio" name="payment" value="razorpay"
                        checked={paymentMethod === 'razorpay'}
                        onChange={() => setPaymentMethod('razorpay')}
                        className="accent-sage-dark" id="pay-razorpay" />
                      <div className="flex items-center gap-3 flex-1">
                        <CreditCard className="w-5 h-5 text-sage-dark" />
                        <div>
                          <p className="font-body font-semibold text-sm text-charcoal">Pay Online</p>
                          <p className="text-xs text-charcoal-lighter font-body">UPI, Cards, Net Banking, Wallets</p>
                        </div>
                      </div>
                      <span className="text-xs text-sage-dark font-body font-medium bg-sage-light/20 px-2 py-0.5 rounded">Instant</span>
                    </label>

                    <label
                      className={cn(
                        'flex items-center gap-4 p-4 border-2 rounded-lg transition-all',
                        isCodBanned ? 'opacity-50 cursor-not-allowed border-sage-light/20 bg-gray-50' : 
                        paymentMethod === 'cod' ? 'border-sage-dark bg-sage-50 cursor-pointer' : 'border-sage-light/30 hover:border-sage-light cursor-pointer'
                      )}
                    >
                      <input type="radio" name="payment" value="cod"
                        checked={paymentMethod === 'cod'}
                        onChange={() => !isCodBanned && setPaymentMethod('cod')}
                        disabled={isCodBanned}
                        className="accent-sage-dark disabled:opacity-50" id="pay-cod" />
                      <div className="flex items-center gap-3 flex-1">
                        <Banknote className={cn("w-5 h-5", isCodBanned ? "text-gray-400" : "text-earth")} />
                        <div>
                          <p className="font-body font-semibold text-sm text-charcoal">Cash on Delivery</p>
                          <p className="text-xs text-charcoal-lighter font-body">Pay when your order arrives</p>
                        </div>
                      </div>
                      {isCodBanned ? (
                        <span className="text-xs text-red-600 font-body font-medium bg-red-50 px-2 py-0.5 rounded border border-red-100">Not Available</span>
                      ) : (
                        <span className="text-xs text-earth font-body font-medium bg-amber-50 px-2 py-0.5 rounded">+₹30 COD fee</span>
                      )}
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right: Order Summary (ALWAYS VISIBLE) */}
          <div className="lg:col-span-2">
            <div className="card-flat p-6 sticky top-[calc(var(--header-height)+1rem)]">
              <h2 className="font-display text-xl font-medium text-charcoal mb-5">Order Summary</h2>

              {/* Items */}
              <div className="space-y-3 mb-5">
                {items.map((item) => (
                  <div key={`${item.product_id}-${item.variant_id}`} className="flex items-center gap-3">
                    <div className="w-12 h-14 rounded-md bg-sage-50 overflow-hidden flex-shrink-0">
                      {item.product.images?.[0]?.url && (
                        <img src={item.product.images[0].url} alt={item.product.name}
                          className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-body font-medium text-charcoal line-clamp-1">{item.product.name}</p>
                      {item.variant && <p className="text-xs text-charcoal-lighter">{item.variant.value}</p>}
                      <p className="text-xs text-charcoal-lighter">×{item.quantity}</p>
                    </div>
                    <p className="text-sm font-semibold text-charcoal flex-shrink-0">
                      {formatCurrency(item.total_price)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Coupon */}
              <div className="border-y border-sage-light/20 py-4 mb-4">
                {coupon?.valid ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-sage-dark" />
                      <span className="text-sm font-body font-medium text-sage-dark">{couponCode.toUpperCase()}</span>
                    </div>
                    <button onClick={() => { removeCoupon(); setCouponCode(''); }} className="text-red-400 hover:text-red-600 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === 'Enter' && applyDiscount()}
                      placeholder="Coupon code"
                      className="input flex-1 text-sm py-2"
                      id="checkout-coupon"
                    />
                    <button onClick={applyDiscount} disabled={couponLoading || !couponCode}
                      className="btn-secondary py-2 px-4 text-sm flex-shrink-0">
                      {couponLoading ? <div className="w-4 h-4 border-2 border-sage-dark border-t-transparent rounded-full animate-spin" /> : 'Apply'}
                    </button>
                  </div>
                )}
              </div>

              {/* Totals */}
              <div className="space-y-2 mb-5">
                <div className="flex justify-between text-sm font-body text-charcoal-lighter">
                  <span>Subtotal ({totals.item_count} items)</span>
                  <span>{formatCurrency(totals.subtotal)}</span>
                </div>
                {totals.discount_amount > 0 && (
                  <div className="flex justify-between text-sm font-body text-sage-dark">
                    <span>Discount</span>
                    <span>-{formatCurrency(totals.discount_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-body text-charcoal-lighter">
                  <span>Shipping</span>
                  <span>{totals.shipping_amount === 0 ? <span className="text-sage-dark font-medium">FREE</span> : formatCurrency(totals.shipping_amount)}</span>
                </div>
                <div className="flex justify-between text-sm font-body text-charcoal-lighter">
                  <span>GST (included)</span>
                  <span>{formatCurrency(totals.tax_amount)}</span>
                </div>
                <div className="flex justify-between font-body font-bold text-charcoal text-base border-t border-sage-light/30 pt-2 mt-1">
                  <span>Total</span>
                  <span>{formatCurrency(totals.total + (paymentMethod === 'cod' ? 30 : 0))}</span>
                </div>
              </div>

              <button
                onClick={placeOrder}
                disabled={loading || checkoutMode === 'login_prompt' || (checkoutMode === 'guest' && !guestStepComplete)}
                className="btn-primary w-full justify-center py-4 text-base disabled:opacity-50"
                id="checkout-place-order"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : checkoutMode === 'login_prompt' ? (
                  'Select checkout option above'
                ) : (checkoutMode === 'guest' && !guestStepComplete) ? (
                  'Complete Guest Details'
                ) : paymentMethod === 'cod' ? (
                  <>
                    <Banknote className="w-5 h-5" />
                    Place Order (COD)
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Pay {formatCurrency(totals.total)}
                  </>
                )}
              </button>

              <p className="text-xs text-charcoal-lighter text-center mt-3 font-body flex items-center justify-center gap-1">
                🔒 Secured by SSL · <span className="font-medium">Razorpay</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
