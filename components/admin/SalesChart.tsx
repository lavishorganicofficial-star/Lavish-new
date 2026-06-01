'use client';

import { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart,
} from 'recharts';
import { formatCurrency } from '@/lib/utils';

interface SalesChartProps {
  salesData: { total: number; created_at: string }[];
}

export function SalesChart({ salesData }: SalesChartProps) {
  const chartData = useMemo(() => {
    const grouped: Record<string, number> = {};

    salesData.forEach((order) => {
      const day = new Date(order.created_at).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short',
      });
      grouped[day] = (grouped[day] ?? 0) + order.total;
    });

    return Object.entries(grouped).map(([date, revenue]) => ({ date, revenue }));
  }, [salesData]);

  return (
    <div className="bg-warm-white rounded-xl p-6 shadow-warm border border-sage-light/20">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-base font-medium text-charcoal">Sales Revenue</h2>
          <p className="text-xs text-charcoal-lighter font-body mt-0.5">Last 30 days</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4A6741" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#4A6741" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E8E4DE" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fontFamily: 'DM Sans', fill: '#6E6E6E' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fontFamily: 'DM Sans', fill: '#6E6E6E' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
          />
          <Tooltip
            contentStyle={{
              fontFamily: 'DM Sans',
              fontSize: 12,
              borderRadius: 8,
              border: '1px solid #E8E4DE',
              backgroundColor: '#FAF7F2',
            }}
            formatter={(val) => [typeof val === 'number' ? formatCurrency(val) : '₹0', 'Revenue']}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#4A6741"
            strokeWidth={2}
            fill="url(#revenueGrad)"
            dot={{ fill: '#4A6741', r: 3 }}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
