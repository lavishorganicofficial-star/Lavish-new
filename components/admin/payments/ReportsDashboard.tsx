'use client';

import { useState, useEffect } from 'react';
import { Download, FileText, Loader2, Calendar } from 'lucide-react';
import { useToast } from '@/store/uiStore';
import { downloadPaymentExcel } from '@/lib/excel';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { PaymentReportPDF } from './PaymentReportPDF';

export function ReportsDashboard() {
  const [period, setPeriod] = useState('this_month');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  
  const [summary, setSummary] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const toast = useToast();

  const handleFetchReportData = async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      
      if (period === 'custom') {
        if (from) qs.set('from', from);
        if (to) qs.set('to', to);
      } else {
        // Simple predefined periods
        const now = new Date();
        if (period === 'this_month') {
          qs.set('from', new Date(now.getFullYear(), now.getMonth(), 1).toISOString());
        } else if (period === 'last_month') {
          qs.set('from', new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString());
          qs.set('to', new Date(now.getFullYear(), now.getMonth(), 0).toISOString()); // Last day of last month
        }
      }

      // We need essentially infinite limit for accurate reports, but we'll cap at 10,000 for safety
      qs.set('limit', '10000');

      const [sumRes, txnRes] = await Promise.all([
        fetch(`/api/admin/payments/summary?${qs.toString()}`),
        fetch(`/api/admin/payments?${qs.toString()}`)
      ]);
      
      if (!sumRes.ok || !txnRes.ok) throw new Error('Failed to fetch data');
      
      setSummary(await sumRes.json());
      const txnData = await txnRes.json();
      setTransactions(txnData.data || []);
      toast.success('Report data loaded!');
    } catch (err: any) {
      toast.error('Could not generate report data');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadExcel = () => {
    if (transactions.length === 0) {
      toast.error('No transactions to download');
      return;
    }
    downloadPaymentExcel(transactions, `Payments_Report_${period}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-medium text-charcoal">Payment Reports</h1>
        <p className="text-sm text-charcoal-lighter mt-0.5">Generate and download financial reports (PDF/Excel)</p>
      </div>

      {/* Report Configuration */}
      <div className="card p-6 space-y-4">
        <h2 className="text-sm font-semibold text-charcoal uppercase tracking-wider mb-2">Configure Report</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-charcoal-lighter mb-1">Time Period</label>
            <select value={period} onChange={(e) => setPeriod(e.target.value)} className="input w-full">
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="this_year">This Year</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>
          
          {period === 'custom' && (
            <>
              <div>
                <label className="block text-xs font-medium text-charcoal-lighter mb-1">Start Date</label>
                <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="input w-full" />
              </div>
              <div>
                <label className="block text-xs font-medium text-charcoal-lighter mb-1">End Date</label>
                <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="input w-full" />
              </div>
            </>
          )}
        </div>

        <div className="pt-2">
          <button 
            onClick={handleFetchReportData} 
            disabled={loading}
            className="btn-primary flex items-center gap-2 px-6"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
            Generate Report Data
          </button>
        </div>
      </div>

      {/* Report Downloads */}
      {summary && transactions.length > 0 && (
        <div className="card p-6">
          <h2 className="text-sm font-semibold text-charcoal uppercase tracking-wider mb-4">Download Reports</h2>
          <p className="text-sm text-charcoal-lighter mb-6">
            Data loaded for {transactions.length} transactions.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Excel Download Button */}
            <button 
              onClick={handleDownloadExcel}
              className="flex-1 btn-secondary flex items-center justify-center gap-2 border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300"
            >
              <Download className="w-4 h-4" /> Download Excel (.xlsx)
            </button>

            {/* PDF Download Button using React-PDF */}
            <PDFDownloadLink
              document={
                <PaymentReportPDF 
                  transactions={transactions} 
                  summary={summary} 
                  dateRange={period === 'custom' ? `${from} to ${to}` : period} 
                />
              }
              fileName={`Payments_Report_${period}.pdf`}
              className="flex-1 btn-secondary flex items-center justify-center gap-2 border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300"
            >
              {({ loading }) => loading 
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Preparing PDF...</> 
                : <><FileText className="w-4 h-4" /> Download PDF Report</>
              }
            </PDFDownloadLink>
          </div>
        </div>
      )}
    </div>
  );
}
