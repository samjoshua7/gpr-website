-- ==============================================================================
-- Migration 031: Align Sales Invoice Items & Production Tasks RLS with Accounts Role
-- ==============================================================================

-- 1. Update sales_invoice_items RLS to allow SUPER_ADMIN, ACCOUNTS, and STAFF
DROP POLICY IF EXISTS "SUPER_ADMIN & STAFF full access on sales_invoice_items" ON public.sales_invoice_items;
DROP POLICY IF EXISTS "SUPER_ADMIN, ACCOUNTS & STAFF full access on sales_invoice_items" ON public.sales_invoice_items;

CREATE POLICY "SUPER_ADMIN, ACCOUNTS & STAFF full access on sales_invoice_items" ON public.sales_invoice_items 
    FOR ALL TO authenticated USING ((select public.get_auth_role()) IN ('SUPER_ADMIN', 'ACCOUNTS', 'STAFF'));

-- 2. Update production_tasks RLS to allow SUPER_ADMIN, ACCOUNTS, and STAFF
DROP POLICY IF EXISTS "SUPER_ADMIN & STAFF full access on production_tasks" ON public.production_tasks;
DROP POLICY IF EXISTS "SUPER_ADMIN, ACCOUNTS & STAFF full access on production_tasks" ON public.production_tasks;

CREATE POLICY "SUPER_ADMIN, ACCOUNTS & STAFF full access on production_tasks" ON public.production_tasks 
    FOR ALL TO authenticated USING ((select public.get_auth_role()) IN ('SUPER_ADMIN', 'ACCOUNTS', 'STAFF'));

-- 3. Reload PostgREST schema cache
NOTIFY pgrst, 'reload';
