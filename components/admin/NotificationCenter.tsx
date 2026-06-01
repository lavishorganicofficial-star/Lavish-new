'use client';

import { useState, useEffect } from 'react';
import { Bell, X, Package, CreditCard, AlertTriangle, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

type Notification = {
  id: string;
  type: 'order' | 'payment' | 'stock' | 'influencer';
  title: string;
  message: string;
  time: Date;
  read: boolean;
  href: string;
};

// Mock data since we don't have a notifications table yet. 
// In a real app, this would use Supabase Realtime + a notifications table.
const MOCK_NOTIFICATIONS: Notification[] = [
  { id: '1', type: 'order', title: 'New Order Received', message: 'Order #ORD-10023 was just placed.', time: new Date(Date.now() - 1000 * 60 * 5), read: false, href: '/admin/orders' },
  { id: '2', type: 'stock', title: 'Low Stock Alert', message: 'Moringa Powder is running low (3 units left).', time: new Date(Date.now() - 1000 * 60 * 45), read: false, href: '/admin/inventory' },
  { id: '3', type: 'payment', title: 'Refund Failed', message: 'Automatic refund for ORD-09941 failed.', time: new Date(Date.now() - 1000 * 60 * 60 * 2), read: true, href: '/admin/payments/refunds' },
];

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);

  useEffect(() => {
    // Fetch pending influencers to inject real notifications
    import('@/lib/supabase/client').then(m => {
      const supabase = m.createClient();
      supabase
        .from('influencer_profiles')
        .select('id, applied_at, profiles(full_name)')
        .eq('status', 'pending')
        .order('applied_at', { ascending: false })
        .limit(3)
        .then(({ data }) => {
          if (data && data.length > 0) {
            const infNotifs: Notification[] = data.map(inf => ({
              id: `inf-${inf.id}`,
              type: 'influencer',
              title: 'New Partner Application',
              message: `${(inf as any).profiles?.full_name || 'Someone'} applied to be an influencer.`,
              time: new Date(inf.applied_at),
              read: false,
              href: `/admin/influencers`
            }));
            
            setNotifications(prev => {
              // Merge avoiding duplicates
              const existingIds = new Set(prev.map(n => n.id));
              const newNotifs = infNotifs.filter(n => !existingIds.has(n.id));
              return [...newNotifs, ...prev].sort((a, b) => b.time.getTime() - a.time.getTime());
            });
          }
        });
    });
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const removeNotification = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setNotifications(notifications.filter(n => n.id !== id));
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-charcoal-lighter hover:text-sage-dark transition-colors rounded-full hover:bg-sage-50"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="p-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="font-medium text-charcoal text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs text-sage-dark hover:underline font-medium">
                  Mark all read
                </button>
              )}
            </div>
            
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-sm">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  No notifications
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {notifications.map(n => {
                    let Icon = Package;
                    let color = 'text-blue-500 bg-blue-50';
                    if (n.type === 'payment') { Icon = CreditCard; color = 'text-orange-500 bg-orange-50'; }
                    if (n.type === 'stock') { Icon = AlertTriangle; color = 'text-red-500 bg-red-50'; }
                    if (n.type === 'influencer') { Icon = Users; color = 'text-sage-dark bg-sage-50'; }

                    return (
                      <Link 
                        key={n.id} 
                        href={n.href}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-start gap-3 p-3 hover:bg-gray-50 transition-colors relative group ${!n.read ? 'bg-sage-50/30' : ''}`}
                      >
                        <div className={`p-2 rounded-full flex-shrink-0 ${color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0 pr-6">
                          <p className={`text-sm ${!n.read ? 'font-medium text-charcoal' : 'text-gray-700'}`}>
                            {n.title}
                          </p>
                          <p className="text-xs text-gray-500 truncate mt-0.5">{n.message}</p>
                          <p className="text-[10px] text-gray-400 mt-1">{formatDistanceToNow(n.time, { addSuffix: true })}</p>
                        </div>
                        {!n.read && (
                          <div className="absolute top-1/2 -translate-y-1/2 right-3 w-1.5 h-1.5 bg-sage-dark rounded-full"></div>
                        )}
                        <button 
                          onClick={(e) => removeNotification(n.id, e)}
                          className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
            
            <Link 
              href="/admin/settings?tab=notifications" 
              onClick={() => setIsOpen(false)}
              className="block p-2 text-center text-xs text-gray-500 hover:text-sage-dark border-t border-gray-100 bg-gray-50 hover:bg-sage-50 transition-colors"
            >
              Notification Settings
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
