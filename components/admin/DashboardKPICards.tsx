'use client';

import { TrendingUp, ShoppingCart, AlertTriangle, Package } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface DashboardKPICardsProps {
  stats: {
    revenue_mtd: number;
    orders_today: number;
    pending_orders: number;
    low_stock_count: number;
  };
}

export function DashboardKPICards({ stats }: DashboardKPICardsProps) {
  const cards = [
    {
      label: 'Revenue (This Month)',
      value: formatCurrency(stats.revenue_mtd),
      icon: TrendingUp,
      color: 'bg-sage-dark',
      sub: 'From confirmed orders',
    },
    {
      label: 'Orders Today',
      value: stats.orders_today.toString(),
      icon: ShoppingCart,
      color: 'bg-blue-500',
      sub: 'New orders placed',
    },
    {
      label: 'Pending Orders',
      value: stats.pending_orders.toString(),
      icon: Package,
      color: 'bg-amber-500',
      sub: 'Awaiting processing',
    },
    {
      label: 'Low Stock Items',
      value: stats.low_stock_count.toString(),
      icon: AlertTriangle,
      color: stats.low_stock_count > 0 ? 'bg-red-500' : 'bg-sage-dark',
      sub: 'Need restocking',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((card) => (
        <div key={card.label} className="bg-warm-white rounded-xl p-3 sm:p-5 shadow-warm border border-sage-light/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 mb-2 sm:mb-4">
            <p className="text-[10px] sm:text-xs font-body font-medium text-charcoal-lighter uppercase tracking-wide leading-tight">
              {card.label}
            </p>
            <div className={`w-7 h-7 sm:w-9 sm:h-9 ${card.color} rounded-lg flex items-center justify-center shrink-0`}>
              <card.icon className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 text-white" />
            </div>
          </div>
          <p className="font-display text-2xl sm:text-3xl font-medium text-charcoal">{card.value}</p>
          <p className="text-[10px] sm:text-xs text-charcoal-lighter font-body mt-1 truncate">{card.sub}</p>
        </div>
      ))}
    </div>
  );
}
