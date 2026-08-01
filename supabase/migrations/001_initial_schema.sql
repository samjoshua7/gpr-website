-- G.P.R. Printing Press Initial Schema Migration
-- Order:
-- 1. Base Tables
-- 2. Transactional Tables
-- 3. Child Tables (Line Items)
-- 4. Indexes
-- 5. Functions & Triggers
-- 6. Row Level Security

-- ==========================================
-- 1. BASE TABLES
-- ==========================================

-- Users Profile table linked to auth.users
CREATE TABLE IF NOT EXISTS public.users (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role text NOT NULL CHECK (role IN ('SUPER_ADMIN', 'STAFF')),
    name text NOT NULL,
    email text NOT NULL UNIQUE,
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Employees table
CREATE TABLE IF NOT EXISTS public.employees (
    employee_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    name text NOT NULL,
    phone text,
    joined_date date,
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Customers table
CREATE TABLE IF NOT EXISTS public.customers (
    customer_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    name text NOT NULL,
    phone text,
    address text,
    opening_balance numeric(12,2) NOT NULL DEFAULT 0.00 CHECK (opening_balance >= 0),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Suppliers table
CREATE TABLE IF NOT EXISTS public.suppliers (
    supplier_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    phone text,
    address text,
    opening_balance numeric(12,2) NOT NULL DEFAULT 0.00 CHECK (opening_balance >= 0),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Items (Inventory Catalog)
CREATE TABLE IF NOT EXISTS public.items (
    item_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    unit text NOT NULL, -- e.g., sheet, ream, kg
    current_stock numeric(12,2) NOT NULL DEFAULT 0.00,
    reorder_level numeric(12,2) NOT NULL DEFAULT 0.00 CHECK (reorder_level >= 0),
    unit_price numeric(12,2) NOT NULL DEFAULT 0.00 CHECK (unit_price >= 0),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Company Settings
CREATE TABLE IF NOT EXISTS public.company_settings (
    setting_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name text NOT NULL,
    address text,
    gstin text,
    invoice_prefix text NOT NULL DEFAULT 'INV',
    financial_year_start date NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- ==========================================
-- 2. TRANSACTIONAL TABLES
-- ==========================================

-- Job Cards
CREATE TABLE IF NOT EXISTS public.job_cards (
    job_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id uuid NOT NULL REFERENCES public.customers(customer_id) ON DELETE RESTRICT,
    description text NOT NULL,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'delivered')),
    quantity numeric(12,2) NOT NULL CHECK (quantity > 0),
    created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
    due_date date,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Sales Invoices
CREATE TABLE IF NOT EXISTS public.sales_invoices (
    invoice_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id uuid NOT NULL REFERENCES public.customers(customer_id) ON DELETE RESTRICT,
    job_id uuid REFERENCES public.job_cards(job_id) ON DELETE SET NULL,
    invoice_no text NOT NULL UNIQUE,
    invoice_date date NOT NULL,
    total_amount numeric(12,2) NOT NULL DEFAULT 0.00 CHECK (total_amount >= 0),
    amount_paid numeric(12,2) NOT NULL DEFAULT 0.00 CHECK (amount_paid >= 0),
    status text NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'partial', 'paid', 'void')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Receipts (Customer payments)
CREATE TABLE IF NOT EXISTS public.receipts (
    receipt_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id uuid NOT NULL REFERENCES public.customers(customer_id) ON DELETE RESTRICT,
    invoice_id uuid REFERENCES public.sales_invoices(invoice_id) ON DELETE SET NULL,
    amount numeric(12,2) NOT NULL CHECK (amount > 0),
    receipt_date date NOT NULL,
    mode text NOT NULL CHECK (mode IN ('cash', 'upi', 'bank')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Purchase Bills (Suppliers bills)
CREATE TABLE IF NOT EXISTS public.purchase_bills (
    bill_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id uuid NOT NULL REFERENCES public.suppliers(supplier_id) ON DELETE RESTRICT,
    bill_no text NOT NULL,
    bill_date date NOT NULL,
    total_amount numeric(12,2) NOT NULL DEFAULT 0.00 CHECK (total_amount >= 0),
    amount_paid numeric(12,2) NOT NULL DEFAULT 0.00 CHECK (amount_paid >= 0),
    status text NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'partial', 'paid', 'void')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (supplier_id, bill_no)
);

-- Payments (Supplier payments)
CREATE TABLE IF NOT EXISTS public.payments (
    payment_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id uuid NOT NULL REFERENCES public.suppliers(supplier_id) ON DELETE RESTRICT,
    bill_id uuid REFERENCES public.purchase_bills(bill_id) ON DELETE SET NULL,
    amount numeric(12,2) NOT NULL CHECK (amount > 0),
    payment_date date NOT NULL,
    mode text NOT NULL CHECK (mode IN ('cash', 'upi', 'bank')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Stock Transactions ( Authoritative Inventory Ledger )
CREATE TABLE IF NOT EXISTS public.stock_transactions (
    txn_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id uuid NOT NULL REFERENCES public.items(item_id) ON DELETE CASCADE,
    type text NOT NULL CHECK (type IN ('in', 'out')),
    quantity numeric(12,2) NOT NULL CHECK (quantity > 0),
    reference_type text NOT NULL CHECK (reference_type IN ('job_card', 'purchase', 'manual')),
    reference_id uuid,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- ==========================================
-- 3. CHILD TABLES (LINE ITEMS)
-- ==========================================

-- Job Card Items (Materials consumed by jobs)
CREATE TABLE IF NOT EXISTS public.job_card_items (
    job_id uuid NOT NULL REFERENCES public.job_cards(job_id) ON DELETE CASCADE,
    item_id uuid NOT NULL REFERENCES public.items(item_id) ON DELETE RESTRICT,
    quantity_used numeric(12,2) NOT NULL CHECK (quantity_used > 0),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (job_id, item_id)
);

-- Sales Invoice Line Items
CREATE TABLE IF NOT EXISTS public.sales_invoice_items (
    invoice_item_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id uuid NOT NULL REFERENCES public.sales_invoices(invoice_id) ON DELETE CASCADE,
    description text NOT NULL,
    quantity numeric(12,2) NOT NULL CHECK (quantity > 0),
    unit_price numeric(12,2) NOT NULL CHECK (unit_price >= 0),
    amount numeric(12,2) NOT NULL CHECK (amount >= 0),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Purchase Bill Line Items
CREATE TABLE IF NOT EXISTS public.purchase_bill_items (
    bill_item_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_id uuid NOT NULL REFERENCES public.purchase_bills(bill_id) ON DELETE CASCADE,
    item_id uuid NOT NULL REFERENCES public.items(item_id) ON DELETE RESTRICT,
    quantity numeric(12,2) NOT NULL CHECK (quantity > 0),
    unit_price numeric(12,2) NOT NULL CHECK (unit_price >= 0),
    amount numeric(12,2) NOT NULL CHECK (amount >= 0),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- ==========================================
-- 4. INDEXES
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_customers_name ON public.customers(name);
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON public.suppliers(name);
CREATE INDEX IF NOT EXISTS idx_items_name ON public.items(name);
CREATE INDEX IF NOT EXISTS idx_job_cards_customer_status_due ON public.job_cards(customer_id, status, due_date);
CREATE INDEX IF NOT EXISTS idx_sales_invoices_customer_date_status ON public.sales_invoices(customer_id, invoice_date, status);
CREATE INDEX IF NOT EXISTS idx_receipts_customer_date ON public.receipts(customer_id, receipt_date);
CREATE INDEX IF NOT EXISTS idx_purchase_bills_supplier_date_status ON public.purchase_bills(supplier_id, bill_date, status);
CREATE INDEX IF NOT EXISTS idx_payments_supplier_date ON public.payments(supplier_id, payment_date);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_item_created ON public.stock_transactions(item_id, created_at);
CREATE INDEX IF NOT EXISTS idx_sales_invoice_items_invoice ON public.sales_invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_purchase_bill_items_bill ON public.purchase_bill_items(bill_id);

-- ==========================================
-- 5. FUNCTIONS & TRIGGERS
-- ==========================================

-- A. Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
    LOOP
        EXECUTE format('
            CREATE OR REPLACE TRIGGER trigger_update_timestamp_%I
            BEFORE UPDATE ON public.%I
            FOR EACH ROW
            EXECUTE FUNCTION public.handle_updated_at();
        ', t, t);
    END LOOP;
END;
$$;

-- B. Sync Item stock from stock_transactions
CREATE OR REPLACE FUNCTION public.sync_item_stock(target_item_id uuid)
RETURNS numeric(12,2) AS $$
DECLARE
    net_stock numeric(12,2) := 0.00;
BEGIN
    -- Sum "in" transactions
    SELECT COALESCE(SUM(quantity), 0.00) INTO net_stock
    FROM public.stock_transactions
    WHERE item_id = target_item_id AND type = 'in';

    -- Subtract "out" transactions
    SELECT net_stock - COALESCE(SUM(quantity), 0.00) INTO net_stock
    FROM public.stock_transactions
    WHERE item_id = target_item_id AND type = 'out';

    -- Enforce non-negative stock constraint
    IF net_stock < 0 THEN
        RAISE EXCEPTION 'Negative stock level is not allowed for item %.', target_item_id;
    END IF;

    -- Cache the stock value in items table
    UPDATE public.items
    SET current_stock = net_stock
    WHERE item_id = target_item_id;

    RETURN net_stock;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for stock transactions
CREATE OR REPLACE FUNCTION public.trg_fn_stock_transaction_sync()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        PERFORM public.sync_item_stock(NEW.item_id);
        -- If item_id changed in an update, sync the old one as well
        IF TG_OP = 'UPDATE' AND OLD.item_id <> NEW.item_id THEN
            PERFORM public.sync_item_stock(OLD.item_id);
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM public.sync_item_stock(OLD.item_id);
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_stock_transaction_sync
AFTER INSERT OR UPDATE OR DELETE ON public.stock_transactions
FOR EACH ROW
EXECUTE FUNCTION public.trg_fn_stock_transaction_sync();


-- C. Recalculate Invoice Status & Amount Paid from Receipts
CREATE OR REPLACE FUNCTION public.recalculate_invoice_status(target_invoice_id uuid)
RETURNS void AS $$
DECLARE
    total_paid numeric(12,2) := 0.00;
    inv_total numeric(12,2) := 0.00;
    inv_status text := 'unpaid';
BEGIN
    -- Fetch invoice total
    SELECT total_amount, status INTO inv_total, inv_status
    FROM public.sales_invoices
    WHERE invoice_id = target_invoice_id;

    -- If invoice is void, don't change status, just calculate payments
    IF inv_status = 'void' THEN
        SELECT COALESCE(SUM(amount), 0.00) INTO total_paid
        FROM public.receipts
        WHERE invoice_id = target_invoice_id;

        UPDATE public.sales_invoices
        SET amount_paid = total_paid
        WHERE invoice_id = target_invoice_id;
        RETURN;
    END IF;

    -- Calculate total payments received
    SELECT COALESCE(SUM(amount), 0.00) INTO total_paid
    FROM public.receipts
    WHERE invoice_id = target_invoice_id;

    -- Determine new status
    IF total_paid = 0.00 THEN
        inv_status := 'unpaid';
    ELSIF total_paid >= inv_total THEN
        inv_status := 'paid';
    ELSE
        inv_status := 'partial';
    END IF;

    -- Update invoice
    UPDATE public.sales_invoices
    SET amount_paid = total_paid,
        status = inv_status
    WHERE invoice_id = target_invoice_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for receipts
CREATE OR REPLACE FUNCTION public.trg_fn_receipts_sync()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        IF NEW.invoice_id IS NOT NULL THEN
            PERFORM public.recalculate_invoice_status(NEW.invoice_id);
        END IF;
        -- If invoice_id changed, sync the old one as well
        IF TG_OP = 'UPDATE' AND OLD.invoice_id IS NOT NULL AND OLD.invoice_id <> NEW.invoice_id THEN
            PERFORM public.recalculate_invoice_status(OLD.invoice_id);
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.invoice_id IS NOT NULL THEN
            PERFORM public.recalculate_invoice_status(OLD.invoice_id);
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_receipts_sync
AFTER INSERT OR UPDATE OR DELETE ON public.receipts
FOR EACH ROW
EXECUTE FUNCTION public.trg_fn_receipts_sync();


-- D. Recalculate Purchase Bill Status & Amount Paid from Payments
CREATE OR REPLACE FUNCTION public.recalculate_bill_status(target_bill_id uuid)
RETURNS void AS $$
DECLARE
    total_paid numeric(12,2) := 0.00;
    bill_total numeric(12,2) := 0.00;
    bill_status text := 'unpaid';
BEGIN
    -- Fetch bill total
    SELECT total_amount, status INTO bill_total, bill_status
    FROM public.purchase_bills
    WHERE bill_id = target_bill_id;

    -- If bill is void, don't change status, just calculate payments
    IF bill_status = 'void' THEN
        SELECT COALESCE(SUM(amount), 0.00) INTO total_paid
        FROM public.payments
        WHERE bill_id = target_bill_id;

        UPDATE public.purchase_bills
        SET amount_paid = total_paid
        WHERE bill_id = target_bill_id;
        RETURN;
    END IF;

    -- Calculate total payments sent
    SELECT COALESCE(SUM(amount), 0.00) INTO total_paid
    FROM public.payments
    WHERE bill_id = target_bill_id;

    -- Determine new status
    IF total_paid = 0.00 THEN
        bill_status := 'unpaid';
    ELSIF total_paid >= bill_total THEN
        bill_status := 'paid';
    ELSE
        bill_status := 'partial';
    END IF;

    -- Update bill
    UPDATE public.purchase_bills
    SET amount_paid = total_paid,
        status = bill_status
    WHERE bill_id = target_bill_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for payments
CREATE OR REPLACE FUNCTION public.trg_fn_payments_sync()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        IF NEW.bill_id IS NOT NULL THEN
            PERFORM public.recalculate_bill_status(NEW.bill_id);
        END IF;
        -- If bill_id changed, sync the old one as well
        IF TG_OP = 'UPDATE' AND OLD.bill_id IS NOT NULL AND OLD.bill_id <> NEW.bill_id THEN
            PERFORM public.recalculate_bill_status(OLD.bill_id);
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.bill_id IS NOT NULL THEN
            PERFORM public.recalculate_bill_status(OLD.bill_id);
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_payments_sync
AFTER INSERT OR UPDATE OR DELETE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.trg_fn_payments_sync();


-- E. Prevent Hard Deletes of Finalized Financial Records
CREATE OR REPLACE FUNCTION public.prevent_hard_delete_finalized()
RETURNS TRIGGER AS $$
BEGIN
    -- Financial records cannot be hard deleted once finalized (i.e. status is paid, partial, or void)
    -- They can only be voided or cancelled via status updates.
    IF OLD.status IN ('paid', 'partial', 'void') THEN
        RAISE EXCEPTION 'Cannot delete finalized financial document % (status: %). Void it instead.', OLD.invoice_id, OLD.status;
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_invoice_hard_delete
BEFORE DELETE ON public.sales_invoices
FOR EACH ROW
EXECUTE FUNCTION public.prevent_hard_delete_finalized();

-- Similarly for purchase bills
CREATE OR REPLACE FUNCTION public.prevent_bill_hard_delete_finalized()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IN ('paid', 'partial', 'void') THEN
        RAISE EXCEPTION 'Cannot delete finalized purchase bill % (status: %). Void it instead.', OLD.bill_id, OLD.status;
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_bill_hard_delete
BEFORE DELETE ON public.purchase_bills
FOR EACH ROW
EXECUTE FUNCTION public.prevent_bill_hard_delete_finalized();

-- ==========================================
-- 6. ROW LEVEL SECURITY
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_card_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_bill_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_transactions ENABLE ROW LEVEL SECURITY;

-- Dynamic Role Resolver Function (Bypasses Recursion by not querying public.users when accessing users table itself)
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS text AS $$
    -- Check if the cache exists or query the database once
    SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- policies for public.users
CREATE POLICY "Allow authenticated read users" ON public.users 
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow SUPER_ADMIN full CRUD on users" ON public.users 
    FOR ALL TO authenticated USING (get_auth_role() = 'SUPER_ADMIN');

-- policies for employees
CREATE POLICY "SUPER_ADMIN full access on employees" ON public.employees 
    FOR ALL TO authenticated USING (get_auth_role() = 'SUPER_ADMIN');

CREATE POLICY "STAFF read access on employees" ON public.employees 
    FOR SELECT TO authenticated USING (get_auth_role() = 'STAFF');

-- policies for customers
CREATE POLICY "SUPER_ADMIN & STAFF full access on customers" ON public.customers 
    FOR ALL TO authenticated USING (get_auth_role() IN ('SUPER_ADMIN', 'STAFF'));

CREATE POLICY "CUSTOMER read-only access to own customer record" ON public.customers 
    FOR SELECT TO authenticated USING (user_id = auth.uid());

-- policies for suppliers
CREATE POLICY "SUPER_ADMIN & STAFF full access on suppliers" ON public.suppliers 
    FOR ALL TO authenticated USING (get_auth_role() IN ('SUPER_ADMIN', 'STAFF'));

-- policies for items
CREATE POLICY "SUPER_ADMIN & STAFF full access on items" ON public.items 
    FOR ALL TO authenticated USING (get_auth_role() IN ('SUPER_ADMIN', 'STAFF'));

-- policies for company_settings
CREATE POLICY "SUPER_ADMIN full access on company_settings" ON public.company_settings 
    FOR ALL TO authenticated USING (get_auth_role() = 'SUPER_ADMIN');

CREATE POLICY "STAFF read access on company_settings" ON public.company_settings 
    FOR SELECT TO authenticated USING (get_auth_role() = 'STAFF');

-- policies for job_cards
CREATE POLICY "SUPER_ADMIN & STAFF full access on job_cards" ON public.job_cards 
    FOR ALL TO authenticated USING (get_auth_role() IN ('SUPER_ADMIN', 'STAFF'));

CREATE POLICY "CUSTOMER read own job_cards" ON public.job_cards 
    FOR SELECT TO authenticated USING (
        customer_id IN (SELECT customer_id FROM public.customers WHERE user_id = auth.uid())
    );

-- policies for job_card_items
CREATE POLICY "SUPER_ADMIN & STAFF full access on job_card_items" ON public.job_card_items 
    FOR ALL TO authenticated USING (get_auth_role() IN ('SUPER_ADMIN', 'STAFF'));

CREATE POLICY "CUSTOMER read own job_card_items" ON public.job_card_items 
    FOR SELECT TO authenticated USING (
        job_id IN (
            SELECT job_id FROM public.job_cards 
            WHERE customer_id IN (SELECT customer_id FROM public.customers WHERE user_id = auth.uid())
        )
    );

-- policies for sales_invoices
CREATE POLICY "SUPER_ADMIN & STAFF full access on sales_invoices" ON public.sales_invoices 
    FOR ALL TO authenticated USING (get_auth_role() IN ('SUPER_ADMIN', 'STAFF'));

CREATE POLICY "CUSTOMER read own sales_invoices" ON public.sales_invoices 
    FOR SELECT TO authenticated USING (
        customer_id IN (SELECT customer_id FROM public.customers WHERE user_id = auth.uid())
    );

-- policies for sales_invoice_items
CREATE POLICY "SUPER_ADMIN & STAFF full access on sales_invoice_items" ON public.sales_invoice_items 
    FOR ALL TO authenticated USING (get_auth_role() IN ('SUPER_ADMIN', 'STAFF'));

CREATE POLICY "CUSTOMER read own sales_invoice_items" ON public.sales_invoice_items 
    FOR SELECT TO authenticated USING (
        invoice_id IN (
            SELECT invoice_id FROM public.sales_invoices 
            WHERE customer_id IN (SELECT customer_id FROM public.customers WHERE user_id = auth.uid())
        )
    );

-- policies for receipts
CREATE POLICY "SUPER_ADMIN & STAFF full access on receipts" ON public.receipts 
    FOR ALL TO authenticated USING (get_auth_role() IN ('SUPER_ADMIN', 'STAFF'));

CREATE POLICY "CUSTOMER read own receipts" ON public.receipts 
    FOR SELECT TO authenticated USING (
        customer_id IN (SELECT customer_id FROM public.customers WHERE user_id = auth.uid())
    );

-- policies for purchase_bills & purchase_bill_items & payments & stock_transactions (operational/backoffice only)
CREATE POLICY "SUPER_ADMIN & STAFF full access on purchase_bills" ON public.purchase_bills 
    FOR ALL TO authenticated USING (get_auth_role() IN ('SUPER_ADMIN', 'STAFF'));

CREATE POLICY "SUPER_ADMIN & STAFF full access on purchase_bill_items" ON public.purchase_bill_items 
    FOR ALL TO authenticated USING (get_auth_role() IN ('SUPER_ADMIN', 'STAFF'));

CREATE POLICY "SUPER_ADMIN & STAFF full access on payments" ON public.payments 
    FOR ALL TO authenticated USING (get_auth_role() IN ('SUPER_ADMIN', 'STAFF'));

CREATE POLICY "SUPER_ADMIN & STAFF full access on stock_transactions" ON public.stock_transactions 
    FOR ALL TO authenticated USING (get_auth_role() IN ('SUPER_ADMIN', 'STAFF'));

-- ==========================================
-- 7. AUTH TRIGGER (PROFILE SYNCHRONIZATION)
-- ==========================================

-- Trigger to auto-create user profile in public.users on auth.users registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, role, name, email, active)
    VALUES (
        NEW.id,
        'STAFF', -- Default role
        COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
        NEW.email,
        false -- Default inactive to prevent self-registration access
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

