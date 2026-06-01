/**
 * lib/email.ts
 * Resend transactional email integration for LavishOrganic.
 * Uses @react-email/render to convert React components to HTML strings.
 */

import { Resend } from 'resend';
import type { Order, InfluencerProfile } from '@/types';

const resend = new Resend(process.env.RESEND_API_KEY!);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'noreply@lavishorganic.in';
const FROM_NAME = process.env.RESEND_FROM_NAME ?? 'LavishOrganic';
const FROM = `${FROM_NAME} <${FROM_EMAIL}>`;

// ============================================================
// ORDER EMAILS
// ============================================================

/**
 * Sends order confirmation email after successful payment.
 */
export async function sendOrderConfirmationEmail(
  to: string,
  order: Order
): Promise<void> {
  if (!process.env.ENABLE_EMAIL || process.env.ENABLE_EMAIL === 'false') return;

  const itemsHtml = order.items
    ?.map(
      (item) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #e8e4de;">${item.product_name}${item.variant_name ? ` (${item.variant_name})` : ''}</td>
        <td style="padding:8px;border-bottom:1px solid #e8e4de;text-align:center;">${item.quantity}</td>
        <td style="padding:8px;border-bottom:1px solid #e8e4de;text-align:right;">₹${item.unit_price.toFixed(2)}</td>
        <td style="padding:8px;border-bottom:1px solid #e8e4de;text-align:right;">₹${item.total_price.toFixed(2)}</td>
      </tr>`
    )
    .join('') ?? '';

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><title>Order Confirmed — LavishOrganic</title></head>
    <body style="font-family:Helvetica,Arial,sans-serif;background:#FAF7F2;margin:0;padding:20px;">
      <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;">
        <!-- Header -->
        <div style="background:#4A6741;padding:32px;text-align:center;">
          <h1 style="color:#fff;font-size:28px;margin:0;letter-spacing:2px;">LAVISHORGANIC</h1>
          <p style="color:#A8BDA3;margin:8px 0 0;">100% Organic · Cruelty Free · Made in India</p>
        </div>
        <!-- Body -->
        <div style="padding:32px;">
          <h2 style="color:#2C2C2C;margin-top:0;">Order Confirmed! 🌿</h2>
          <p style="color:#4A4A4A;">Thank you for your order. We're preparing your organic goodies!</p>
          
          <div style="background:#FAF7F2;border-radius:6px;padding:16px;margin:24px 0;">
            <p style="margin:0;color:#4A6741;font-weight:600;">Order Number: ${order.order_number}</p>
            <p style="margin:4px 0 0;color:#6E6E6E;font-size:14px;">Placed on ${new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
          
          <!-- Items Table -->
          <table style="width:100%;border-collapse:collapse;margin:16px 0;">
            <thead>
              <tr style="background:#FAF7F2;">
                <th style="padding:8px;text-align:left;color:#4A6741;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Product</th>
                <th style="padding:8px;text-align:center;color:#4A6741;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Qty</th>
                <th style="padding:8px;text-align:right;color:#4A6741;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Price</th>
                <th style="padding:8px;text-align:right;color:#4A6741;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Total</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          
          <!-- Order Totals -->
          <div style="border-top:2px solid #4A6741;padding-top:16px;margin-top:8px;">
            ${order.discount_amount > 0 ? `<p style="display:flex;justify-content:space-between;margin:4px 0;color:#4A4A4A;">Discount <span style="color:#4A6741;">-₹${order.discount_amount.toFixed(2)}</span></p>` : ''}
            <p style="display:flex;justify-content:space-between;margin:4px 0;color:#4A4A4A;">Shipping <span>${order.shipping_amount === 0 ? '<span style="color:#4A6741;">FREE</span>' : `₹${order.shipping_amount.toFixed(2)}`}</span></p>
            <p style="display:flex;justify-content:space-between;margin:4px 0;color:#4A4A4A;">GST <span>₹${order.tax_amount.toFixed(2)}</span></p>
            <p style="display:flex;justify-content:space-between;font-weight:700;font-size:18px;margin:12px 0 0;color:#2C2C2C;">Total <span>₹${order.total.toFixed(2)}</span></p>
          </div>
          
          <!-- CTA -->
          <div style="text-align:center;margin:32px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/account/orders/${order.id}" 
               style="background:#4A6741;color:#fff;padding:14px 32px;border-radius:4px;text-decoration:none;font-weight:600;display:inline-block;">
              Track Your Order
            </a>
          </div>
        </div>
        <!-- Footer -->
        <div style="background:#FAF7F2;padding:20px;text-align:center;color:#6E6E6E;font-size:12px;">
          <p style="margin:0;">Need help? Reply to this email or WhatsApp us</p>
          <p style="margin:8px 0 0;">© 2025 LavishOrganic. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Order Confirmed — ${order.order_number} | LavishOrganic`,
    html,
  });
}

/**
 * Sends order shipped email with tracking link.
 */
