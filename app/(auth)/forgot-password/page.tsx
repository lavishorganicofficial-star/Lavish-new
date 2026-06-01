'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, ArrowLeft, KeyRound, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/store/uiStore';
import { cn } from '@/lib/utils';

export default function ForgotPasswordPage() {
  const toast = useToast();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [countdown, setCountdown] = useState(0);

  // Handle countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleSendResetLink = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      toast.error('Invalid email', 'Please enter a valid email address.');
      return;
    }

    setLoading(true);
    
    // Auto-lowercase on submit
    const cleanEmail = email.toLowerCase().trim();
    setEmail(cleanEmail);

    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      toast.error('Failed to send link', error.message);
      setLoading(false);
      return;
    }

    setStep(2);
    setCountdown(60); // 60 seconds cooldown
    setLoading(false);
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
        </div>

        <div className="mt-8 card-flat px-4 py-8 sm:px-10 shadow-xl shadow-sage-dark/5 border-sage-dark/10">
          
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-sage-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-sage-dark/10">
                  <KeyRound className="w-6 h-6 text-sage-dark" />
                </div>
                <h2 className="font-display text-2xl font-medium text-charcoal">Reset Your Password</h2>
                <p className="mt-2 text-sm text-charcoal-lighter font-body">
                  Enter the email linked to your account and we'll send a reset link.
                </p>
              </div>

              <form className="space-y-6" onSubmit={handleSendResetLink}>
                <div>
                  <label className="label">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input w-full !pl-11"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </form>
              
              <div className="mt-8 text-center">
                <Link href="/login" className="inline-flex items-center gap-2 text-sm font-medium text-sage-dark hover:underline">
                  <ArrowLeft className="w-4 h-4" /> Back to Sign In
                </Link>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in fade-in zoom-in-95 duration-500 text-center">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-100">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="font-display text-2xl font-medium text-charcoal mb-2">Check Your Email</h2>
              
              <div className="bg-sage-50 p-4 rounded-xl border border-sage-light/20 text-sm text-charcoal mb-6">
                We sent a reset link to:<br/>
                <strong className="text-sage-dark mt-1 inline-block">{email}</strong>
              </div>

              <ul className="text-left text-sm text-charcoal-lighter space-y-3 mb-8">
                <li className="flex items-start gap-2">
                  <span className="text-sage-dark mt-0.5">✓</span> Check your inbox (or spam folder)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-sage-dark mt-0.5">✓</span> Click the reset link
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-sage-dark mt-0.5">✓</span> Create your new password
                </li>
              </ul>

              <div className="space-y-4 pt-4 border-t border-gray-100">
                <div className="text-sm">
                  <span className="text-charcoal-lighter">Didn't receive it? </span>
                  <button 
                    onClick={() => handleSendResetLink()} 
                    disabled={countdown > 0 || loading}
                    className={cn(
                      "font-medium transition-colors",
                      countdown > 0 ? "text-gray-400 cursor-not-allowed" : "text-sage-dark hover:underline"
                    )}
                  >
                    {loading ? 'Sending...' : 'Resend Email'}
                  </button>
                  {countdown > 0 && (
                    <p className="text-xs text-charcoal-lighter mt-1.5">
                      Countdown: resend in {countdown}s
                    </p>
                  )}
                </div>

                <div className="text-sm">
                  <span className="text-charcoal-lighter">Wrong email? </span>
                  <button onClick={() => setStep(1)} className="font-medium text-sage-dark hover:underline">
                    Change email
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
