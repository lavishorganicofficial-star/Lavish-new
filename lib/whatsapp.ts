/**
 * lib/whatsapp.ts
 * WhatsApp notification integration supporting Interakt and Twilio.
 */

import twilio from 'twilio';
import { createAdminClient } from '@/lib/supabase/server';

const PROVIDER = process.env.WHATSAPP_PROVIDER || 'interakt';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

type SendResult = { success: boolean; error?: string };

/**
 * Log WhatsApp message to database
 */
async function logWhatsApp(phone: string, template: string, message: string, status: string, error?: string, orderId?: string) {
  try {
    const supabase = await createAdminClient();
    await supabase.from('whatsapp_logs').insert({
      phone,
      template,
      message,
      status,
      error,
      order_id: orderId || null
    });
  } catch (err) {
    console.error('[WhatsApp Logger] Failed to log:', err);
  }
}

/**
 * Core Sender Function
 */
async function sendWhatsApp(
  phone: string,
  templateName: string,
  variables: string[],
  fallbackMessage: string,
  orderId?: string
): Promise<SendResult> {
  const normalizedPhone = phone.startsWith('+') ? phone.replace('+', '') : (phone.startsWith('91') ? phone : `91${phone.replace(/^0/, '')}`);
  let status = 'sent';
  let errorMsg = undefined;

  try {
    if (PROVIDER === 'interakt') {
      const apiKey = process.env.INTERAKT_API_KEY;
      if (!apiKey) throw new Error('INTERAKT_API_KEY missing');

      const res = await fetch('https://api.interakt.ai/v1/public/message/', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(apiKey).toString('base64')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          countryCode: "+91",
          phoneNumber: normalizedPhone.replace('91', ''),
          callbackData: "sent",
          type: "Template",
          template: {
            name: templateName,
            languageCode: "en",
            bodyValues: variables
          }
        })
      });

      if (!res.ok) {
        const errData = await res.text();
        throw new Error(`Interakt API Error: ${errData}`);
      }
    } else {
      // Twilio fallback
      const sid = process.env.TWILIO_ACCOUNT_SID;
      const token = process.env.TWILIO_AUTH_TOKEN;
      const from = process.env.TWILIO_WHATSAPP_FROM;
      if (!sid || !token || !from) throw new Error('Twilio credentials missing');

      const client = twilio(sid, token);
      await client.messages.create({
        from,
        to: `whatsapp:+${normalizedPhone}`,
        body: fallbackMessage
      });
    }

    console.log(`[WhatsApp] Sent '${templateName}' to ${phone} via ${PROVIDER}`);
    await logWhatsApp(phone, templateName, fallbackMessage, status, errorMsg, orderId);
    return { success: true };

  } catch (err: any) {
    console.error(`[WhatsApp Error] ${err.message}`);
    status = 'failed';
    errorMsg = err.message;
    await logWhatsApp(phone, templateName, fallbackMessage, status, errorMsg, orderId);
    return { success: false, error: err.message };
  }
}

// -----------------------------------------------------------------------------
// Message Templates
// -----------------------------------------------------------------------------

export async function sendWhatsAppOrderConfirmed(args: {
  phone: string;
  customerName: string;
  orderNumber: string;
  total: number;
  itemCount: number;
  orderId: string;
}) {
  const fallback = `🌿 *LavishOrganic*\n\nHi ${args.customerName}! Your order is confirmed ✅\n\n🧾 Order: *${args.orderNumber}*\n💰 Amount: *₹${args.total}* (Cash on Delivery)\n📦 Items: ${args.itemCount} products\n\nExpected delivery in 4–6 business days.\n\nTrack your order:\n${APP_URL}/account/orders/${args.orderId}\n\nThank you for shopping with us! 💚`;
  
  return sendWhatsApp(
    args.phone,
    'order_confirmed',
    [args.customerName, args.orderNumber, args.total.toString(), args.itemCount.toString(), `${APP_URL}/account/orders/${args.orderId}`],
    fallback,
    args.orderId
  );
}

export async function sendWhatsAppRestockAlert({ phone, customerName, productName, productUrl }: { phone: string; customerName: string; productName: string; productUrl: string }) {
  const fallback = `Hi ${customerName}, good news! ${productName} is back in stock. Shop now: ${productUrl}`;
  return sendWhatsApp(phone, 'restock_alert', [customerName, productName, productUrl], fallback);
}

// ==========================================
// Phase 5: Influencer Marketing Templates
// ==========================================