export async function sendOrderShippedEmail(
  to: string,
  order: Order
): Promise<void> {
  if (!process.env.ENABLE_EMAIL || process.env.ENABLE_EMAIL === 'false') return;

  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family:Helvetica,Arial,sans-serif;background:#FAF7F2;margin:0;padding:20px;">
      <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;">
        <div style="background:#4A6741;padding:32px;text-align:center;">
          <h1 style="color:#fff;font-size:28px;margin:0;letter-spacing:2px;">LAVISHORGANIC</h1>
        </div>
        <div style="padding:32px;">
          <h2 style="color:#2C2C2C;">Your order is on its way! 🚚</h2>
          <p style="color:#4A4A4A;">Great news! Order <strong>${order.order_number}</strong> has been shipped.</p>
          ${order.tracking_number ? `
          <div style="background:#FAF7F2;border-radius:6px;padding:16px;margin:24px 0;">
            <p style="margin:0;color:#4A6741;font-weight:600;">Tracking Number: ${order.tracking_number}</p>
            ${order.estimated_delivery ? `<p style="margin:8px 0 0;color:#6E6E6E;">Expected Delivery: ${new Date(order.estimated_delivery).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}</p>` : ''}
          </div>
          ` : ''}
          <div style="text-align:center;margin:32px 0;">
            ${order.tracking_url ? `<a href="${order.tracking_url}" style="background:#4A6741;color:#fff;padding:14px 32px;border-radius:4px;text-decoration:none;font-weight:600;display:inline-block;">Track Package</a>` : `<a href="${process.env.NEXT_PUBLIC_APP_URL}/account/orders/${order.id}" style="background:#4A6741;color:#fff;padding:14px 32px;border-radius:4px;text-decoration:none;font-weight:600;display:inline-block;">View Order</a>`}
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Your LavishOrganic order is shipped! — ${order.order_number}`,
    html,
  });
}

/**
 * Sends order delivered email with review request.
 */
export async function sendOrderDeliveredEmail(
  to: string,
  order: Order
): Promise<void> {
  if (!process.env.ENABLE_EMAIL || process.env.ENABLE_EMAIL === 'false') return;

  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family:Helvetica,Arial,sans-serif;background:#FAF7F2;margin:0;padding:20px;">
      <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;">
        <div style="background:#4A6741;padding:32px;text-align:center;">
          <h1 style="color:#fff;font-size:28px;margin:0;letter-spacing:2px;">LAVISHORGANIC</h1>
        </div>
        <div style="padding:32px;">
          <h2 style="color:#2C2C2C;">Your order has arrived! 🌿✨</h2>
          <p style="color:#4A4A4A;">Order <strong>${order.order_number}</strong> has been delivered. We hope you love your organic goodies!</p>
          <p style="color:#4A4A4A;">Mind leaving a review? Your feedback helps other customers make better choices and motivates our team. 💚</p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/account/orders/${order.id}?review=true" 
               style="background:#C9A96E;color:#fff;padding:14px 32px;border-radius:4px;text-decoration:none;font-weight:600;display:inline-block;">
              ⭐ Write a Review
            </a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Delivered! How was your LavishOrganic order? ⭐`,
    html,
  });
}

/**
 * Sends password reset email.
 */
export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string
): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family:Helvetica,Arial,sans-serif;background:#FAF7F2;margin:0;padding:20px;">
      <div style="max-width:500px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;">
        <div style="background:#4A6741;padding:24px;text-align:center;">
          <h1 style="color:#fff;font-size:24px;margin:0;letter-spacing:2px;">LAVISHORGANIC</h1>
        </div>
        <div style="padding:32px;">
          <h2 style="color:#2C2C2C;margin-top:0;">Reset Your Password</h2>
          <p style="color:#4A4A4A;">We received a request to reset your LavishOrganic account password. Click the button below to set a new password.</p>
          <p style="color:#6E6E6E;font-size:14px;">This link expires in 1 hour.</p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${resetUrl}" style="background:#4A6741;color:#fff;padding:14px 32px;border-radius:4px;text-decoration:none;font-weight:600;display:inline-block;">Reset Password</a>
          </div>
          <p style="color:#6E6E6E;font-size:13px;">If you didn't request this, you can safely ignore this email. Your password won't change.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await resend.emails.send({
    from: FROM,
    to,
    subject: 'Reset your LavishOrganic password',
    html,
  });
}

/**
 * Sends welcome email on successful registration.
 */
