-- Migration: 016_phase4_logs_analytics.sql
-- Description: Creates WhatsApp logs table and detailed analytics tables for tracking events and searches.

-- 1. WhatsApp Logs
DROP TABLE IF EXISTS public.whatsapp_logs CASCADE;
CREATE TABLE public.whatsapp_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone TEXT NOT NULL,
    template TEXT NOT NULL,
    message TEXT,
    status TEXT DEFAULT 'sent', -- 'sent', 'failed'
    error TEXT,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS and add basic policy for admin viewing
ALTER TABLE public.whatsapp_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read for authenticated admin users"
    ON public.whatsapp_logs FOR SELECT
    TO authenticated
    USING (auth.uid() IN (
        SELECT id FROM public.profiles WHERE role = 'admin'
    ));

-- 2. Analytics Events (Detailed tracking per event)
DROP TABLE IF EXISTS public.analytics_events CASCADE;
CREATE TABLE public.analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    visitor_id TEXT NOT NULL,
    event_type TEXT NOT NULL, -- 'page_view', 'product_view', 'add_to_cart', 'checkout_start', etc.
    page_path TEXT,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    search_query TEXT,
    device_type TEXT, -- 'mobile', 'tablet', 'desktop'
    referrer TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    metadata JSONB, -- stores extra fields like 'qty', 'orderId', 'platform'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Search Analytics
DROP TABLE IF EXISTS public.search_analytics CASCADE;
CREATE TABLE public.search_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query TEXT NOT NULL,
    results_count INTEGER DEFAULT 0,
    search_count INTEGER DEFAULT 1,
    last_searched_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_order ON public.whatsapp_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_visitor ON public.analytics_events(visitor_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON public.analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_search_analytics_created ON public.search_analytics(created_at);
