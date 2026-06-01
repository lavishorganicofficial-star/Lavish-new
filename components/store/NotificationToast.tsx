'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { useRouter } from 'next/navigation';

export function NotificationToast() {
  const toasts = useUIStore((state) => state.notificationToasts);
  const removeToast = useUIStore((state) => state.removeNotificationToast);
  const router = useRouter();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
            className="pointer-events-auto w-[320px] bg-white rounded-lg shadow-lg border border-sage-light/30 overflow-hidden flex flex-col"
          >
            {/* Header / Dismiss */}
            <div className="flex items-start justify-between p-3 pb-1">
              <div className="flex items-center gap-2">
                <span className="text-xl">{toast.icon || 'ℹ️'}</span>
                <h4 className="font-semibold text-charcoal text-sm">{toast.title}</h4>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-charcoal-lighter hover:text-charcoal p-1 transition-colors"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Body */}
            <div 
              className="px-3 pb-3 cursor-pointer group"
              onClick={() => {
                removeToast(toast.id);
                if (toast.action_url) router.push(toast.action_url);
              }}
            >
              <p className="text-charcoal-light text-sm line-clamp-2 leading-relaxed">
                {toast.message}
              </p>
              {toast.action_url && (
                <span className="text-sage-dark text-xs font-semibold mt-2 inline-block group-hover:underline">
                  View Details →
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
