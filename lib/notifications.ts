import type { SupabaseClient } from '@supabase/supabase-js';
import type { Order } from '@/types';

/**
 * Creates an in-app notification when an order status changes.
 */
export async function createOrderNotification(
  supabase: SupabaseClient,
  order: Order,
  newStatus: string
) {
  // Skip for guest orders (no user_id)
  if (!order.user_id) return;

  const messages: Record<string, { title: string; message: string }> = {
    confirmed: {
      title: 'Order Confirmed! ✅',
      message: `Your order #${order.order_number} is confirmed. We are preparing your items.`
    },
    packed: {
      title: 'Order Packed 📦',
      message: `Your order #${order.order_number} is packed and ready to ship!`
    },
    shipped: {
      title: 'Order Shipped 🚀',
      message: `Your order #${order.order_number} is on the way! ${
        order.tracking_number ? `Tracking: ${order.tracking_number}` : 'Track it in My Orders.'
      }`
    },
    delivered: {
      title: 'Order Delivered 🎉',
      message: `Your order #${order.order_number} has been delivered! Hope you love it 🌿`
    },
    cancelled: {
      title: 'Order Cancelled ❌',
      message: `Your order #${order.order_number} has been cancelled. Contact us if you have questions.`
    }
  };

  const content = messages[newStatus];
  if (!content) return;

  const icons: Record<string, string> = {
    confirmed: '✅',
    packed: '📦',
    shipped: '🚀',
    delivered: '🎉',
    cancelled: '❌'
  };

  const { error } = await supabase.from('notifications').insert({
    user_id: order.user_id,
    order_id: order.id,
    type: 'order',
    title: content.title,
    message: content.message,
    icon: icons[newStatus] || 'ℹ️',
    action_url: `/account/orders/${order.id}`,
    is_read: false
  });

  if (error) {
    console.error('[createOrderNotification] Failed to create notification:', error.message);
  }
}
