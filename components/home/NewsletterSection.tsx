'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, CheckCircle } from 'lucide-react';

export function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    try {
      // TODO: integrate with email marketing platform (Mailchimp, etc.)
      await new Promise((resolve) => setTimeout(resolve, 1000)); // simulate API
      setStatus('success');
      setEmail('');
    } catch {
      setStatus('error');
    }
  };

  return (
    <section
      className="py-20 bg-sage-dark relative overflow-hidden"
      aria-labelledby="newsletter-heading"
    >
      {/* Decorative */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-sage/20" />
        <div className="absolute -bottom-16 -left-16 w-80 h-80 rounded-full bg-sage-light/10" />
      </div>

      <div className="container relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto"
        >
          <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Mail className="w-7 h-7 text-white" />
          </div>

          <h2 id="newsletter-heading" className="font-display text-4xl md:text-5xl font-medium text-white mb-4">
            Join the Organic Community
          </h2>
          <p className="text-white/70 text-lg mb-8">
            Subscribe for skincare tips, new launches, and exclusive offers.
            <br />
            <span className="text-gold font-medium">Get 10% off your first order.</span>
          </p>

          {status === 'success' ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center justify-center gap-3 text-white"
            >
              <CheckCircle className="w-6 h-6 text-green-400" />
              <p className="text-lg font-body">
                You&apos;re subscribed! Check your inbox for your 10% off code. 🌿
              </p>
            </motion.div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
              id="newsletter-form"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
                className="flex-1 px-5 py-4 bg-white/10 border border-white/20 rounded text-white placeholder-white/50 font-body focus:outline-none focus:border-white/50 focus:bg-white/15 transition-colors"
                id="newsletter-email"
                aria-label="Email address"
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="px-6 py-4 bg-gold text-charcoal font-body font-semibold rounded hover:bg-gold-light transition-colors flex items-center justify-center gap-2 flex-shrink-0"
                id="newsletter-submit"
              >
                {status === 'loading' ? (
                  <div className="w-5 h-5 border-2 border-charcoal/30 border-t-charcoal rounded-full animate-spin" />
                ) : (
                  <>
                    Subscribe
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {status === 'error' && (
            <p className="text-red-300 text-sm mt-3 font-body">
              Something went wrong. Please try again.
            </p>
          )}

          <p className="text-white/40 text-xs mt-4 font-body">
            No spam, ever. Unsubscribe anytime.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
