'use client';

import { useState } from 'react';
import { X, Check, XCircle, RefreshCcw, FileText, Smartphone, ExternalLink, Loader2 } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useToast } from '@/store/uiStore';
import Link from 'next/link';

interface SlideOverProps {
  transaction: any;
  onClose: () => void;
  onRefresh: () => void;
}

export function TransactionSlideOver({ transaction, onClose, onRefresh }: SlideOverProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const toast = useToast();

  const handleMarkCollected = async () => {
    if (!confirm('Are you sure you want to mark this COD as collected?')) return;
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/admin/payments/${transaction.id}/mark-collected`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collectedBy: 'Admin' })
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success('Transaction marked as collected!');
      onRefresh();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update transaction');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMarkFailed = async () => {
    if (!confirm('Are you sure you want to mark this transaction as failed?')) return;
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/admin/payments/${transaction.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'failed', notes: 'Manually marked as failed' })
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success('Transaction marked as failed!');
      onRefresh();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update transaction');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-[100]" onClick={onClose} />

      {/* Slide Over */}
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-[110] flex flex-col overflow-y-auto transform transition-transform duration-300">
        <div className="p-5 border-b border-sage-light/20 flex items-center justify-between bg-warm-white sticky top-0 z-10">
          <div>
            <h2 className="font-mono text-lg font-bold text-charcoal">{transaction.transaction_number}</h2>
            <p className="text-xs text-charcoal-lighter uppercase tracking-wide mt-1">Transaction Details</p>
          </div>
          <button onClick={onClose} className="btn-icon p-2 bg-white rounded-full"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-8 flex-1">
          {/* Status Bar */}
          <div className="flex gap-4">
            <div className="flex-1 p-3 rounded-lg border border-sage-light/30 bg-sage-50/30">
              <p className="text-xs text-charcoal-lighter uppercase tracking-wider mb-1">Type</p>
              <p className="font-medium text-charcoal capitalize">{transaction.type.replace(/_/g, ' ')}</p>
            </div>
            <div className="flex-1 p-3 rounded-lg border border-sage-light/30 bg-sage-50/30">
              <p className="text-xs text-charcoal-lighter uppercase tracking-wider mb-1">Status</p>
              <p className="font-medium text-charcoal capitalize">{transaction.status}</p>
            </div>
          </div>

          {/* Order Info */}
          <div>
            <h3 className="text-sm font-semibold text-charcoal uppercase tracking-wider mb-3">Order Information</h3>
            <div className="card-flat p-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-charcoal-lighter">Order:</span>
                <Link href={`/admin/orders/${transaction.order_id}`} className="font-mono text-sage-dark hover:underline inline-flex items-center gap-1">
                  {transaction.order_number} <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
              <div className="flex justify-between">
                <span className="text-charcoal-lighter">Placed:</span>
                <span className="font-medium text-charcoal">{formatDate(transaction.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div>
            <h3 className="text-sm font-semibold text-charcoal uppercase tracking-wider mb-3">Customer</h3>
            <div className="card-flat p-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-charcoal-lighter">Name:</span>
                <span className="font-medium text-charcoal">{transaction.customer_name || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-charcoal-lighter">Phone:</span>
                <span className="font-medium text-charcoal">{transaction.customer_phone || '—'}</span>
              </div>
            </div>
          </div>

          {/* Amount Info */}
          <div>
            <h3 className="text-sm font-semibold text-charcoal uppercase tracking-wider mb-3">Amount Breakdown</h3>
            <div className="card-flat p-4 space-y-2 text-sm">
              <div className="flex justify-between text-charcoal-lighter">
                <span>Subtotal:</span>
                <span>{formatCurrency(transaction.subtotal || transaction.amount)}</span>
              </div>
              <div className="flex justify-between text-charcoal-lighter">
                <span>Discount:</span>
                <span>-{formatCurrency(transaction.discount_amount || 0)}</span>
              </div>
              <div className="flex justify-between text-charcoal-lighter">
                <span>Shipping:</span>
                <span>{transaction.shipping_amount > 0 ? formatCurrency(transaction.shipping_amount) : 'FREE'}</span>
              </div>
              <div className="pt-2 mt-2 border-t border-sage-light/20 flex justify-between font-bold text-lg text-charcoal">
                <span>TOTAL:</span>
                <span className={transaction.amount < 0 ? 'text-red-600' : 'text-sage-dark'}>{formatCurrency(Math.abs(transaction.amount))}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions Sticky Footer */}
        <div className="p-5 border-t border-sage-light/20 bg-warm-white space-y-3">
          {transaction.type === 'cod_pending' && (
            <>
              <button 
                onClick={handleMarkCollected} 
                disabled={isUpdating}
                className="w-full btn-primary flex items-center justify-center gap-2 bg-sage-dark hover:bg-sage-darker"
              >
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Mark as Collected
              </button>
              <button 
                onClick={handleMarkFailed} 
                disabled={isUpdating}
                className="w-full btn-secondary flex items-center justify-center gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
              >
                <XCircle className="w-4 h-4" />
                Mark as Failed / Refused
              </button>
            </>
          )}

          {transaction.status === 'completed' && transaction.amount > 0 && (
            <button 
              onClick={() => setShowRefundModal(true)}
              disabled={isUpdating}
              className="w-full btn-secondary flex items-center justify-center gap-2"
            >
              <RefreshCcw className="w-4 h-4" /> Issue Refund
            </button>
          )}

          <div className="flex gap-2">
            <button className="flex-1 btn-secondary flex items-center justify-center gap-2">
              <FileText className="w-4 h-4" /> Receipt
            </button>
            <a 
              href={`https://wa.me/91${transaction.customer_phone}?text=Hello ${transaction.customer_name}, regarding your order ${transaction.order_number}...`}
              target="_blank" 
              rel="noreferrer"
              className="flex-1 btn-secondary flex items-center justify-center gap-2 text-green-600 border-green-200 hover:bg-green-50 hover:border-green-300"
            >
              <Smartphone className="w-4 h-4" /> WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* Simple Refund Modal */}
      {showRefundModal && (
        <RefundModal 
          transaction={transaction} 
          onClose={() => setShowRefundModal(false)}
          onSuccess={() => {
            setShowRefundModal(false);
            onRefresh();
            onClose();
          }}
        />
      )}
    </>
  );
}

