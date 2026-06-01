'use client';

import { useEffect, useRef } from 'react';
import { Zap } from 'lucide-react';

const MESSAGES = [
  '🌿 Free shipping on orders above ₹499',
  '✨ 100% Organic & Cruelty-Free',
  '🇮🇳 Proudly Made in India',
  '🎁 Use code WELCOME10 for 10% off your first order',
  '⭐ Dermatologist Tested & Approved',
  '🌱 New arrivals every month — Follow us @lavishorganic',
];

export function AnnouncementBar() {
  return (
    <div
      className="bg-sage-dark text-white text-xs font-body font-medium overflow-hidden"
      style={{ height: '36px' }}
      aria-label="Announcements"
    >
      <div className="flex items-center h-full">
        {/* Marquee: duplicate messages for seamless loop */}
        <div className="flex items-center gap-0 animate-marquee whitespace-nowrap will-change-transform">
          {[...MESSAGES, ...MESSAGES].map((msg, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-2 px-8"
            >
              {msg}
              <span className="inline-block w-1 h-1 bg-sage-light rounded-full mx-2 opacity-60" />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
