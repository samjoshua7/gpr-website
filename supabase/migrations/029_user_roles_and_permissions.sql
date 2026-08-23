-- ==============================================================================
-- Migration 029: 4-Tier RBAC (Super Admin, Accounts, Staff, Stakeholder) & Employee Sync
-- ==============================================================================

-- 1. Update users table role check constraint to support all 4 internal roles + customer
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check 
    CHECK (role IN ('SUPER_ADMIN', 'STAFF', 'ACCOUNTS', 'STAKEHOLDER', 'CUSTOMER'));

-- 2. Add departments column to public.users if not exists
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS departments text[] DEFAULT '{}';

-- 3. Trigger Function to automatically sync employee creation/updates into public.users
CREATE OR REPLACE FUNCTION public.sync_employee_to_user()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.email IS NOT NULL AND NEW.email != '' THEN
        -- Check if user exists by email; if so update, else create dummy user reference or placeholder
        UPDATE public.users
        SET role = COALESCE(NEW.role, 'STAFF'),
            name = NEW.name,
            departments = COALESCE(NEW.departments, '{}'),
            active = NEW.active,
            updated_at = now()
        WHERE email = NEW.email;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_employee_to_user ON public.employees;
CREATE TRIGGER trg_sync_employee_to_user
AFTER INSERT OR UPDATE ON public.employees
FOR EACH ROW EXECUTE FUNCTION public.sync_employee_to_user();

-- 4. Update get_auth_role() helper function to be STABLE and handle null safely
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS text AS $$
    SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 5. RLS Policies Updates

-- public.users
DROP POLICY IF EXISTS "Allow SUPER_ADMIN full CRUD on users" ON public.users;
DROP POLICY IF EXISTS "Allow users to read own profile" ON public.users;
DROP POLICY IF EXISTS "Allow STAKEHOLDER read on users" ON public.users;

CREATE POLICY "Allow SUPER_ADMIN full CRUD on users" ON public.users 
    FOR ALL TO authenticated USING ((select public.get_auth_role()) = 'SUPER_ADMIN');

CREATE POLICY "Allow users to read own profile" ON public.users 
    FOR SELECT TO authenticated USING (id = auth.uid() OR (select public.get_auth_role()) IN ('SUPER_ADMIN', 'STAKEHOLDER'));

-- public.employees
DROP POLICY IF EXISTS "SUPER_ADMIN full access on employees" ON public.employees;
DROP POLICY IF EXISTS "STAFF read access on employees" ON public.employees;
DROP POLICY IF EXISTS "STAKEHOLDER read access on employees" ON public.employees;

CREATE POLICY "SUPER_ADMIN full access on employees" ON public.employees 
    FOR ALL TO authenticated USING ((select public.get_auth_role()) = 'SUPER_ADMIN');

CREATE POLICY "Read access on employees" ON public.employees 
    FOR SELECT TO authenticated USING ((select public.get_auth_role()) IN ('SUPER_ADMIN', 'ACCOUNTS', 'STAFF', 'STAKEHOLDER'));

-- public.company_settings
DROP POLICY IF EXISTS "SUPER_ADMIN full access on company_settings" ON public.company_settings;
DROP POLICY IF EXISTS "STAFF read access on company_settings" ON public.company_settings;
DROP POLICY IF EXISTS "Authenticated read access on company_settings" ON public.company_settings;

CREATE POLICY "SUPER_ADMIN full access on company_settings" ON public.company_settings 
    FOR ALL TO authenticated USING ((select public.get_auth_role()) = 'SUPER_ADMIN');

CREATE POLICY "Authenticated read access on company_settings" ON public.company_settings 
    FOR SELECT TO authenticated USING (auth.role() = 'authenticated');

-- public.customers
DROP POLICY IF EXISTS "SUPER_ADMIN & STAFF full access on customers" ON public.customers;
DROP POLICY IF EXISTS "CRUD access on customers" ON public.customers;

CREATE POLICY "CRUD access on customers" ON public.customers 
    FOR ALL TO authenticated USING ((select public.get_auth_role()) IN ('SUPER_ADMIN', 'ACCOUNTS'));

CREATE POLICY "Read access on customers" ON public.customers 
    FOR SELECT TO authenticated USING ((select public.get_auth_role()) IN ('SUPER_ADMIN', 'ACCOUNTS', 'STAFF', 'STAKEHOLDER'));

-- public.sales_invoices
DROP POLICY IF EXISTS "SUPER_ADMIN & STAFF full access on sales_invoices" ON public.sales_invoices;
DROP POLICY IF EXISTS "CRUD access on sales_invoices" ON public.sales_invoices;

CREATE POLICY "CRUD access on sales_invoices" ON public.sales_invoices 
    FOR ALL TO authenticated USING ((select public.get_auth_role()) IN ('SUPER_ADMIN', 'ACCOUNTS'));

CREATE POLICY "Read access on sales_invoices" ON public.sales_invoices 
    FOR SELECT TO authenticated USING ((select public.get_auth_role()) IN ('SUPER_ADMIN', 'ACCOUNTS', 'STAKEHOLDER'));

-- public.receipts
DROP POLICY IF EXISTS "SUPER_ADMIN & STAFF full access on receipts" ON public.receipts;
DROP POLICY IF EXISTS "CRUD access on receipts" ON public.receipts;

CREATE POLICY "CRUD access on receipts" ON public.receipts 
    FOR ALL TO authenticated USING ((select public.get_auth_role()) IN ('SUPER_ADMIN', 'ACCOUNTS'));

CREATE POLICY "Read access on receipts" ON public.receipts 
    FOR SELECT TO authenticated USING ((select public.get_auth_role()) IN ('SUPER_ADMIN', 'ACCOUNTS', 'STAKEHOLDER'));

-- public.quotations
DROP POLICY IF EXISTS "CRUD access on quotations" ON public.quotations;
DROP POLICY IF EXISTS "Read access on quotations" ON public.quotations;

CREATE POLICY "CRUD access on quotations" ON public.quotations 
    FOR ALL TO authenticated USING ((select public.get_auth_role()) IN ('SUPER_ADMIN', 'ACCOUNTS'));

CREATE POLICY "Read access on quotations" ON public.quotations 
    FOR SELECT TO authenticated USING ((select public.get_auth_role()) IN ('SUPER_ADMIN', 'ACCOUNTS', 'STAKEHOLDER'));

-- public.job_cards
DROP POLICY IF EXISTS "SUPER_ADMIN & STAFF full access on job_cards" ON public.job_cards;
DROP POLICY IF EXISTS "CRUD access on job_cards" ON public.job_cards;

CREATE POLICY "CRUD access on job_cards" ON public.job_cards 
    FOR ALL TO authenticated USING ((select public.get_auth_role()) IN ('SUPER_ADMIN', 'ACCOUNTS', 'STAFF'));

CREATE POLICY "Read access on job_cards" ON public.job_cards 
    FOR SELECT TO authenticated USING ((select public.get_auth_role()) IN ('SUPER_ADMIN', 'ACCOUNTS', 'STAFF', 'STAKEHOLDER'));

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload';
