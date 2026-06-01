'use client';

import { useState, useEffect } from 'react';
import { X, Check, Truck, Loader2, Download } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useToast } from '@/store/uiStore';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { PurchaseOrderPDF } from './PurchaseOrderPDF';

export function POSlideOver({ poId, onClose, onRefresh }: { poId: string, onClose: () => void, onRefresh: () => void }) {
  const [po, setPo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [receiveMode, setReceiveMode] = useState(false);
  const [receiveInputs, setReceiveInputs] = useState<Record<string, number>>({});
  const [isReceiving, setIsReceiving] = useState(false);
  
  const toast = useToast();

  const fetchPO = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/inventory/purchase-orders/${poId}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPo(data);
    } catch (err) {
      toast.error('Failed to load PO details');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPO();
  }, [poId]);

  const handleReceiveStock = async () => {
    const itemsToReceive = po.items
      .map((i: any) => ({
        itemId: i.id,
        productId: i.product_id,
        quantityReceived: receiveInputs[i.id] || 0
      }))
      .filter((i: any) => i.quantityReceived > 0);

    if (itemsToReceive.length === 0) {
      toast.error('Enter received quantities');
      return;
    }

    setIsReceiving(true);
    try {
      const res = await fetch(`/api/admin/inventory/purchase-orders/${poId}/receive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemsToReceive })
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success('Stock received and updated successfully!');
      
      setReceiveMode(false);
      setReceiveInputs({});
      fetchPO();
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to receive stock');
    } finally {
      setIsReceiving(false);
    }
  };

  if (loading || !po) {
    return (
      <>
        <div className="fixed inset-0 bg-black/40 z-[100]" onClick={onClose} />
        <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-[110] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-sage-dark" />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-[100]" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full max-w-xl bg-white shadow-2xl z-[110] flex flex-col overflow-y-auto transform transition-transform duration-300">
        
        <div className="p-5 border-b border-sage-light/20 flex items-center justify-between bg-warm-white sticky top-0 z-10">
          <div>
            <h2 className="font-mono text-lg font-bold text-charcoal">{po.po_number}</h2>
            <p className="text-xs text-charcoal-lighter uppercase tracking-wide mt-1">Purchase Order</p>
          </div>
          <button onClick={onClose} className="btn-icon p-2 bg-white rounded-full"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-6 flex-1">
          {/* Status Bar */}
          <div className="flex gap-4">
            <div className={`flex-1 p-3 rounded-lg border ${
              po.status === 'received' ? 'bg-green-50 border-green-200' :
              po.status === 'partial' ? 'bg-orange-50 border-orange-200' :
              'bg-blue-50 border-blue-200'
            }`}>
              <p className="text-xs text-charcoal-lighter uppercase tracking-wider mb-1">Status</p>
              <p className="font-bold text-charcoal capitalize">{po.status}</p>
            </div>
            <div className="flex-[2] p-3 rounded-lg border border-sage-light/30 bg-sage-50/50">
              <p className="text-xs text-charcoal-lighter uppercase tracking-wider mb-1">Supplier</p>
              <p className="font-medium text-charcoal">{po.supplier_name}</p>
              <p className="text-xs text-charcoal-lighter mt-0.5">{po.supplier_email || po.supplier_phone}</p>
            </div>
          </div>

          {/* Line Items */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold text-charcoal uppercase tracking-wider">Line Items</h3>
              {po.status !== 'received' && !receiveMode && (
                <button onClick={() => setReceiveMode(true)} className="text-xs text-sage-dark font-semibold uppercase tracking-wider flex items-center gap-1 hover:underline">
                  <Truck className="w-3 h-3" /> Receive Stock
                </button>
              )}
            </div>
            
            <div className="card-flat overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-sage-50/50 border-b border-sage-light/20">
                    <th className="p-3 text-left text-xs font-semibold text-charcoal-lighter uppercase">Product</th>
                    <th className="p-3 text-center text-xs font-semibold text-charcoal-lighter uppercase">Ordered</th>
                    <th className="p-3 text-center text-xs font-semibold text-charcoal-lighter uppercase">Received</th>
                    {receiveMode && <th className="p-3 text-center text-xs font-semibold text-blue-600 uppercase bg-blue-50">Receive Now</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-sage-light/10">
                  {po.items?.map((item: any) => {
                    const remaining = item.quantity_ordered - item.quantity_received;
                    return (
                      <tr key={item.id} className={remaining === 0 ? 'bg-green-50/30' : ''}>
                        <td className="p-3 font-medium text-charcoal">{item.product_name}</td>
                        <td className="p-3 text-center">{item.quantity_ordered}</td>
                        <td className="p-3 text-center font-bold text-green-700">{item.quantity_received}</td>
                        {receiveMode && (
                          <td className="p-2 bg-blue-50/30">
                            {remaining > 0 ? (
                              <input 
                                type="number" 
                                min="0" 
                                max={remaining}
                                value={receiveInputs[item.id] !== undefined ? receiveInputs[item.id] : ''}
                                onChange={e => setReceiveInputs({...receiveInputs, [item.id]: parseInt(e.target.value) || 0})}
                                placeholder={`Max: ${remaining}`}
                                className="input w-full p-1 text-center font-bold"
                              />
                            ) : (
                              <span className="text-xs text-green-700 font-bold block text-center">Complete</span>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="card-flat p-4 flex justify-between items-center text-sm">
            <span className="text-charcoal-lighter uppercase tracking-wider font-semibold text-xs">Total Cost</span>
            <span className="font-bold text-lg text-sage-dark">{formatCurrency(po.total_cost)}</span>
          </div>

          {po.notes && (
            <div>
              <h3 className="text-xs font-semibold text-charcoal-lighter uppercase tracking-wider mb-2">Notes</h3>
              <p className="text-sm text-charcoal p-3 bg-warm-white border border-sage-light/20 rounded-lg">{po.notes}</p>
            </div>
          )}

        </div>

        {/* Actions Sticky Footer */}
        <div className="p-5 border-t border-sage-light/20 bg-warm-white space-y-3">
          {receiveMode ? (
            <div className="flex gap-3">
              <button onClick={() => { setReceiveMode(false); setReceiveInputs({}); }} className="btn-secondary flex-1 border-sage-300 text-charcoal hover:bg-sage-100">Cancel</button>
              <button onClick={handleReceiveStock} disabled={isReceiving} className="btn-primary flex-1 flex justify-center items-center gap-2 bg-sage-dark hover:bg-sage-darker">
                {isReceiving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Confirm Receipt
              </button>
            </div>
          ) : (
            <PDFDownloadLink
              document={<PurchaseOrderPDF po={po} />}
              fileName={`${po.po_number}.pdf`}
              className="w-full btn-secondary flex items-center justify-center gap-2 border-sage-300 hover:bg-sage-50"
            >
              {({ loading }) => loading 
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating PDF...</> 
                : <><Download className="w-4 h-4" /> Download PO PDF</>
              }
            </PDFDownloadLink>
          )}
        </div>
      </div>
    </>
  );
}