export async function sendWelcomeEmail(
  to: string,
  name: string,
  referralCode?: string
): Promise<void> {
  if (!process.env.ENABLE_EMAIL || process.env.ENABLE_EMAIL === 'false') return;

  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family:Helvetica,Arial,sans-serif;background:#FAF7F2;margin:0;padding:20px;">
      <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;">
        <div style="background:#4A6741;padding:40px;text-align:center;">
          <h1 style="color:#fff;font-size:32px;margin:0;letter-spacing:2px;">LAVISHORGANIC</h1>
          <p style="color:#A8BDA3;margin:8px 0 0;">Welcome to the organic family 🌿</p>
        </div>
        <div style="padding:40px;">
          <h2 style="color:#2C2C2C;">Hello, ${name}! 👋</h2>
          <p style="color:#4A4A4A;line-height:1.6;">Welcome to LavishOrganic! We're delighted to have you with us. Explore our collection of 100% certified organic skincare products, crafted with love and the purest ingredients from nature.</p>
          ${referralCode ? `
          <div style="background:#FAF7F2;border:1px solid #A8BDA3;border-radius:6px;padding:16px;margin:24px 0;text-align:center;">
            <p style="margin:0;color:#4A6741;font-size:14px;text-transform:uppercase;letter-spacing:1px;">Your Referral Code</p>
            <p style="margin:8px 0 0;font-size:24px;font-weight:700;color:#2C2C2C;letter-spacing:4px;">${referralCode}</p>
            <p style="margin:8px 0 0;color:#6E6E6E;font-size:13px;">Share with friends and earn rewards!</p>
          </div>` : ''}
          <div style="text-align:center;margin:32px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/shop" style="background:#4A6741;color:#fff;padding:14px 32px;border-radius:4px;text-decoration:none;font-weight:600;display:inline-block;">Shop Now</a>
          </div>
          <p style="color:#6E6E6E;font-size:13px;text-align:center;">Use code <strong>WELCOME10</strong> for 10% off your first order!</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Welcome to LavishOrganic, ${name}! 🌿`,
    html,
  });
}

/**
 * Sends influencer application approved email.
 */
export async function sendInfluencerApprovedEmail(
  to: string,
  name: string,
  influencer: InfluencerProfile,
  couponCode: string
): Promise<void> {
  if (!process.env.ENABLE_EMAIL || process.env.ENABLE_EMAIL === 'false') return;

  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family:Helvetica,Arial,sans-serif;background:#FAF7F2;margin:0;padding:20px;">
      <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;">
        <div style="background:#4A6741;padding:32px;text-align:center;">
          <h1 style="color:#fff;font-size:28px;margin:0;letter-spacing:2px;">LAVISHORGANIC</h1>
          <p style="color:#A8BDA3;margin:8px 0 0;">Influencer Partner Program</p>
        </div>
        <div style="padding:32px;">
          <h2 style="color:#4A6741;">Congratulations, ${name}! 🎉</h2>
          <p style="color:#4A4A4A;">Your influencer application has been <strong>approved</strong>! Welcome to the LavishOrganic influencer family.</p>
          
          <div style="background:#FAF7F2;border-radius:6px;padding:20px;margin:24px 0;">
            <h3 style="color:#4A6741;margin-top:0;">Your Details</h3>
            <p style="margin:4px 0;color:#4A4A4A;"><strong>Your Coupon Code:</strong> <span style="font-size:20px;letter-spacing:3px;color:#2C2C2C;">${couponCode}</span></p>
            <p style="margin:4px 0;color:#4A4A4A;"><strong>Commission Rate:</strong> ${influencer.commission_rate}% per sale</p>
          </div>
          
          <p style="color:#4A4A4A;">Share your unique code with your audience. Every purchase using your code earns you ${influencer.commission_rate}% commission, tracked in real-time on your dashboard.</p>
          
          <div style="text-align:center;margin:32px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/account" style="background:#4A6741;color:#fff;padding:14px 32px;border-radius:4px;text-decoration:none;font-weight:600;display:inline-block;">View Your Dashboard</a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Your LavishOrganic influencer application is approved! 🌿`,
    html,
  });
}

/**
 * Sends commission payout notification.
 */
export async function sendCommissionPayoutEmail(
  to: string,
  name: string,
  amount: number,
  reference: string
): Promise<void> {
  if (!process.env.ENABLE_EMAIL || process.env.ENABLE_EMAIL === 'false') return;

  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family:Helvetica,Arial,sans-serif;background:#FAF7F2;margin:0;padding:20px;">
      <div style="max-width:500px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;">
        <div style="background:#4A6741;padding:24px;text-align:center;">
          <h1 style="color:#fff;font-size:24px;margin:0;letter-spacing:2px;">LAVISHORGANIC</h1>
        </div>
        <div style="padding:32px;">
          <h2 style="color:#2C2C2C;margin-top:0;">Commission Paid! 💰</h2>
          <p style="color:#4A4A4A;">Hi ${name}, your commission has been transferred!</p>
          <div style="background:#FAF7F2;border-radius:6px;padding:20px;margin:24px 0;text-align:center;">
            <p style="margin:0;color:#6E6E6E;font-size:14px;">Amount Paid</p>
            <p style="margin:8px 0 0;font-size:36px;font-weight:700;color:#4A6741;">₹${amount.toFixed(2)}</p>
            <p style="margin:8px 0 0;color:#6E6E6E;font-size:13px;">Reference: ${reference}</p>
          </div>
          <p style="color:#6E6E6E;font-size:13px;">The amount has been transferred to your registered bank account. It may take 1-2 business days to reflect.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Commission of ₹${amount.toFixed(2)} paid! — LavishOrganic`,
    html,
  });
}
