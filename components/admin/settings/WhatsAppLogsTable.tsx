import { formatDate } from '@/lib/utils';
import { CheckCircle2, XCircle } from 'lucide-react';

export function WhatsAppLogsTable({ logs }: { logs: any[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="bg-sage-50/50 text-charcoal-lighter text-xs uppercase font-medium">
          <tr>
            <th className="px-4 py-3 rounded-tl-lg">Time</th>
            <th className="px-4 py-3">Phone</th>
            <th className="px-4 py-3">Template</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 rounded-tr-lg">Error</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {logs.map((log) => (
            <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
              <td className="px-4 py-3 whitespace-nowrap text-charcoal-light">
                {formatDate(log.created_at)}
              </td>
              <td className="px-4 py-3 font-medium text-charcoal">{log.phone}</td>
              <td className="px-4 py-3 text-sage-dark">{log.template}</td>
              <td className="px-4 py-3">
                {log.status === 'sent' ? (
                  <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Sent
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-full text-xs font-medium">
                    <XCircle className="w-3.5 h-3.5" /> Failed
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-red-500 text-xs truncate max-w-[200px]" title={log.error}>
                {log.error || '-'}
              </td>
            </tr>
          ))}
          {logs.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-charcoal-lighter">
                No WhatsApp logs found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
