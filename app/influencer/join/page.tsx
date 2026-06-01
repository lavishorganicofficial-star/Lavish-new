'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useToast } from '@/store/uiStore';
import { ArrowRight, Leaf, TrendingUp, Gift, CheckCircle } from 'lucide-react';

export default function InfluencerJoinPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const res = await fetch('/api/influencer/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (json.success) {
        setSubmitted(true);
      } else {
        toast.error('Application failed', json.error);
      }
    } catch (err) {
      toast.error('Application failed', 'Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white p-10 md:p-14 rounded-3xl shadow-warm-lg max-w-lg w-full border border-sage-light/20">
          <div className="w-24 h-24 bg-sage-50 rounded-full flex items-center justify-center mx-auto mb-8 border-8 border-white shadow-sm">
            <CheckCircle className="w-12 h-12 text-sage-dark" />
          </div>
          <h1 className="font-display text-4xl font-medium text-charcoal mb-4" style={{ color: '#2C3E35' }}>Application Received!</h1>
          <p className="text-charcoal-lighter font-body mb-8 leading-relaxed text-lg">
            Thank you for your interest! Our team will review your application and get back to you within 48 hours via WhatsApp and Email.
          </p>
          <Link href="/" className="btn-primary w-full py-4 text-base">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-cream flex overflow-hidden">
      {/* Left: Branding & Motivation panel */}
      <div className="hidden lg:flex lg:w-5/12 bg-charcoal relative flex-col justify-between p-12">
        <div className="absolute inset-0 z-0">
          <Image 
            src="https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=1200&q=80" 
            alt="Background" 
            fill 
            className="object-cover opacity-20"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-sage-dark/80 to-charcoal/90" />
        </div>
        
        <div className="relative z-10 flex flex-col h-full">
          <Link href="/" className="mb-auto">
            <Image
              src="https://res.cloudinary.com/dtrin6lwv/image/upload/v1780070716/a2ecfeef-39b1-4dbd-9245-f43f8529fb41_nsnzp6.png"
              alt="LavishOrganic Logo"
              width={160}
              height={48}
              className="object-contain w-auto h-10 brightness-0 invert"
              priority
            />
          </Link>

          <div className="mt-auto">
            {/* Forced inline style for color to prevent global h1 overrides */}
            <h1 className="font-display text-4xl xl:text-5xl font-medium mb-4 leading-tight" style={{ color: '#FFFFFF' }}>
              Partner with LavishOrganic <span className="inline-block">🌿</span>
            </h1>
            <p className="text-white/90 text-base leading-relaxed mb-8 max-w-md">
              Join our exclusive creator program. Share the organic products you love and get rewarded for every sale you drive.
            </p>
            
            <div className="flex flex-col gap-5 max-w-md">
              <div className="flex gap-4 items-center">
                <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-5 h-5 text-sage-light" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm mb-0.5" style={{ color: '#FFFFFF' }}>Earn 15% Commission</h3>
                  <p className="text-white/60 text-xs">Industry-leading payout rates on all sales.</p>
                </div>
              </div>
              <div className="flex gap-4 items-center">
                <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center flex-shrink-0">
                  <Leaf className="w-5 h-5 text-sage-light" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm mb-0.5" style={{ color: '#FFFFFF' }}>Private Dashboard</h3>
                  <p className="text-white/60 text-xs">Track clicks, sales, and request payouts instantly.</p>
                </div>
              </div>
              <div className="flex gap-4 items-center">
                <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center flex-shrink-0">
                  <Gift className="w-5 h-5 text-sage-light" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm mb-0.5" style={{ color: '#FFFFFF' }}>Free PR Packages</h3>
                  <p className="text-white/60 text-xs">Exclusive access to new product launches.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Application Form (Compact Single Page) */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto custom-scrollbar">
        <div className="min-h-full flex flex-col items-center justify-center p-6 lg:p-8">
          <div className="w-full max-w-2xl bg-white rounded-3xl p-6 lg:p-8 shadow-warm border border-sage-light/20">
            
            <div className="mb-6 flex justify-between items-end">
              <div>
                <h2 className="font-display text-2xl font-semibold text-charcoal mb-1" style={{ color: '#2C3E35' }}>Creator Application</h2>
                <p className="text-charcoal-lighter text-sm">Tell us about yourself and your audience.</p>
              </div>
              <div className="hidden sm:block text-right">
                <Link href="/" className="w-10 h-10 bg-sage-50 rounded-full flex items-center justify-center ml-auto hover:bg-sage-light/20 transition-colors">
                  <Leaf className="w-5 h-5 text-sage-dark" />
                </Link>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Compact Grid Layout */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-sage-dark uppercase tracking-wider">Full Name *</label>
                  <input required type="text" name="name" className="w-full border border-sage-light/40 bg-warm-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-sage-dark" placeholder="e.g. Priya Sharma" />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-sage-dark uppercase tracking-wider">WhatsApp Number *</label>
                  <input required type="tel" name="phone" className="w-full border border-sage-light/40 bg-warm-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-sage-dark" placeholder="9876543210" />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-sage-dark uppercase tracking-wider">Email Address *</label>
                  <input required type="email" name="email" className="w-full border border-sage-light/40 bg-warm-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-sage-dark" placeholder="priya@example.com" />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-sage-dark uppercase tracking-wider">Create Password *</label>
                  <input required type="password" name="password" className="w-full border border-sage-light/40 bg-warm-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-sage-dark" placeholder="Min 6 characters" />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-sage-dark uppercase tracking-wider">Instagram Handle *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-lighter text-sm">@</span>
                    <input required type="text" name="instagram_handle" className="w-full border border-sage-light/40 bg-warm-white rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:border-sage-dark" placeholder="username" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-sage-dark uppercase tracking-wider">Follower Count *</label>
                  <input required type="number" name="follower_count" className="w-full border border-sage-light/40 bg-warm-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-sage-dark" placeholder="e.g. 15000" />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-sage-dark uppercase tracking-wider">Content Niche *</label>
                  <select required name="content_niche" className="w-full border border-sage-light/40 bg-warm-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-sage-dark appearance-none">
                    <option value="">Select main niche...</option>
                    <option value="skincare">Skincare & Beauty</option>
                    <option value="lifestyle">Lifestyle & Fashion</option>
                    <option value="wellness">Health & Wellness</option>
                    <option value="mom">Mom / Parenting</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-sage-dark uppercase tracking-wider">Youtube (Optional)</label>
                  <input type="text" name="youtube_channel" className="w-full border border-sage-light/40 bg-warm-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-sage-dark" placeholder="Channel Link" />
                </div>
              </div>

              <div className="space-y-1 mt-1">
                <label className="text-[11px] font-bold text-sage-dark uppercase tracking-wider">Why partner with us?</label>
                <textarea name="notes" rows={2} className="w-full border border-sage-light/40 bg-warm-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-sage-dark resize-none" placeholder="Tell us why your audience would love LavishOrganic..."></textarea>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-sm mt-2 flex justify-center shadow-md">
                {loading ? 'Submitting...' : 'Submit Application'}
              </button>
            </form>
            
            <div className="mt-5 text-center">
              <p className="text-xs text-charcoal-lighter font-body">
                Already a partner?{' '}
                <Link href="/influencer/login" className="text-sage-dark font-medium hover:underline">
                  Login to Dashboard
                </Link>
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
