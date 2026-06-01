'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Zap, ArrowRight, Clock } from 'lucide-react';
import type { Offer } from '@/types';

interface FlashSaleProps {
  offer: Offer;
}

function useCountdown(endDate: string | null) {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0, expired: false });

  useEffect(() => {
    if (!endDate) return;

    const calculate = () => {
      const diff = new Date(endDate).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, expired: true });
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ hours, minutes, seconds, expired: false });
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [endDate]);

  return timeLeft;
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-16 h-16 bg-charcoal rounded-lg flex items-center justify-center shadow-warm-md">
        <span className="font-display text-3xl font-semibold text-white tabular-nums">
          {String(value).padStart(2, '0')}
        </span>
      </div>
      <span className="text-xs font-body font-medium text-white/60 uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
}

export function FlashSale({ offer }: FlashSaleProps) {
  const { hours, minutes, seconds, expired } = useCountdown(offer.ends_at);

  if (expired) return null;

  return (
    <section
      className="section relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #2C2C2C 0%, #4A6741 100%)' }}
      aria-labelledby="flash-sale-heading"
    >
      {/* Decorative circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-sage/10" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-gold/10" />
      </div>

      <div className="container relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gold/20 rounded-full text-gold text-xs font-body font-semibold uppercase tracking-wider mb-6">
              <Zap className="w-3.5 h-3.5 fill-current" />
              Flash Sale
            </div>

            <h2 id="flash-sale-heading" className="font-display text-4xl md:text-5xl font-medium text-white leading-tight mb-4">
              {offer.title}
            </h2>

            {offer.description && (
              <p className="text-white/70 text-lg mb-8">
                {offer.description}
              </p>
            )}

            {/* Discount badge */}
            {offer.discount_percentage && (
              <div className="inline-flex items-center gap-2 mb-8">
                <span className="text-5xl font-display font-semibold text-gold">
                  {offer.discount_percentage}%
                </span>
                <div className="text-white/70">
                  <div className="text-sm font-body">Off on</div>
                  <div className="text-sm font-body font-medium">selected products</div>
                </div>
              </div>
            )}

            {/* Countdown */}
            <div className="mb-10">
              <div className="flex items-center gap-2 text-white/60 text-sm font-body mb-4">
                <Clock className="w-4 h-4" />
                Offer ends in:
              </div>
              <div className="flex items-end gap-3">
                <CountdownUnit value={hours} label="Hours" />
                <span className="text-3xl font-display text-white/40 mb-5">:</span>
                <CountdownUnit value={minutes} label="Mins" />
                <span className="text-3xl font-display text-white/40 mb-5">:</span>
                <CountdownUnit value={seconds} label="Secs" />
              </div>
            </div>

            <Link
              href={offer.link_url ?? '/shop?sort=discount'}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gold text-charcoal font-body font-semibold rounded hover:bg-gold-light transition-colors shadow-gold-glow"
              id="flash-sale-cta"
            >
              Shop the Sale
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          {/* Right: Image */}
          {offer.image_url && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative h-80 lg:h-[420px] rounded-2xl overflow-hidden"
            >
              <Image
                src={offer.image_url}
                alt={offer.title}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-charcoal/30 to-transparent" />
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
