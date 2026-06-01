'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Bell, Check, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow, isToday, isYesterday } from 'date-fns';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'orders'>('all');
  const supabase = createClient();

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const fetchNotifications = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let query = supabase.from('notifications').select('*').eq('user_id', user.id);

    if (filter === 'unread') query = query.eq('is_read', false);
    if (filter === 'orders') query = query.eq('type', 'order');

    const { data } = await query.order('created_at', { ascending: false }).limit(50);
    if (data) setNotifications(data);
    setLoading(false);
  };

  const markAsRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  };

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
    }
  };

  // Grouping
  const grouped = notifications.reduce((acc: any, notif) => {
    const date = new Date(notif.created_at);
    let group = 'Earlier';
    if (isToday(date)) group = 'Today';
    else if (isYesterday(date)) group = 'Yesterday';

    if (!acc[group]) acc[group] = [];
    acc[group].push(notif);
    return acc;
  }, { Today: [], Yesterday: [], Earlier: [] });

  return (
    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-sage-light/20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-display font-semibold text-charcoal">My Notifications</h1>
        {notifications.some(n => !n.is_read) && (
          <button 
            onClick={markAllRead}
            className="flex items-center gap-2 text-sm font-medium text-sage-dark hover:text-charcoal transition-colors"
          >
            <Check className="w-4 h-4" />
            Mark all as read
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-sage-light/30 mb-6 overflow-x-auto">
        {(['all', 'unread', 'orders'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`pb-3 text-sm font-medium transition-colors whitespace-nowrap ${
              filter === tab
                ? 'text-sage-dark border-b-2 border-sage-dark'
                : 'text-charcoal-light hover:text-charcoal'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-12 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-sage-dark" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="py-16 text-center text-charcoal-lighter">
          <Bell className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <h3 className="text-lg font-medium mb-2 text-charcoal">No notifications yet</h3>
          <p>When you get updates, they'll show up here.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {['Today', 'Yesterday', 'Earlier'].map((group) => {
            if (grouped[group].length === 0) return null;
            return (
              <div key={group}>
                <h4 className="text-xs font-bold text-charcoal-lighter uppercase tracking-wider mb-4 px-2">
                  {group}
                </h4>
                <div className="space-y-2">
                  {grouped[group].map((notif: any) => (
                    <div 
                      key={notif.id}
                      onClick={() => markAsRead(notif.id)}
                      className={`flex gap-4 p-4 rounded-xl transition-colors relative group ${
                        !notif.is_read ? 'bg-sage-50/50' : 'bg-white border border-sage-light/20'
                      }`}
                    >
                      {!notif.is_read && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-sage-dark rounded-r-md" />
                      )}
                      <div className="text-2xl shrink-0">{notif.icon || 'ℹ️'}</div>
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1">
                          <h5 className={`font-medium text-sm ${!notif.is_read ? 'text-charcoal font-semibold' : 'text-charcoal-light'}`}>
                            {notif.title}
                          </h5>
                          <span className="text-xs text-charcoal-lighter shrink-0">
                            {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm text-charcoal-light leading-relaxed">
                          {notif.message}
                        </p>
                        {notif.action_url && (
                          <Link 
                            href={notif.action_url}
                            className="inline-flex mt-3 text-xs font-semibold text-sage-dark hover:underline"
                          >
                            View Details
                          </Link>
                        )}
                        {notif.type === 'order_delivered' && notif.order_id && (
                          <Link 
                            href={`/account/orders/${notif.order_id}?review=true`}
                            className="inline-flex mt-3 ml-4 text-xs font-semibold text-gold hover:underline"
                          >
                            ⭐ Write a Review
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
