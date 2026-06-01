'use client';

import { useState, useEffect } from 'react';
import { Download, FileText, Loader2, BarChart2 } from 'lucide-react';
import { useToast } from '@/store/uiStore';
import { downloadInventoryExcel } from '@/lib/excel';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { StockReportPDF } from './StockReportPDF';

export function InventoryReportsDashboard() {
  const [summary, setSummary] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const toast = useToast();

  const handleFetchReportData = async () => {
    setLoading(true);
    try {
      const [sumRes, prodRes] = await Promise.all([
        fetch('/api/admin/inventory/summary'),
        fetch('/api/admin/inventory/products')
      ]);
      
      if (!sumRes.ok || !prodRes.ok) throw new Error('Failed to fetch data');
      
      setSummary(await sumRes.json());
      const prodData = await prodRes.json();
      setProducts(prodData.data || []);
      toast.success('Inventory snapshot loaded!');
    } catch (err: any) {
      toast.error('Could not generate inventory data');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadExcel = () => {
    if (products.length === 0) return toast.error('No inventory data to download');
    downloadInventoryExcel(products, `Inventory_Valuation_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-medium text-charcoal">Inventory Reports</h1>
        <p className="text-sm text-charcoal-lighter mt-0.5">Generate current stock valuation and inventory health reports</p>
      </div>

      <div className="card p-6 flex flex-col items-center justify-center text-center space-y-4 py-12">
        <div className="w-16 h-16 rounded-full bg-sage-50 flex items-center justify-center text-sage-dark mb-2">
          <BarChart2 className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-charcoal">Real-time Stock Valuation</h2>
          <p className="text-sm text-charcoal-lighter max-w-md mt-2">
            Generate a snapshot of your current inventory across all products, including low stock warnings and total financial valuation.
          </p>
        </div>
        
        <button 
          onClick={handleFetchReportData} 
          disabled={loading}
          className="btn-primary flex items-center gap-2 mt-4 px-8"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Generate Live Snapshot'}
        </button>
      </div>

      {summary && products.length > 0 && (
        <div className="card p-6 animate-in slide-in-from-bottom-4 fade-in">
          <h2 className="text-sm font-semibold text-charcoal uppercase tracking-wider mb-4">Download Reports</h2>
          <p className="text-sm text-charcoal-lighter mb-6">
            Snapshot loaded for {products.length} products. Total Valuation: <strong className="text-charcoal">{summary.totalValue.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</strong>
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={handleDownloadExcel}
              className="flex-1 btn-secondary flex items-center justify-center gap-2 border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300"
            >
              <Download className="w-4 h-4" /> Download Excel (.xlsx)
            </button>

            <PDFDownloadLink
              document={<StockReportPDF products={products} summary={summary} />}
              fileName={`Inventory_Valuation_${new Date().toISOString().slice(0, 10)}.pdf`}
              className="flex-1 btn-secondary flex items-center justify-center gap-2 border-sage-300 text-sage-800 hover:bg-sage-50 hover:border-sage-400"
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
