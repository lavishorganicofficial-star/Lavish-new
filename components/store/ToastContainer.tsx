'use client';

import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useUIStore } from '@/store/uiStore';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Toast } from '@/types';

const ICONS = {
  success: <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />,
  error: <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />,
  info: <Info className="w-5 h-5 text-sage flex-shrink-0" />,
  warning: <AlertTriangle className="w-5 h-5 text-gold-dark flex-shrink-0" />,
};

function ToastItem({ toast }: { toast: Toast }) {
  const removeToast = useUIStore((s) => s.removeToast);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 50, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50, scale: 0.95 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className={cn(
        'toast',
        toast.type === 'success' && 'toast-success',
        toast.type === 'error' && 'toast-error',
        toast.type === 'info' && 'toast-info',
        toast.type === 'warning' && 'toast-warning'
      )}
      role="alert"
      aria-live="polite"
    >
      {ICONS[toast.type]}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-charcoal">{toast.title}</p>
        {toast.message && (
          <p className="text-xs text-charcoal-lighter mt-0.5">{toast.message}</p>
        )}
      </div>
      <button
        onClick={() => removeToast(toast.id)}
        className="flex-shrink-0 text-charcoal-lighter hover:text-charcoal transition-colors ml-2"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

export function ToastContainer() {
  const toasts = useUIStore((s) => s.toasts);

  return (
    <div className="toast-container" aria-label="Notifications" aria-live="polite">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </AnimatePresence>
    </div>
  );
}