function RefundModal({ transaction, onClose, onSuccess }: { transaction: any, onClose: () => void, onSuccess: () => void }) {
  const [amount, setAmount] = useState(transaction.amount);
  const [reason, setReason] = useState('Customer Request');
  const [method, setMethod] = useState('upi');
  const [upiId, setUpiId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/payments/${transaction.id}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, reason, method, upiId })
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success('Refund initiated successfully!');
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Failed to issue refund');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[120] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="p-5 border-b border-sage-light/20 flex justify-between items-center bg-warm-white">
          <h3 className="font-display font-medium text-lg text-charcoal">Issue Refund</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-charcoal-lighter" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Refund Amount (₹)</label>
            <input type="number" required max={transaction.amount} value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="input w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Reason</label>
            <select value={reason} onChange={(e) => setReason(e.target.value)} className="input w-full">
              <option>Customer Request</option>
              <option>Wrong Product</option>
              <option>Damaged in Transit</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Refund Method</label>
            <select value={method} onChange={(e) => setMethod(e.target.value)} className="input w-full">
              <option value="upi">UPI</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="store_credit">Store Credit</option>
            </select>
          </div>
          {method === 'upi' && (
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">Customer UPI ID</label>
              <input type="text" required value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="username@upi" className="input w-full" />
            </div>
          )}
          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary flex-1 flex justify-center items-center gap-2">
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />} Confirm Refund
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
