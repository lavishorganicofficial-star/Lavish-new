'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, User, Phone, Mail, Lock, Tag, CheckCircle2, ShieldCheck, Truck, Gift, Bell, Package, XCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/store/uiStore';
import { cn } from '@/lib/utils';
import { getVisitorId } from '@/lib/analytics';

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') ?? '/account';
  const initialEmail = searchParams.get('email') ?? '';
  const toast = useToast();
  const supabase = createClient();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: initialEmail,
    password: '',
    referral: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Validation State
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [validFields, setValidFields] = useState<{ [key: string]: boolean }>({
    email: !!initialEmail && /\S+@\S+\.\S+/.test(initialEmail)
  });
  
  // Referral State
  const [referralStatus, setReferralStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [referralMessage, setReferralMessage] = useState('');

  // Password Strength
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: 'bg-gray-200' };
    if (pass.length < 8) return { score: 1, label: 'Weak', color: 'bg-red-400' };
    const hasLetters = /[a-zA-Z]/.test(pass);
    const hasNumbers = /[0-9]/.test(pass);
    const hasSpecial = /[^a-zA-Z0-9]/.test(pass);
    if (hasLetters && hasNumbers && hasSpecial && pass.length >= 8) return { score: 3, label: 'Strong', color: 'bg-green-500' };
    if ((hasLetters && hasNumbers) || (hasLetters && hasSpecial)) return { score: 2, label: 'Good', color: 'bg-yellow-400' };
    return { score: 1, label: 'Weak', color: 'bg-red-400' };
  };
  
  const pwStrength = getPasswordStrength(formData.password);

  const validateField = async (field: string, value: string) => {
    let error = '';
    let isValid = false;

    if (field === 'name') {
      if (!value.trim()) error = 'Name is required';
      else if (value.trim().length < 2) error = 'Name is too short';
      else isValid = true;
    }
    else if (field === 'phone') {
      const numericPhone = value.replace(/\D/g, '');
      if (numericPhone.length !== 10) error = 'Enter 10-digit number';
      else isValid = true;
    }
    else if (field === 'email') {
      if (!/\S+@\S+\.\S+/.test(value)) error = 'Invalid email';
      else {
        // Debounced duplicate check could go here, but for now we just do basic syntax
        // Real duplicate check happens on form submit to prevent too many DB calls
        isValid = true;
      }
    }
    else if (field === 'password') {
      if (value.length < 8) error = 'Must be at least 8 characters';
      else isValid = true;
    }

    setErrors(prev => ({ ...prev, [field]: error }));
    setValidFields(prev => ({ ...prev, [field]: isValid }));
    return isValid;
  };

  const handleBlur = (field: string) => {
    validateField(field, formData[field as keyof typeof formData]);
  };

  const checkReferral = async () => {
    if (!formData.referral.trim()) {
      setReferralStatus('idle');
      return;
    }
    setReferralStatus('checking');
    
    // First check if it's a valid influencer referral code in profiles
    const { data: profileRef } = await supabase.from('profiles').select('id, referral_code').ilike('referral_code', formData.referral).single();
    if (profileRef) {
      setReferralStatus('valid');
      setReferralMessage('✓ Referral applied!');
      return;
    }

    // Then check coupons
    const { data: coupon } = await supabase.from('coupons').select('type, value').eq('code', formData.referral.toUpperCase()).eq('is_active', true).single();
    if (coupon) {
      setReferralStatus('valid');
      const off = coupon.type === 'percentage' ? `${coupon.value}%` : `₹${coupon.value}`;
      setReferralMessage(`✓ Code applied! You'll get ${off} off`);
    } else {
      setReferralStatus('invalid');
      setReferralMessage('✗ Invalid code');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Force validate all
    const vName = await validateField('name', formData.name);
    const vPhone = await validateField('phone', formData.phone);
    const vEmail = await validateField('email', formData.email);
    const vPass = await validateField('password', formData.password);
    
    if (!vName || !vPhone || !vEmail || !vPass) return;

    setLoading(true);
    setErrors({});

    const numericPhone = formData.phone.replace(/\D/g, '');

    // Sign up via auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email.toLowerCase().trim(),
      password: formData.password,
      options: {
        data: {
          full_name: formData.name.trim(),
          phone: numericPhone,
          user_role: 'customer' // default metadata
        }
      }
    });

    if (authError) {
      if (authError.message.includes('User already registered')) {
        setErrors({ email: 'Account found! Sign in instead →' });
      } else {
        setErrors({ general: authError.message });
      }
      setLoading(false);
      return;
    }

    if (authData.user) {
      // Create profile row is handled by Postgres Trigger usually (003_auth_hook.sql),
      // But we can ensure it has phone. The trigger takes `raw_user_meta_data->>'full_name'`.
      // We will do a manual update just in case:
      await supabase.from('profiles').update({
        phone: numericPhone
      }).eq('id', authData.user.id);

      // Handle Referral Click conversion
      if (formData.referral && referralStatus === 'valid') {
        const { data: profileRef } = await supabase.from('profiles').select('id').ilike('referral_code', formData.referral).single();
        if (profileRef) {
          const visitorId = getVisitorId();
          await supabase.from('influencer_clicks').insert({
            influencer_id: profileRef.id,
            visitor_id: visitorId,
            converted: true
          });
        }
      }

      toast.success('Account created successfully!');
      router.push(redirectTo);
    }
    setLoading(false);
  };

  const handleGoogleSignup = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${redirectTo}` }
    });
    if (error) toast.error('Google signup failed', error.message);
  };

  return (
    <div className="min-h-screen bg-cream flex">
      {/* LEFT: Form Section */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:w-[50%] xl:w-[45%] relative z-10 bg-cream lg:bg-white lg:shadow-xl">
        <div className="w-full max-w-md mx-auto">
          <div className="text-center lg:text-left">
            <Link href="/" className="inline-block">
              <Image src="https://res.cloudinary.com/dtrin6lwv/image/upload/v1780070716/a2ecfeef-39b1-4dbd-9245-f43f8529fb41_nsnzp6.png" alt="LavishOrganic" width={160} height={48} className="object-contain h-10 w-auto lg:mx-0 mx-auto" />
            </Link>
            <h2 className="mt-8 font-display text-3xl font-medium text-charcoal">Create your account</h2>
            <p className="mt-2 text-sm text-charcoal-lighter font-body flex items-center justify-center lg:justify-start gap-2">
              <ShieldCheck className="w-4 h-4 text-sage-dark" /> Join 12,000+ happy customers
            </p>
          </div>

          <div className="mt-8">
            <button onClick={handleGoogleSignup} type="button" className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 rounded-xl shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-offset-2 focus:ring-sage-dark transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                <path d="M1 1h22v22H1z" fill="none" />
              </svg>
              Sign up with Google
            </button>

            <div className="mt-6 relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
              <div className="relative flex justify-center text-sm"><span className="px-2 bg-cream lg:bg-white text-gray-500 font-body">or</span></div>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              {errors.general && (
                <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100 font-medium">
                  {errors.general}
                </div>
              )}
              
              <div>
                <label className="label">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                    onBlur={() => handleBlur('name')}
                    className={cn("input w-full !pl-11 !pr-11", errors.name && "input-error")}
                    placeholder="Priya Sharma"
                  />
                  {validFields.name && <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />}
                </div>
                {errors.name && <p className="error-text">{errors.name}</p>}
              </div>

              <div>
                <label className="label mb-0">Mobile Number</label>
                <p className="text-xs text-charcoal-lighter mb-1.5">(For order updates on WhatsApp)</p>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <span className="absolute left-11 top-1/2 -translate-y-1/2 text-charcoal font-medium">+91</span>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0,10);
                      setFormData(prev => ({...prev, phone: val}));
                    }}
                    onBlur={() => handleBlur('phone')}
                    className={cn("input w-full !pl-20 !pr-11", errors.phone && "input-error")}
                    placeholder="10-digit number"
                  />
                  {validFields.phone && <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />}
                </div>
                {errors.phone && <p className="error-text">{errors.phone}</p>}
              </div>

              <div>
                <label className="label">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({...prev, email: e.target.value}))}
                    onBlur={() => handleBlur('email')}
                    className={cn("input w-full !pl-11 !pr-11", errors.email && "input-error")}
                    placeholder="you@example.com"
                  />
                  {validFields.email && !errors.email && <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />}
                </div>
                {errors.email && (
                  <p className="error-text">
                    {errors.email === 'Account found! Sign in instead →' ? (
                      <Link href={`/login?redirectTo=${redirectTo}`} className="text-sage-dark underline font-medium hover:text-sage-600">{errors.email}</Link>
                    ) : errors.email}
                  </p>
                )}
              </div>

              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => {
                      setFormData(prev => ({...prev, password: e.target.value}));
                      if (errors.password) validateField('password', e.target.value);
                    }}
                    onBlur={() => handleBlur('password')}
                    className={cn("input w-full !pl-11 !pr-11", errors.password && "input-error")}
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password ? (
                  <p className="error-text">{errors.password}</p>
                ) : (
                  <p className="text-xs text-charcoal-lighter mt-1.5 ml-1">Must be at least 8 characters</p>
                )}
                
                {/* Password Strength Meter */}
                {formData.password.length > 0 && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 flex gap-1 h-1.5 rounded-full overflow-hidden bg-gray-100">
                      <div className={cn("h-full transition-all", pwStrength.score >= 1 ? pwStrength.color : 'bg-transparent', pwStrength.score === 1 && 'w-1/3', pwStrength.score === 2 && 'w-2/3', pwStrength.score === 3 && 'w-full')} />
                    </div>
                    <span className={cn("text-xs font-medium w-12", pwStrength.color.replace('bg-', 'text-').replace('400', '500'))}>{pwStrength.label}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="label mb-0">Referral Code (Optional)</label>
                <p className="text-xs text-charcoal-lighter mb-1.5">Have a friend's code? Both of you benefit!</p>
                <div className="relative">
                  <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.referral}
                    onChange={(e) => {
                      setFormData(prev => ({...prev, referral: e.target.value.toUpperCase()}));
                      setReferralStatus('idle');
                      setReferralMessage('');
                    }}
                    onBlur={checkReferral}
                    className={cn("input w-full !pl-11 !pr-11", (errors.referral || referralStatus === 'invalid') && "input-error", referralStatus === 'valid' && "border-green-500 bg-green-50/30")}
                    placeholder="CODE"
                  />
                  {referralStatus === 'checking' && <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-sage-dark border-t-transparent rounded-full animate-spin" />}
                  {referralStatus === 'valid' && <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />}
                  {referralStatus === 'invalid' && <XCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />}
                </div>
                {referralMessage && (
                  <p className={cn("text-xs mt-1.5 font-medium ml-1", referralStatus === 'valid' ? "text-green-600" : "text-red-500")}>
                    {referralMessage}
                  </p>
                )}
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-4 text-base">
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Create My Account'}
              </button>
              
              <p className="text-xs text-center text-charcoal-lighter mt-4 font-body leading-relaxed px-4">
                By creating an account you agree to our <Link href="/terms" className="underline hover:text-charcoal">Terms of Service</Link> and <Link href="/privacy" className="underline hover:text-charcoal">Privacy Policy</Link>
              </p>
            </form>

            <div className="mt-8 border-t border-gray-100 pt-6 text-center">
              <p className="text-sm text-charcoal-lighter font-body">
                Already have an account?{' '}
                <Link href={`/login?redirectTo=${redirectTo}`} className="font-semibold text-sage-dark hover:underline">
                  Sign in →
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: Benefits & Trust Panel (Desktop Only) */}
      <div className="hidden lg:flex flex-1 bg-sage-50 relative overflow-hidden flex-col items-center justify-center p-12">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sage-dark/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-sage-dark/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none" />
        
        <div className="max-w-md w-full relative z-10 space-y-12">
          
          <div>
            <h3 className="font-display text-2xl text-charcoal mb-8 tracking-wide">WHY CREATE AN ACCOUNT?</h3>
            <div className="space-y-6">
              {[
                { icon: Package, text: 'Track all your orders in one place' },
                { icon: Tag, text: 'Exclusive member discounts' },
                { icon: Zap, text: 'Faster checkout every time' },
                { icon: Gift, text: 'Birthday special offers' },
                { icon: Bell, text: 'Early access to new product alerts' }
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-sage-dark shadow-sm shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="font-medium text-charcoal">{item.text}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-sage-light/20">
              <div className="flex gap-1 text-yellow-400 mb-3">
                {Array(5).fill(0).map((_, i) => <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>)}
              </div>
              <p className="text-charcoal text-sm italic mb-2">"Best organic brand I've tried! The checkout is so fast and the products are incredibly authentic."</p>
              <p className="text-xs text-charcoal-lighter font-medium">— Priya S., Mumbai</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-sage-light/20">
              <div className="flex gap-1 text-yellow-400 mb-3">
                {Array(5).fill(0).map((_, i) => <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>)}
              </div>
              <p className="text-charcoal text-sm italic mb-2">"Fast delivery, genuine products. I love tracking my orders directly from the dashboard."</p>
              <p className="text-xs text-charcoal-lighter font-medium">— Rahul M., Delhi</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Dummy Zap icon component since lucide Zap wasn't explicitly imported above but I can import it
function Zap(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>;
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-sage-dark border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <RegisterContent />
    </Suspense>
  );
}
