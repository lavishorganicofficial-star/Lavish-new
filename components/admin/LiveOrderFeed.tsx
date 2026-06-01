'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { BellRing, Package, Clock, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

export function LiveOrderFeed({ initialOrders = [] }: { initialOrders?: any[] }) {
  const [feed, setFeed] = useState<any[]>(initialOrders);
  const supabase = createClient();

  useEffect(() => {
    // We subscribe to inserts on the orders table
    const channel = supabase.channel('realtime_orders')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
        setFeed((prev) => [payload.new, ...prev].slice(0, 10)); // Keep last 10
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, (payload) => {
        setFeed((prev) => prev.map(order => order.id === payload.new.id ? payload.new : order));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  return (
    <div className="card p-0 flex flex-col h-full border border-sage-light/20">
      <div className="p-4 border-b border-sage-light/20 bg-sage-50/30 flex justify-between items-center">
        <h3 className="font-medium text-charcoal flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
          </span>
          Live Feed
        </h3>
        <BellRing className="w-4 h-4 text-charcoal-lighter" />
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-2 max-h-[400px]">
        {feed.length === 0 ? (
          <div className="text-center py-8 text-charcoal-lighter text-sm">Waiting for activity...</div>
        ) : (
          feed.map((order) => (
            <Link href={`/admin/orders/${order.id}`} key={order.id} className="block p-3 rounded-lg hover:bg-sage-50/50 transition-colors border border-transparent hover:border-sage-light/20">
              <div className="flex justify-between items-start mb-1">
                <p className="text-sm font-medium text-charcoal flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-sage-dark" /> {order.order_number}
                </p>
                <span className="text-[10px] text-charcoal-lighter">
                  {order.created_at ? formatDistanceToNow(new Date(order.created_at), { addSuffix: true }) : 'Just now'}
                </span>
              </div>
              <p className="text-xs text-charcoal-lighter mb-2">
                {(order.shipping_address as any)?.name || 'Customer'} placed an order.
              </p>
              <div className="flex gap-2">
                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-700 capitalize">
                  {order.status?.replace(/_/g, ' ')}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${order.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {order.payment_status}
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