export async function sendWhatsAppInfluencerReceived({ phone, name }: { phone: string; name: string }) {
  const fallback = `Hi ${name}, thank you for applying to the LavishOrganic Partner Program! We've received your application and will review it shortly.`;
  return sendWhatsApp(phone, 'influencer_received', [name], fallback);
}

export async function sendWhatsAppInfluencerApproved({ phone, name, discountCode, commissionRate }: { phone: string; name: string; discountCode: string; commissionRate: number }) {
  const fallback = `Hi ${name}, welcome to the LavishOrganic family! You're approved! Your custom code is ${discountCode}. You will earn ${commissionRate}% commission on every sale. Check your dashboard for more details!`;
  return sendWhatsApp(phone, 'influencer_approved', [name, discountCode, commissionRate.toString()], fallback);
}

export async function sendWhatsAppInfluencerRejected({ phone, name }: { phone: string; name: string }) {
  const fallback = `Hi ${name}, thank you for your interest in the LavishOrganic Partner Program. At this time, we are unable to approve your application. We appreciate your support and encourage you to reapply in the future.`;
  return sendWhatsApp(phone, 'influencer_rejected', [name], fallback);
}

export async function sendWhatsAppCommissionPaid({ phone, name, amount, reference }: { phone: string; name: string; amount: number; reference: string }) {
  const fallback = `Hi ${name}, great news! We've just processed a payout of ₹${amount} for your earned commissions. Ref: ${reference}. Thank you for your partnership!`;
  return sendWhatsApp(phone, 'commission_paid', [name, amount.toString(), reference], fallback);
}

export async function sendWhatsAppOrderPacked(args: {
  phone: string;
  orderNumber: string;
  orderId: string;
}) {
  const fallback = `📦 Your LavishOrganic order *${args.orderNumber}* is packed and ready to ship! We'll notify you once it's on the way.`;
  return sendWhatsApp(args.phone, 'order_packed', [args.orderNumber], fallback, args.orderId);
}

export async function sendWhatsAppOrderShipped(args: {
  phone: string;
  orderNumber: string;
  courierName: string;
  trackingNumber: string;
  trackingUrl: string;
  expectedDate: string;
  orderId: string;
}) {
  const fallback = `🚀 Your order *${args.orderNumber}* is on the way!\n\nCourier: ${args.courierName}\nTracking No: ${args.trackingNumber}\n\nTrack here: ${args.trackingUrl}\n\nExpected delivery: ${args.expectedDate}`;
  return sendWhatsApp(
    args.phone,
    'order_shipped',
    [args.orderNumber, args.courierName, args.trackingNumber, args.trackingUrl, args.expectedDate],
    fallback,
    args.orderId
  );
}

export async function sendWhatsAppOrderDelivered(args: {
  phone: string;
  orderNumber: string;
  orderId: string;
}) {
  const fallback = `✅ Your LavishOrganic order *${args.orderNumber}* has been delivered!\n\nWe hope you love your products 🌿\nPlease share your experience:\n${APP_URL}/account/orders/${args.orderId}#review\n\nThank you for choosing LavishOrganic! 💚`;
  return sendWhatsApp(
    args.phone,
    'order_delivered',
    [args.orderNumber, `${APP_URL}/account/orders/${args.orderId}#review`],
    fallback,
    args.orderId
  );
}

export async function sendWhatsAppOrderCancelled(args: {
  phone: string;
  orderNumber: string;
  reason: string;
  supportPhone: string;
  orderId: string;
}) {
  const fallback = `❌ Your order *${args.orderNumber}* has been cancelled.\n\nReason: ${args.reason}\n\nIf you paid and need a refund, we'll process it within 3–5 business days.\n\nNeed help? Call us: ${args.supportPhone}`;
  return sendWhatsApp(
    args.phone,
    'order_cancelled',
    [args.orderNumber, args.reason, args.supportPhone],
    fallback,
    args.orderId
  );
}

export async function sendWhatsAppRefundInitiated(args: {
  phone: string;
  amount: number;
  orderNumber: string;
  refundMethod: string;
  referenceNumber: string;
  orderId?: string;
}) {
  const fallback = `🔄 Your refund of *₹${args.amount}* for order *${args.orderNumber}* has been initiated.\n\nMethod: ${args.refundMethod}\nReference: ${args.referenceNumber}\n\nExpected in 3–5 business days.\nLavishOrganic Team 💚`;
  return sendWhatsApp(
    args.phone,
    'refund_initiated',
    [args.amount.toString(), args.orderNumber, args.refundMethod, args.referenceNumber],
    fallback,
    args.orderId
  );
}
