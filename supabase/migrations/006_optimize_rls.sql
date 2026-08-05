-- 006_optimize_rls.sql
-- Optimizes RLS by making get_auth_role() STABLE and wrapping calls in (select ...) to allow query planner caching.

-- 1. Update the function to be STABLE
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS text AS $$
    SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 2. Drop and recreate policies with (select ...) for get_auth_role() and auth.uid()

-- public.users
DROP POLICY IF EXISTS "Allow SUPER_ADMIN full CRUD on users" ON public.users;
CREATE POLICY "Allow SUPER_ADMIN full CRUD on users" ON public.users 
    FOR ALL TO authenticated USING ((select public.get_auth_role()) = 'SUPER_ADMIN');

-- public.employees
DROP POLICY IF EXISTS "SUPER_ADMIN full access on employees" ON public.employees;
CREATE POLICY "SUPER_ADMIN full access on employees" ON public.employees 
    FOR ALL TO authenticated USING ((select public.get_auth_role()) = 'SUPER_ADMIN');

DROP POLICY IF EXISTS "STAFF read access on employees" ON public.employees;
CREATE POLICY "STAFF read access on employees" ON public.employees 
    FOR SELECT TO authenticated USING ((select public.get_auth_role()) = 'STAFF');

-- public.customers
DROP POLICY IF EXISTS "SUPER_ADMIN & STAFF full access on customers" ON public.customers;
CREATE POLICY "SUPER_ADMIN & STAFF full access on customers" ON public.customers 
    FOR ALL TO authenticated USING ((select public.get_auth_role()) IN ('SUPER_ADMIN', 'STAFF'));

DROP POLICY IF EXISTS "CUSTOMER read-only access to own customer record" ON public.customers;
CREATE POLICY "CUSTOMER read-only access to own customer record" ON public.customers 
    FOR SELECT TO authenticated USING (user_id = (select auth.uid()));

-- public.suppliers
DROP POLICY IF EXISTS "SUPER_ADMIN & STAFF full access on suppliers" ON public.suppliers;
CREATE POLICY "SUPER_ADMIN & STAFF full access on suppliers" ON public.suppliers 
    FOR ALL TO authenticated USING ((select public.get_auth_role()) IN ('SUPER_ADMIN', 'STAFF'));

-- public.items
DROP POLICY IF EXISTS "SUPER_ADMIN & STAFF full access on items" ON public.items;
CREATE POLICY "SUPER_ADMIN & STAFF full access on items" ON public.items 
    FOR ALL TO authenticated USING ((select public.get_auth_role()) IN ('SUPER_ADMIN', 'STAFF'));

-- public.company_settings
DROP POLICY IF EXISTS "SUPER_ADMIN full access on company_settings" ON public.company_settings;
CREATE POLICY "SUPER_ADMIN full access on company_settings" ON public.company_settings 
    FOR ALL TO authenticated USING ((select public.get_auth_role()) = 'SUPER_ADMIN');

DROP POLICY IF EXISTS "STAFF read access on company_settings" ON public.company_settings;
CREATE POLICY "STAFF read access on company_settings" ON public.company_settings 
    FOR SELECT TO authenticated USING ((select public.get_auth_role()) = 'STAFF');

-- public.job_cards
DROP POLICY IF EXISTS "SUPER_ADMIN & STAFF full access on job_cards" ON public.job_cards;
CREATE POLICY "SUPER_ADMIN & STAFF full access on job_cards" ON public.job_cards 
    FOR ALL TO authenticated USING ((select public.get_auth_role()) IN ('SUPER_ADMIN', 'STAFF'));

DROP POLICY IF EXISTS "CUSTOMER read own job_cards" ON public.job_cards;
CREATE POLICY "CUSTOMER read own job_cards" ON public.job_cards 
    FOR SELECT TO authenticated USING (
        customer_id IN (SELECT customer_id FROM public.customers WHERE user_id = (select auth.uid()))
    );

-- public.job_card_items
DROP POLICY IF EXISTS "SUPER_ADMIN & STAFF full access on job_card_items" ON public.job_card_items;
CREATE POLICY "SUPER_ADMIN & STAFF full access on job_card_items" ON public.job_card_items 
    FOR ALL TO authenticated USING ((select public.get_auth_role()) IN ('SUPER_ADMIN', 'STAFF'));

DROP POLICY IF EXISTS "CUSTOMER read own job_card_items" ON public.job_card_items;
CREATE POLICY "CUSTOMER read own job_card_items" ON public.job_card_items 
    FOR SELECT TO authenticated USING (
        job_id IN (
            SELECT job_id FROM public.job_cards 
            WHERE customer_id IN (SELECT customer_id FROM public.customers WHERE user_id = (select auth.uid()))
        )
    );

