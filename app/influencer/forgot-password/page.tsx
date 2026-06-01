'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Leaf, ArrowLeft, MailCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/store/uiStore';
import { cn } from '@/lib/utils';

export default function InfluencerForgotPasswordPage() {
  const toast = useToast();
  const supabase = createClient();
  
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Email is required');
      return;
    }
    
    setLoading(true);
    setError('');

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/influencer/dashboard/profile`,
    });

    if (resetError) {
      setError(resetError.message);
      toast.error('Reset failed', resetError.message);
    } else {
      setSubmitted(true);
      toast.success('Reset link sent!');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-sage-dark via-charcoal to-charcoal text-white relative">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1556228720-195a672e8a03?w=1200&q=80')] opacity-10 bg-cover bg-center mix-blend-overlay"></div>
      
      <div className="w-full max-w-[420px] bg-white rounded-3xl p-8 md:p-10 shadow-2xl relative z-10 text-charcoal text-center">
        {!submitted ? (
          <>
            <div className="w-12 h-12 bg-sage-dark rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <h1 className="font-display text-2xl font-semibold text-charcoal">Partner Portal</h1>
            <p className="text-charcoal-lighter text-sm mt-2 mb-8">Enter your email address and we'll send you a link to reset your password.</p>

            <form onSubmit={handleReset} className="space-y-4 text-left">
              {error && (
                <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  {error}
                </div>
              )}
              
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-charcoal">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={cn('input-field bg-warm-white', error && 'border-red-300 bg-red-50')}
                  placeholder="you@example.com"
                  required
                />
              </div>

              <button type="submit" disabled={loading} className="w-full btn-primary py-3.5 mt-4 flex justify-center">
                {loading ? 'Sending Link...' : 'Send Reset Link'}
              </button>
            </form>
          </>
        ) : (
          <div className="py-4">
            <div className="w-16 h-16 bg-sage-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <MailCheck className="w-8 h-8 text-sage-dark" />
            </div>
            <h2 className="font-display text-xl font-semibold text-charcoal mb-2">Check your email</h2>
            <p className="text-charcoal-lighter text-sm mb-8">
              We've sent a password reset link to <br/> <span className="font-medium text-charcoal">{email}</span>
            </p>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-sage-light/20">
          <Link href="/influencer/login" className="text-sm text-charcoal font-medium hover:underline inline-flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
