import type { Metadata } from 'next';
import { Truck, MapPin, Package } from 'lucide-react';

export const metadata: Metadata = { title: 'Logistics | LavishOrganic Admin' };

export default function AdminLogisticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-medium text-charcoal">Logistics</h1>
        <p className="text-sm text-charcoal-lighter mt-0.5">Manage shipments via Shiprocket</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-6 text-center">
          <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <Package className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="font-medium text-charcoal mb-1">Pending Shipments</h3>
          <p className="text-3xl font-display font-semibold text-charcoal">—</p>
          <p className="text-xs text-charcoal-lighter mt-1">Orders ready to ship</p>
        </div>
        <div className="card p-6 text-center">
          <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <Truck className="w-6 h-6 text-amber-600" />
          </div>
          <h3 className="font-medium text-charcoal mb-1">In Transit</h3>
          <p className="text-3xl font-display font-semibold text-charcoal">—</p>
          <p className="text-xs text-charcoal-lighter mt-1">Shipments on the way</p>
        </div>
        <div className="card p-6 text-center">
          <div className="w-12 h-12 bg-sage-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <MapPin className="w-6 h-6 text-sage-dark" />
          </div>
          <h3 className="font-medium text-charcoal mb-1">Delivered Today</h3>
          <p className="text-3xl font-display font-semibold text-charcoal">—</p>
          <p className="text-xs text-charcoal-lighter mt-1">Successful deliveries</p>
        </div>
      </div>

      <div className="card p-8 text-center">
        <Truck className="w-12 h-12 text-sage-light mx-auto mb-4" />
        <h3 className="font-medium text-charcoal mb-2">Shiprocket Integration</h3>
        <p className="text-sm text-charcoal-lighter mb-4 max-w-md mx-auto">
          Connect your Shiprocket account to automatically create shipments, print labels, and track deliveries.
          Add your credentials to <code className="text-xs bg-sage-50 px-1.5 py-0.5 rounded">.env.local</code>.
        </p>
        <div className="inline-flex items-center gap-2 text-sm text-charcoal-lighter bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
          <span>⚠️</span>
          <span>Add <strong>SHIPROCKET_EMAIL</strong> and <strong>SHIPROCKET_PASSWORD</strong> to enable</span>
        </div>
      </div>
    </div>
  );
}
