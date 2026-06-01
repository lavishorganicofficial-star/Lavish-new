'use client';

import { useState, useEffect } from 'react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Search, Filter, Download, ArrowUpRight, ArrowDownRight, Clock, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';
import { TransactionSlideOver } from './TransactionSlideOver';
import { MobileCard } from '@/components/admin/MobileCard';
import { useToast } from '@/store/uiStore';

const TYPE_BADGES: Record<string, string> = {
  cod_pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  cod_collected: 'bg-green-100 text-green-800 border-green-200',
  cod_failed: 'bg-red-100 text-red-800 border-red-200',
  refund_issued: 'bg-blue-100 text-blue-800 border-blue-200',
  refund_pending: 'bg-orange-100 text-orange-800 border-orange-200',
  adjustment: 'bg-gray-100 text-gray-800 border-gray-200'
};

export function PaymentDashboard() {
  const [summary, setSummary] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [q, setQ] = useState('');
  const [type, setType] = useState('all');
  const [dateRange, setDateRange] = useState('this_month');
  const [selectedTxn, setSelectedTxn] = useState<any>(null);
  
  const toast = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      // Build query string
      const qs = new URLSearchParams();
      if (q) qs.set('q', q);
      if (type !== 'all') qs.set('type', type);
      
      const now = new Date();
      let fromDate: Date | null = null;
      let toDate: Date | null = null;

      if (dateRange === 'today') {
        fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (dateRange === 'yesterday') {
        fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        toDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      } else if (dateRange === 'last_7') {
        fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
      } else if (dateRange === 'this_month') {
        fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      if (fromDate) qs.set('from', fromDate.toISOString());
      if (toDate) qs.set('to', toDate.toISOString());
      
      const [sumRes, txnRes] = await Promise.all([
        fetch(`/api/admin/payments/summary?${qs.toString()}`),
        fetch(`/api/admin/payments?${qs.toString()}`)
      ]);
      
      if (!sumRes.ok || !txnRes.ok) throw new Error('Failed to fetch data');
      
      setSummary(await sumRes.json());
      const txnData = await txnRes.json();
      setTransactions(txnData.data || []);
    } catch (err: any) {
      toast.error('Could not load payment data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [q, type, dateRange]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-medium text-charcoal">Payment & Transactions</h1>
          <p className="text-sm text-charcoal-lighter mt-0.5">Track every rupee in your store</p>
        </div>
        <div className="flex gap-2">
          <select 
            className="input text-sm py-1.5" 
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="last_7">Last 7 Days</option>
            <option value="this_month">This Month</option>
            <option value="all_time">All Time</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard title="Total Revenue" amount={summary?.totalRevenue} icon={<ArrowUpRight className="w-4 h-4 text-green-600" />} />
        <KpiCard title="Collected (COD)" amount={summary?.collected?.amount} sub={`${summary?.collected?.count} orders`} icon={<CheckCircle2 className="w-4 h-4 text-green-600" />} />
        <KpiCard title="Pending (COD)" amount={summary?.pending?.amount} sub={`${summary?.pending?.count} orders`} icon={<Clock className="w-4 h-4 text-yellow-600" />} />
        <KpiCard title="Failed/Refused" amount={summary?.failed?.amount} sub={`${summary?.failed?.count} orders`} icon={<XCircle className="w-4 h-4 text-red-600" />} />
        <KpiCard title="Refunds Issued" amount={summary?.refundsIssued?.amount} sub={`${summary?.refundsIssued?.count} refunds`} icon={<RotateCcw className="w-4 h-4 text-blue-600" />} />
        <KpiCard title="Refunds Pending" amount={summary?.refundsPending?.amount} sub={`${summary?.refundsPending?.count} refunds`} icon={<Clock className="w-4 h-4 text-orange-600" />} />
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-lighter" />
          <input 
            type="text" 
            placeholder="Search order #, customer..." 
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="input pl-9 w-full" 
          />
        </div>
        <select value={type} onChange={(e) => setType(e.target.value)} className="input sm:w-48">
          <option value="all">All Types</option>
          <option value="cod_pending">COD Pending</option>
          <option value="cod_collected">COD Collected</option>
          <option value="refund_pending">Refund Pending</option>
        </select>
        <button className="btn-secondary flex items-center gap-2 px-4 whitespace-nowrap">
          <Download className="w-4 h-4" /> Export
        </button>
      </div>

      {/* Table & Mobile Cards */}
      <div className="card overflow-hidden">
        {/* Mobile View */}
        <div className="p-4 sm:hidden bg-gray-50/50 border-b border-gray-100">
          <p className="text-xs text-charcoal-lighter font-medium mb-2 uppercase tracking-wider">Transactions List</p>
          {loading ? (
            <div className="text-center py-8 text-charcoal-lighter">Loading transactions...</div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-charcoal-lighter">No transactions found.</div>
          ) : (
            transactions.map((txn) => (
              <div key={txn.id} onClick={() => setSelectedTxn(txn)} className="cursor-pointer">
                <MobileCard
                  title={<span className="font-mono text-sage-dark">{txn.order_number}</span>}
                  subtitle={`${txn.customer_name || '—'} • ${txn.customer_phone}`}
                  status={
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider border ${TYPE_BADGES[txn.type] || 'bg-gray-100 text-gray-800'}`}>
                      {txn.type.replace(/_/g, ' ')}
                    </span>
                  }
                  details={[
                    { label: 'Date', value: formatDate(txn.created_at) },
                    { label: 'TXN Number', value: <span className="font-mono text-xs">{txn.transaction_number}</span> },
                    { label: 'Amount', value: <span className={`font-bold ${txn.amount < 0 ? 'text-red-600' : 'text-sage-dark'}`}>{txn.amount > 0 ? '+' : ''}{formatCurrency(txn.amount)}</span> }
                  ]}
                />
              </div>
            ))
          )}
        </div>

        {/* Desktop View */}
        <div className="overflow-x-auto hidden sm:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-sage-50/50 border-b border-sage-light/20">
                <th className="text-left p-4 font-semibold text-charcoal-lighter uppercase tracking-wider text-xs">TXN Number</th>
                <th className="text-left p-4 font-semibold text-charcoal-lighter uppercase tracking-wider text-xs">Date</th>
                <th className="text-left p-4 font-semibold text-charcoal-lighter uppercase tracking-wider text-xs">Order #</th>
                <th className="text-left p-4 font-semibold text-charcoal-lighter uppercase tracking-wider text-xs">Customer</th>
                <th className="text-left p-4 font-semibold text-charcoal-lighter uppercase tracking-wider text-xs">Type</th>
                <th className="text-right p-4 font-semibold text-charcoal-lighter uppercase tracking-wider text-xs">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sage-light/10">
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-charcoal-lighter">Loading transactions...</td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-charcoal-lighter">No transactions found for this period.</td></tr>
              ) : (
                transactions.map((txn) => (
                  <tr 
                    key={txn.id} 
                    onClick={() => setSelectedTxn(txn)}
                    className="hover:bg-sage-50/30 transition-colors cursor-pointer"
                  >
                    <td className="p-4 font-mono font-medium text-charcoal">{txn.transaction_number}</td>
                    <td className="p-4 text-charcoal-lighter">{formatDate(txn.created_at)}</td>
                    <td className="p-4 font-mono text-sage-dark">{txn.order_number}</td>
                    <td className="p-4">
                      <p className="font-medium text-charcoal">{txn.customer_name || '—'}</p>
                      <p className="text-xs text-charcoal-lighter">{txn.customer_phone}</p>
                    </td>
                    <td className="p-4">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider border ${TYPE_BADGES[txn.type] || 'bg-gray-100 text-gray-800'}`}>
                        {txn.type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className={`p-4 text-right font-bold ${txn.amount < 0 ? 'text-red-600' : 'text-sage-dark'}`}>
                      {txn.amount > 0 ? '+' : ''}{formatCurrency(txn.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedTxn && (
        <TransactionSlideOver 
          transaction={selectedTxn} 
          onClose={() => setSelectedTxn(null)} 
          onRefresh={fetchData} 
        />
      )}
    </div>
  );
}

function KpiCard({ title, amount, sub, icon }: { title: string, amount?: number, sub?: string, icon?: React.ReactNode }) {
  return (
    <div className="card p-4 border-t-4 border-t-sage-dark">
      <div className="flex justify-between items-start mb-2">
        <p className="text-xs font-semibold text-charcoal-lighter uppercase tracking-wider">{title}</p>
        {icon}
      </div>
      <p className="font-display text-xl font-medium text-charcoal">{amount !== undefined ? formatCurrency(Math.abs(amount)) : '₹0'}</p>
      {sub && <p className="text-xs text-charcoal-lighter mt-1">{sub}</p>}
    </div>
  );
}
