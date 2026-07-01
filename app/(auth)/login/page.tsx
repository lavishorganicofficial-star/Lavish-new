'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Lock, Truck, ShieldCheck, Mail, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/store/uiStore';
import { cn } from '@/lib/utils';
import { Suspense } from 'react';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') ?? '/account';
  const toast = useToast();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});

  useEffect(() => {
    // Remember last used email
    const storedEmail = localStorage.getItem('lo_last_email');
    if (storedEmail) setEmail(storedEmail);
  }, []);

  const validate = () => {
    const errs: typeof errors = {};
    if (!email) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Enter a valid email address';
    if (!password) errs.password = 'Password is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrors({});
    
    // Auto-lowercase on submit/blur
    const cleanEmail = email.toLowerCase().trim();
    setEmail(cleanEmail);

    const { data: authData, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        setErrors({ password: 'Incorrect password or email.', email: 'No account found?' });
      } else {
        setErrors({ general: error.message });
      }
      toast.error('Login failed', error.message);
    } else if (authData?.user) {
      localStorage.setItem('lo_last_email', cleanEmail);
      
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', authData.user.id).single();
      
      toast.success('Welcome back!');
      if (profile?.role === 'influencer') {
        router.push('/influencer/dashboard');
      } else if (profile?.role === 'admin') {
        router.push('/admin');
      } else {
        router.push(redirectTo !== '/account' && redirectTo !== '/' ? redirectTo : '/account');
      }
      router.refresh();
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${redirectTo}`
      }
    });
    if (error) toast.error('Google login failed', error.message);
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-64 bg-sage-dark/5 rounded-b-[100%] pointer-events-none -translate-y-1/2"></div>
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="text-center">
          <Link href="/" className="inline-block">
            <Image
              src="https://res.cloudinary.com/dtrin6lwv/image/upload/v1780070716/a2ecfeef-39b1-4dbd-9245-f43f8529fb41_nsnzp6.png"
              alt="LavishOrganic Logo"
              width={160}
              height={48}
              className="object-contain h-10 w-auto mx-auto"
            />
          </Link>
          <h2 className="mt-6 font-display text-3xl font-medium text-charcoal">Welcome back</h2>
          <p className="mt-2 text-sm text-charcoal-lighter font-body">Sign in to continue shopping</p>
        </div>

        <div className="mt-8 card-flat px-4 py-8 sm:px-10 shadow-xl shadow-sage-dark/5 border-sage-dark/10">
          
          <button
            onClick={handleGoogleLogin}
            type="button"
            className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 rounded-xl shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sage-dark transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
              <path d="M1 1h22v22H1z" fill="none" />
            </svg>
            Login with Google
          </button>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500 font-body">or</span>
              </div>
            </div>
          </div>

          <form className="mt-6 space-y-5" onSubmit={handleEmailLogin}>
            {errors.general && (
              <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100 font-medium">
                {errors.general}
              </div>
            )}
            
            <div>
              <label className="label">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setEmail(email.toLowerCase().trim())}
                  className={cn("input w-full !pl-11", errors.email && "input-error")}
                  placeholder="you@example.com"
                />
              </div>
              {errors.email && (
                <p className="error-text">
                  {errors.email === 'No account found?' ? (
                    <span>No account found. <Link href="/register" className="underline hover:text-sage-dark font-medium">Create one free →</Link></span>
                  ) : errors.email}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label mb-0">Password</label>
                <Link href="/forgot-password" className="text-sm text-sage-dark hover:underline font-medium">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={cn("input w-full !pl-11 !pr-11", errors.password && "input-error")}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="error-text">
                  {errors.password.includes('Incorrect') ? (
                    <span>{errors.password} <Link href="/forgot-password" className="underline hover:text-sage-dark font-medium">Forgot it?</Link></span>
                  ) : errors.password}
                </p>
              )}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2 text-base">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-8 border-t border-gray-100 pt-6">
            <p className="text-center text-sm text-charcoal-lighter font-body">
              New to LavishOrganic?
            </p>
            <Link 
              href={`/register?redirectTo=${redirectTo}`}
              className="mt-2 block w-full text-center py-3 px-4 border-2 border-sage-dark/20 rounded-xl shadow-sm text-sm font-semibold text-sage-dark hover:bg-sage-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sage-dark transition-colors"
            >
              Create free account
            </Link>
          </div>
          
          <div className="mt-6 border-t border-gray-100 pt-6 text-center">
            <p className="text-sm text-charcoal-lighter font-body mb-2">Are you a LavishOrganic Partner?</p>
            <Link href="/influencer/login" className="text-sm text-sage-dark font-medium hover:underline inline-flex items-center gap-1">
              Login to Partner Dashboard <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
        
        {/* Trust Signals */}
        <div className="mt-8 hidden sm:flex items-center justify-center gap-6 text-xs font-medium text-charcoal-lighter">
          <div className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-sage-dark" /> Secure login</div>
          <span className="w-1 h-1 rounded-full bg-gray-300"></span>
          <div className="flex items-center gap-1.5"><span className="text-sage-dark text-sm">🌿</span> 100% Organic</div>
          <span className="w-1 h-1 rounded-full bg-gray-300"></span>
          <div className="flex items-center gap-1.5"><Truck className="w-4 h-4 text-sage-dark" /> Free delivery ₹499+</div>
        </div>

      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-sage-dark border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
