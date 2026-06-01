-- ============================================================
-- Migration 003: Supabase Auth Hook — JWT Role Injection [FIX #6]
-- 
-- IMPORTANT: After running this migration, you must manually
-- register the hook in Supabase Dashboard:
--   Authentication → Hooks → Custom Access Token Hook
--   → Select function: public.custom_access_token_hook
-- ============================================================

-- Grant the auth schema permission to call our function
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.handle_new_user TO supabase_auth_admin;

-- Custom Access Token Hook: injects user_role into JWT claims
-- This means middleware can read role from JWT without DB query
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claims JSONB;
  user_role TEXT;
  user_id UUID;
BEGIN
  -- Extract user_id from event
  user_id := (event->>'user_id')::UUID;
  
  -- Get role from profiles table
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = user_id;
  
  -- Start from existing claims
  claims := event->'claims';
  
  -- Inject role (default to 'customer' if not found)
  IF user_role IS NOT NULL THEN
    claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));
  ELSE
    claims := jsonb_set(claims, '{user_role}', '"customer"');
  END IF;
  
  -- Return modified event
  RETURN jsonb_set(event, '{claims}', claims);
  
EXCEPTION WHEN OTHERS THEN
  -- Never fail auth — return unchanged event on error
  RAISE WARNING 'custom_access_token_hook error: %', SQLERRM;
  RETURN event;
END;
$$;

-- Grant auth admin access to call this function
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;

-- Revoke from public for security
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM PUBLIC;

-- ============================================================
-- AFTER RUNNING THIS MIGRATION:
-- 1. Go to Supabase Dashboard
-- 2. Navigate to: Authentication → Hooks
-- 3. Add hook: "Customize Access Token (JWT) Claims"
-- 4. Select function: public.custom_access_token_hook
-- 5. Save
-- ============================================================
