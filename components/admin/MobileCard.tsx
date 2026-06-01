import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface MobileCardProps {
  title: ReactNode;
  subtitle?: ReactNode;
  status?: ReactNode;
  action?: ReactNode;
  details: { label: string; value: ReactNode }[];
  className?: string;
}

export function MobileCard({ title, subtitle, status, action, details, className }: MobileCardProps) {
  return (
    <div className={cn('bg-white border border-gray-100 rounded-lg p-4 shadow-sm mb-3 sm:hidden', className)}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="font-medium text-charcoal">{title}</div>
          {subtitle && <div className="text-xs text-charcoal-lighter mt-0.5">{subtitle}</div>}
        </div>
        <div className="flex flex-col items-end gap-2">
          {status}
          {action}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-50">
        {details.map((detail, idx) => (
          <div key={idx}>
            <div className="text-[10px] text-charcoal-lighter uppercase tracking-wider mb-0.5">{detail.label}</div>
            <div className="text-sm text-charcoal">{detail.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
