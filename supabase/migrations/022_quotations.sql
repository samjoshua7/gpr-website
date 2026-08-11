-- Migration 022: Quotations and Quotation Line Items

-- 1. Create quotations table
CREATE TABLE IF NOT EXISTS public.quotations (
    quotation_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_no text NOT NULL UNIQUE,
    customer_id uuid REFERENCES public.customers(customer_id) ON DELETE RESTRICT,
    quotation_date date NOT NULL DEFAULT CURRENT_DATE,
    invoice_type text DEFAULT 'GST' CHECK (invoice_type IN ('GST', 'NON_GST')),
    customer_type text,
    is_interstate boolean DEFAULT false,
    customer_name text,
    customer_gstin text,
    billing_address text,
    shipping_address text,
    total_amount numeric(12,2) NOT NULL DEFAULT 0.00 CHECK (total_amount >= 0),
    tax_amount numeric(12,2) NOT NULL DEFAULT 0.00 CHECK (tax_amount >= 0),
    gst_amount numeric(12,2) NOT NULL DEFAULT 0.00 CHECK (gst_amount >= 0),
    discount_amount numeric(12,2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
    notes text,
    delivery_details text,
    status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'converted', 'expired')),
    converted_invoice_id uuid REFERENCES public.sales_invoices(invoice_id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Create quotation_items table
CREATE TABLE IF NOT EXISTS public.quotation_items (
    quotation_item_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_id uuid NOT NULL REFERENCES public.quotations(quotation_id) ON DELETE CASCADE,
    product_name text,
    description text NOT NULL,
    quantity numeric(12,2) NOT NULL CHECK (quantity > 0),
    unit_price numeric(12,2) NOT NULL CHECK (unit_price >= 0),
    discount_amount numeric(12,2) DEFAULT 0.00 CHECK (discount_amount >= 0),
    gst_rate numeric(5,2) DEFAULT 0.00 CHECK (gst_rate >= 0),
    tax_amount numeric(12,2) DEFAULT 0.00 CHECK (tax_amount >= 0),
    amount numeric(12,2) NOT NULL CHECK (amount >= 0),
    hsn_code text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_quotations_customer_date ON public.quotations(customer_id, quotation_date);
CREATE INDEX IF NOT EXISTS idx_quotation_items_quotation_id ON public.quotation_items(quotation_id);

-- 4. Enable Row Level Security
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_items ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
DROP POLICY IF EXISTS "SUPER_ADMIN & STAFF full access on quotations" ON public.quotations;
CREATE POLICY "SUPER_ADMIN & STAFF full access on quotations" ON public.quotations
    FOR ALL TO authenticated USING ((select public.get_auth_role()) IN ('SUPER_ADMIN', 'STAFF'));

DROP POLICY IF EXISTS "CUSTOMER read own quotations" ON public.quotations;
CREATE POLICY "CUSTOMER read own quotations" ON public.quotations
    FOR SELECT TO authenticated USING (
        customer_id IN (SELECT customer_id FROM public.customers WHERE user_id = (select auth.uid()))
    );

DROP POLICY IF EXISTS "SUPER_ADMIN & STAFF full access on quotation_items" ON public.quotation_items;
CREATE POLICY "SUPER_ADMIN & STAFF full access on quotation_items" ON public.quotation_items
    FOR ALL TO authenticated USING ((select public.get_auth_role()) IN ('SUPER_ADMIN', 'STAFF'));

DROP POLICY IF EXISTS "CUSTOMER read own quotation_items" ON public.quotation_items;
CREATE POLICY "CUSTOMER read own quotation_items" ON public.quotation_items
    FOR SELECT TO authenticated USING (
        quotation_id IN (
            SELECT quotation_id FROM public.quotations
            WHERE customer_id IN (SELECT customer_id FROM public.customers WHERE user_id = (select auth.uid()))
        )
    );
