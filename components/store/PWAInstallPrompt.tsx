'use client';

import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Register Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.error('Service Worker registration failed:', err);
      });
    }

    // Handle install prompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Wait a bit before showing to not overwhelm the user immediately
      setTimeout(() => {
        // Only show if they haven't dismissed it recently
        const dismissed = sessionStorage.getItem('pwa_dismissed');
        if (!dismissed) {
          setShowPrompt(true);
        }
      }, 5000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // If already installed
    window.addEventListener('appinstalled', () => {
      setShowPrompt(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the browser install prompt
    deferredPrompt.prompt();
    
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem('pwa_dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-4 left-4 right-4 md:left-auto md:w-96 bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-sage-light/30 p-4 z-50 flex items-center gap-4"
      >
        <div className="w-12 h-12 bg-sage-50 rounded-lg flex items-center justify-center flex-shrink-0 text-sage-dark">
          <Download className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-charcoal font-body text-sm truncate">Install LavishOrganic App</h3>
          <p className="text-xs text-charcoal-lighter font-body mt-0.5">For a faster, native experience</p>
        </div>
        <div className="flex flex-col gap-2 flex-shrink-0">
          <button 
            onClick={handleInstallClick}
            className="text-xs bg-sage-dark text-white px-4 py-1.5 rounded-full font-medium hover:bg-sage-600 transition-colors"
          >
            Install
          </button>
        </div>
        <button 
          onClick={handleDismiss}
          className="absolute -top-2 -right-2 w-6 h-6 bg-white border border-sage-light/30 rounded-full flex items-center justify-center text-charcoal-lighter hover:text-charcoal shadow-sm"
          aria-label="Dismiss"
        >
          <X className="w-3 h-3" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
