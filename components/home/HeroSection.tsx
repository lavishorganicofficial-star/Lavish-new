'use client';

import Image from 'next/image';
import { useEffect, useState, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface HeroSlide {
  id: string;
  image_url: string;
  title?: string | null;
  subtitle?: string | null;
  link_url?: string | null;
}

interface Props {
  slides: HeroSlide[];
}

// Fallback hardcoded slides — shown only when DB has no slides yet
const FALLBACK_SLIDES: HeroSlide[] = [
  {
    id: 'f1',
    image_url: 'https://res.cloudinary.com/dtrin6lwv/image/upload/v1780119639/ChatGPT_Image_May_30_2026_11_02_40_AM_injxtk.png',
  },
  {
    id: 'f2',
    image_url: 'https://res.cloudinary.com/dtrin6lwv/image/upload/v1780119638/ChatGPT_Image_May_30_2026_11_10_13_AM_ir6y8j.png',
  },
  {
    id: 'f3',
    image_url: 'https://res.cloudinary.com/dtrin6lwv/image/upload/v1780119639/ChatGPT_Image_May_30_2026_11_01_43_AM_ycvn4f.png',
  },
  {
    id: 'f4',
    image_url: 'https://res.cloudinary.com/dtrin6lwv/image/upload/v1780119639/ChatGPT_Image_May_30_2026_11_01_40_AM_d1lhjw.png',
  },
];

const AUTO_SWAP_INTERVAL = 3000;

export function HeroSection({ slides: dbSlides }: Props) {
  const activeSlides = (dbSlides?.length ? dbSlides : FALLBACK_SLIDES);
  const [current, setCurrent] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = useCallback((index: number) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrent(index);
    setTimeout(() => setIsAnimating(false), 600);
  }, [isAnimating]);

  const goNext = useCallback(() => {
    goTo((current + 1) % activeSlides.length);
  }, [current, goTo, activeSlides.length]);

  const goPrev = useCallback(() => {
    goTo((current - 1 + activeSlides.length) % activeSlides.length);
  }, [current, goTo, activeSlides.length]);

  useEffect(() => {
    timerRef.current = setInterval(goNext, AUTO_SWAP_INTERVAL);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [goNext]);

  const handleManualNav = (fn: () => void) => {
    if (timerRef.current) clearInterval(timerRef.current);
    fn();
    timerRef.current = setInterval(goNext, AUTO_SWAP_INTERVAL);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) handleManualNav(goNext);
      else handleManualNav(goPrev);
    }
    touchStartX.current = null;
  };

  return (
    <section
      className="relative w-full aspect-[16/9] md:aspect-auto md:h-screen md:min-h-[500px] md:max-h-[100vh] overflow-hidden bg-sage-50 select-none"
      aria-label="Hero image carousel"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── Slides ── */}
      {activeSlides.map((slide, i) => (
        <div
          key={slide.id}
          className="absolute inset-0 transition-opacity duration-700 ease-in-out"
          style={{ opacity: i === current ? 1 : 0, zIndex: i === current ? 1 : 0 }}
          aria-hidden={i !== current}
        >
          <Image
            src={slide.image_url}
            alt={slide.title ?? `LavishOrganic Hero ${i + 1}`}
            fill
            priority={i === 0}
            className="object-cover"
            sizes="100vw"
            draggable={false}
          />
          {/* Optional text overlay */}
          {(slide.title || slide.subtitle) && (
            <div className="absolute inset-0 z-10 flex flex-col items-start justify-end pb-20 pl-8 md:pl-16 bg-gradient-to-t from-black/40 via-transparent to-transparent">
              {slide.title && (
                <h2 className="text-white font-display text-3xl md:text-5xl font-bold drop-shadow-md mb-2">
                  {slide.title}
                </h2>
              )}
              {slide.subtitle && (
                <p className="text-white/90 text-base md:text-xl drop-shadow">{slide.subtitle}</p>
              )}
              {slide.link_url && (
                <a
                  href={slide.link_url}
                  className="mt-4 inline-block bg-sage-dark text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-sage-600 transition-colors"
                >
                  Shop Now
                </a>
              )}
            </div>
          )}
        </div>
      ))}

      {/* ── Prev / Next Arrows ── */}
      <button
        onClick={() => handleManualNav(goPrev)}
        className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/30 hover:bg-black/55 backdrop-blur-sm flex items-center justify-center text-white transition-all duration-200 hover:scale-110 active:scale-95"
        aria-label="Previous image"
      >
        <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
      </button>

      <button
        onClick={() => handleManualNav(goNext)}
        className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/30 hover:bg-black/55 backdrop-blur-sm flex items-center justify-center text-white transition-all duration-200 hover:scale-110 active:scale-95"
        aria-label="Next image"
      >
        <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
      </button>

      {/* ── Pagination Dots ── */}
      <div className="absolute bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5" role="tablist" aria-label="Hero slides">
        {activeSlides.map((_, i) => (
          <button
            key={i}
            role="tab"
            aria-selected={i === current}
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => handleManualNav(() => goTo(i))}
            className="transition-all duration-300 rounded-full"
            style={{
              width: i === current ? 28 : 8,
              height: 8,
              backgroundColor: i === current ? '#ACE433' : 'rgba(255,255,255,0.5)',
            }}
          />
        ))}
      </div>

      {/* ── Progress Bar ── */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 z-20 bg-white/10">
        <div
          key={current}
          className="h-full"
          style={{
            animation: `progress ${AUTO_SWAP_INTERVAL}ms linear`,
            backgroundColor: '#ACE433',
          }}
        />
      </div>

      <style jsx>{`
        @keyframes progress {
          from { width: 0%; }
          to   { width: 100%; }
        }
      `}</style>
    </section>
  );
}
