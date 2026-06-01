'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useUIStore } from '@/store/uiStore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';

export function NotificationBell() {
  const [session, setSession] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const addToast = useUIStore((state) => state.addNotificationToast);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));

    const { data: authListener } = supabase.auth.onAuthStateChange((_, sess) => {
      setSession(sess);
    });

    return () => authListener.subscription.unsubscribe();
  }, [supabase.auth]);

  useEffect(() => {
    if (!session?.user?.id) return;
    const userId = session.user.id;

    // Fetch initial notifications
    const fetchNotifications = async () => {
      const [{ data: notifs }, { data: countData }] = await Promise.all([
        supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(10),
        supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('is_read', false)
      ]);
      if (notifs) setNotifications(notifs);
      if (countData !== null) setUnreadCount(countData as unknown as number);
    };

    fetchNotifications();

    // Subscribe to realtime
    const channel = supabase
      .channel('user-notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        const newNotif = payload.new;
        setNotifications((prev) => [newNotif, ...prev].slice(0, 10));
        setUnreadCount((c) => c + 1);
        addToast(newNotif as any);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session, supabase, addToast]);

  // Click outside to close
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  const markAsRead = async (id: string, actionUrl: string | null) => {
    setIsOpen(false);
    // Optimistic update
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount((c) => Math.max(0, c - 1));
    
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    
    if (actionUrl) router.push(actionUrl);
  };

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', session.user.id).eq('is_read', false);
  };

  if (!session) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-charcoal hover:bg-sage-50 rounded-full transition-colors relative"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border border-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-lg shadow-xl border border-sage-light/30 overflow-hidden z-50">
          <div className="p-3 border-b border-sage-light/30 flex items-center justify-between bg-sage-50/50">
            <h3 className="font-semibold text-charcoal">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-sage-dark font-medium hover:underline">
                Mark all read
              </button>
            )}
          </div>
          
          <div className="max-h-[60vh] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-charcoal-lighter">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-sage-light/10">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => markAsRead(notif.id, notif.action_url)}
                    className={`p-4 cursor-pointer hover:bg-sage-50 transition-colors flex gap-3 ${!notif.is_read ? 'bg-white' : 'bg-gray-50/50 opacity-80'}`}
                  >
                    <div className="text-2xl shrink-0 mt-0.5">{notif.icon || 'ℹ️'}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between gap-2 mb-1">
                        <h4 className="font-semibold text-sm text-charcoal truncate">{notif.title}</h4>
                        <span className="text-[10px] text-charcoal-lighter shrink-0 whitespace-nowrap">
                          {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-xs text-charcoal-light line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>
                    </div>
                    {!notif.is_read && <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="p-3 border-t border-sage-light/30 text-center bg-gray-50">
            <Link 
              href="/account/notifications" 
              onClick={() => setIsOpen(false)}
              className="text-xs font-semibold text-sage-dark hover:underline"
            >
              View all notifications →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