-- public.sales_invoices
DROP POLICY IF EXISTS "SUPER_ADMIN & STAFF full access on sales_invoices" ON public.sales_invoices;
CREATE POLICY "SUPER_ADMIN & STAFF full access on sales_invoices" ON public.sales_invoices 
    FOR ALL TO authenticated USING ((select public.get_auth_role()) IN ('SUPER_ADMIN', 'STAFF'));

DROP POLICY IF EXISTS "CUSTOMER read own sales_invoices" ON public.sales_invoices;
CREATE POLICY "CUSTOMER read own sales_invoices" ON public.sales_invoices 
    FOR SELECT TO authenticated USING (
        customer_id IN (SELECT customer_id FROM public.customers WHERE user_id = (select auth.uid()))
    );

-- public.sales_invoice_items
DROP POLICY IF EXISTS "SUPER_ADMIN & STAFF full access on sales_invoice_items" ON public.sales_invoice_items;
CREATE POLICY "SUPER_ADMIN & STAFF full access on sales_invoice_items" ON public.sales_invoice_items 
    FOR ALL TO authenticated USING ((select public.get_auth_role()) IN ('SUPER_ADMIN', 'STAFF'));

DROP POLICY IF EXISTS "CUSTOMER read own sales_invoice_items" ON public.sales_invoice_items;
CREATE POLICY "CUSTOMER read own sales_invoice_items" ON public.sales_invoice_items 
    FOR SELECT TO authenticated USING (
        invoice_id IN (
            SELECT invoice_id FROM public.sales_invoices 
            WHERE customer_id IN (SELECT customer_id FROM public.customers WHERE user_id = (select auth.uid()))
        )
    );

-- public.receipts
DROP POLICY IF EXISTS "SUPER_ADMIN & STAFF full access on receipts" ON public.receipts;
CREATE POLICY "SUPER_ADMIN & STAFF full access on receipts" ON public.receipts 
    FOR ALL TO authenticated USING ((select public.get_auth_role()) IN ('SUPER_ADMIN', 'STAFF'));

DROP POLICY IF EXISTS "CUSTOMER read own receipts" ON public.receipts;
CREATE POLICY "CUSTOMER read own receipts" ON public.receipts 
    FOR SELECT TO authenticated USING (
        customer_id IN (SELECT customer_id FROM public.customers WHERE user_id = (select auth.uid()))
    );

-- public.purchase_bills
DROP POLICY IF EXISTS "SUPER_ADMIN & STAFF full access on purchase_bills" ON public.purchase_bills;
CREATE POLICY "SUPER_ADMIN & STAFF full access on purchase_bills" ON public.purchase_bills 
    FOR ALL TO authenticated USING ((select public.get_auth_role()) IN ('SUPER_ADMIN', 'STAFF'));

-- public.purchase_bill_items
DROP POLICY IF EXISTS "SUPER_ADMIN & STAFF full access on purchase_bill_items" ON public.purchase_bill_items;
CREATE POLICY "SUPER_ADMIN & STAFF full access on purchase_bill_items" ON public.purchase_bill_items 
    FOR ALL TO authenticated USING ((select public.get_auth_role()) IN ('SUPER_ADMIN', 'STAFF'));

-- public.payments
DROP POLICY IF EXISTS "SUPER_ADMIN & STAFF full access on payments" ON public.payments;
CREATE POLICY "SUPER_ADMIN & STAFF full access on payments" ON public.payments 
    FOR ALL TO authenticated USING ((select public.get_auth_role()) IN ('SUPER_ADMIN', 'STAFF'));

-- public.stock_transactions
DROP POLICY IF EXISTS "SUPER_ADMIN & STAFF full access on stock_transactions" ON public.stock_transactions;
CREATE POLICY "SUPER_ADMIN & STAFF full access on stock_transactions" ON public.stock_transactions 
    FOR ALL TO authenticated USING ((select public.get_auth_role()) IN ('SUPER_ADMIN', 'STAFF'));

-- public.production_tasks
DROP POLICY IF EXISTS "SUPER_ADMIN & STAFF full access on production_tasks" ON public.production_tasks;
CREATE POLICY "SUPER_ADMIN & STAFF full access on production_tasks" ON public.production_tasks
    FOR ALL TO authenticated USING ((select public.get_auth_role()) IN ('SUPER_ADMIN', 'STAFF'));

-- public.tax_rates
DROP POLICY IF EXISTS "SUPER_ADMIN & STAFF full access on tax_rates" ON public.tax_rates;
CREATE POLICY "SUPER_ADMIN & STAFF full access on tax_rates" ON public.tax_rates
    FOR ALL TO authenticated USING ((select public.get_auth_role()) IN ('SUPER_ADMIN', 'STAFF'));

-- Reload schema cache just in case
NOTIFY pgrst, 'reload';
