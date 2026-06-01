# LavishOrganic — Full-Stack E-Commerce Platform

A production-ready e-commerce application for **LavishOrganic**, an organic skincare & wellness brand. Built with Next.js 15, Supabase, Razorpay, Shiprocket, Cloudinary, Resend, and Twilio.

---

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS v4 |
| Backend | Next.js API Routes + Supabase Edge Functions |
| Database | Supabase (PostgreSQL) with RLS |
| Auth | Supabase Auth (Email, Google OAuth) |
| Payments | Razorpay (UPI, Cards, Net Banking, COD) |
| Logistics | Shiprocket |
| Media | Cloudinary |
| Email | Resend |
| WhatsApp | Twilio |
| State | Zustand |
| PDF | @react-pdf/renderer |
| Charts | Recharts |

---

## 📁 Project Structure

```
lavishorganic/
├── app/
│   ├── (auth)/          # Login, Register, Forgot Password
│   ├── (store)/         # Customer pages (Homepage, Shop, Product, Cart, Checkout)
│   ├── admin/           # Admin panel (Dashboard, Products, Orders, etc.)
│   ├── api/             # API routes
│   │   ├── products/
│   │   ├── orders/
│   │   ├── payment/
│   │   ├── coupon/
│   │   ├── logistics/
│   │   ├── upload/
│   │   ├── invoice/
│   │   └── webhooks/razorpay/
│   ├── auth/callback/   # OAuth + email magic link handler
│   ├── sitemap.ts
│   └── robots.ts
├── components/
│   ├── admin/           # Admin UI components
│   ├── home/            # Homepage sections
│   ├── pdf/             # GST Invoice PDF
│   ├── product/         # Product detail components
│   ├── shop/            # Shop filters, pagination, skeletons
│   └── store/           # Shared layout (Header, Footer, Cart, Search)
├── lib/
│   ├── supabase/        # Browser/server/admin clients
│   ├── razorpay.ts
│   ├── shiprocket.ts
│   ├── cloudinary.ts
│   ├── email.ts
│   ├── whatsapp.ts
│   ├── gst.ts
│   ├── rate-limit.ts
│   └── utils.ts
├── store/               # Zustand stores (cart, wishlist, ui)
├── supabase/
│   └── migrations/      # 005 migration files
└── types/
    └── index.ts
```

---

## 🚀 Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/your-org/lavishorganic.git
cd lavishorganic
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env.local` and fill in all values:

```bash
cp .env.example .env.local
```

Required variables:
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role (server-only)
- `NEXT_PUBLIC_RAZORPAY_KEY_ID` — Razorpay key ID
- `RAZORPAY_KEY_SECRET` — Razorpay secret
- `RAZORPAY_WEBHOOK_SECRET` — Razorpay webhook secret
- `SHIPROCKET_EMAIL` / `SHIPROCKET_PASSWORD` — Shiprocket credentials
- `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET`
- `RESEND_API_KEY` — Resend email API key
- `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_WHATSAPP_FROM`
- `NEXT_PUBLIC_SITE_URL` — Production URL (e.g., `https://lavishorganic.in`)

### 3. Database Setup

Run migrations in Supabase SQL editor in order:

```sql
-- Run in Supabase Dashboard → SQL Editor
1. supabase/migrations/001_initial_schema.sql
2. supabase/migrations/002_rls_policies.sql
3. supabase/migrations/003_auth_hook.sql
4. supabase/migrations/004_db_functions.sql
5. supabase/migrations/005_seed_data.sql
```

### 4. Configure Supabase Auth Hook

> **CRITICAL**: Required for admin role to work.

1. Go to **Supabase Dashboard → Authentication → Hooks**
2. Add a **Custom Access Token** hook
3. Set the function to `public.custom_access_token_hook`
4. Enable it

This injects `user_role` into the JWT so middleware can authenticate admins without a DB lookup.

### 5. Google OAuth Setup

1. Go to Supabase Dashboard → Authentication → Providers
2. Enable Google
3. Add your Google OAuth Client ID and Secret
4. Add `https://your-supabase-url/auth/v1/callback` to Google Console's authorized redirect URIs

### 6. Configure Webhooks

**Razorpay:**
- Dashboard → Webhooks → Add Webhook
- URL: `https://your-domain.com/api/webhooks/razorpay`
- Events: `payment.captured`, `payment.failed`, `refund.processed`
- Secret: same as `RAZORPAY_WEBHOOK_SECRET`

### 7. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**Admin Panel:** [http://localhost:3000/admin](http://localhost:3000/admin)
> First admin must be set manually: `UPDATE auth.users SET raw_app_meta_data = '{"user_role":"admin"}' WHERE email = 'your@email.com';`

---

## 🛒 Features

### Customer-Facing
- 🏠 Homepage with hero, categories, products, flash sale, reviews, Instagram grid, newsletter
- 🛍️ Shop with filters (category, price, stock), sort, search, pagination
- 📦 Product detail with image gallery, variant selector, delivery check, reviews
- 🛒 Cart drawer with real-time updates (Zustand + localStorage)
- 💳 Checkout: address form, Razorpay (UPI/cards/net banking), COD (+₹30)
- ✅ Order confirmation with WhatsApp + email notifications
- 👤 Account: profile, orders, wishlist, addresses

### Admin Panel
- 📊 Dashboard: Revenue MTD, orders today, pending orders, low stock alerts, sales chart
- 📦 Products CRUD (Tiptap editor, Cloudinary upload, variant management)
- 🏷️ Categories (drag & drop reorder)
- 📋 Orders management (Shiprocket, status updates, GST invoices)
- 👥 Customer management
- ⭐ Review moderation
- 🎫 Coupons (percentage, fixed, free shipping, buy-x-get-y)
- 📣 Offers and flash sales
- 🌟 Influencer management
- 📊 Reports (GST, sales, payment reconciliation)

### Technical Features
- 🔐 Supabase Auth (email + Google OAuth + magic links)
- 🎯 JWT-based RBAC (admin role in JWT custom claim via DB hook)
- 💳 Razorpay with webhook signature verification (idempotent)
- 🚀 Shiprocket with token caching via Supabase table
- 🖼️ Cloudinary with signed direct-upload (no file proxying)
- 📧 8 transactional email types via Resend + React Email
- 📱 WhatsApp notifications via Twilio
- 🧾 GST tax invoice PDF with CGST/SGST/IGST calculation
- 🗺️ Dynamic sitemap.xml + robots.txt
- ⚡ ISR (Incremental Static Regeneration) on product + category pages
- 🛡️ Rate limiting on coupon, upload, and public API endpoints
- 🇮🇳 Indian-specific: GST 18%, CGST/SGST/IGST, pincode validation, COD

---

## 🚀 Deployment (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Add all environment variables in Vercel Dashboard → Settings → Environment Variables.

**Vercel Configuration** (`vercel.json`):
- Invoice generation route has 30s timeout
- Webhook route has raw body access

---

## 📜 License

Private — LavishOrganic © 2024. All rights reserved.
