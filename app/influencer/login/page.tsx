'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Leaf, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/store/uiStore';
import { cn } from '@/lib/utils';

export default function InfluencerLoginPage() {
  const router = useRouter();
  const toast = useToast();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});

  const validate = () => {
    const errs: typeof errors = {};
    if (!email) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Enter a valid email address';
    if (!password) errs.password = 'Password is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrors({});

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setErrors({ general: authError.message });
      toast.error('Login failed', authError.message);
      setLoading(false);
      return;
    }

    if (authData.user) {
      // Check role
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', authData.user.id).single();
      const { data: infProfile } = await supabase.from('influencer_profiles').select('id').eq('id', authData.user.id).single();
      
      if ((profile?.role === 'customer' || profile?.role === 'user') && !infProfile) {
        // Customer tried to use partner login
        await supabase.auth.signOut();
        setErrors({ general: 'This account is registered as a customer. Please use the shop login instead.' });
      } else {
        // Influencer, Admin, or Pending Applicant
        toast.success('Welcome back!');
        router.push('/influencer/dashboard');
        router.refresh();
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-sage-dark via-charcoal to-charcoal text-white relative">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1556228720-195a672e8a03?w=1200&q=80')] opacity-10 bg-cover bg-center mix-blend-overlay"></div>
      
      <div className="w-full max-w-[420px] bg-white rounded-3xl p-8 md:p-10 shadow-2xl relative z-10 text-charcoal">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-sage-dark rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
            <Leaf className="w-6 h-6 text-white" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-charcoal">LavishOrganic</h1>
          <p className="text-sage-dark font-medium tracking-wide uppercase text-xs mt-1 mb-3">Partner Portal</p>
          <p className="text-charcoal-lighter text-sm">Welcome back! Track your earnings and performance.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {errors.general && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {errors.general}
              {errors.general.includes('shop login') && (
                <Link href="/login" className="block mt-2 font-medium underline">Go to Shop Login &rarr;</Link>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-charcoal">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={cn('w-full border border-sage-light/40 bg-warm-white rounded-lg px-4 py-3.5 text-sm focus:outline-none focus:border-sage-dark transition-colors', errors.email && 'border-red-300 bg-red-50')}
              placeholder="you@example.com"
            />
            {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-charcoal">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={cn('w-full border border-sage-light/40 bg-warm-white rounded-lg pl-4 pr-11 py-3.5 text-sm focus:outline-none focus:border-sage-dark transition-colors', errors.password && 'border-red-300 bg-red-50')}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-lighter hover:text-charcoal"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-4 text-sm mt-4 flex justify-center shadow-md">
            {loading ? 'Signing in...' : 'Login to Dashboard'}
          </button>
        </form>

        <div className="mt-8 space-y-4 text-center">
          <Link href="/influencer/forgot-password" className="text-sm text-sage-dark hover:underline font-medium block">
            Forgot password?
          </Link>

          <div className="pt-4 border-t border-sage-light/20">
            <p className="text-xs text-charcoal-lighter mb-1">New to LavishOrganic Partnerships?</p>
            <Link href="/influencer/join" className="text-sm text-sage-dark font-medium hover:underline inline-flex items-center gap-1">
              Apply to Become a Partner <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="pt-4 border-t border-sage-light/20">
            <p className="text-xs text-charcoal-lighter mb-1">Are you a customer?</p>
            <Link href="/login" className="text-sm text-charcoal font-medium hover:underline inline-flex items-center gap-1">
              Shop Login <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
