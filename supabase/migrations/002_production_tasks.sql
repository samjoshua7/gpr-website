-- G.P.R. Printing Press Workflow Revision Migration
-- Order:
-- 1. Alter job_cards to make customer_id nullable
-- 2. Alter sales_invoices to add tax, gst, notes, and delivery columns
-- 3. Create production_tasks table & configure RLS
-- 4. Create trigger to automatically spawn production_tasks from sales_invoice_items

-- ==========================================
-- 1. ALTER JOB_CARDS
-- ==========================================
ALTER TABLE public.job_cards ALTER COLUMN customer_id DROP NOT NULL;

-- ==========================================
-- 2. ALTER SALES_INVOICES
-- ==========================================
ALTER TABLE public.sales_invoices ADD COLUMN IF NOT EXISTS tax_amount numeric(12,2) DEFAULT 0.00 CHECK (tax_amount >= 0);
ALTER TABLE public.sales_invoices ADD COLUMN IF NOT EXISTS gst_amount numeric(12,2) DEFAULT 0.00 CHECK (gst_amount >= 0);
ALTER TABLE public.sales_invoices ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.sales_invoices ADD COLUMN IF NOT EXISTS delivery_details text;

-- ==========================================
-- 3. CREATE PRODUCTION_TASKS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.production_tasks (
    task_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_item_id uuid NOT NULL REFERENCES public.sales_invoice_items(invoice_item_id) ON DELETE CASCADE,
    job_id uuid REFERENCES public.job_cards(job_id) ON DELETE SET NULL,
    product_name text NOT NULL,
    status text NOT NULL DEFAULT 'design' CHECK (status IN ('design', 'printing', 'finishing', 'delivered')),
    quantity numeric(12,2) NOT NULL CHECK (quantity > 0),
    notes text,
    delivery_details text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_production_tasks_status ON public.production_tasks(status);
CREATE INDEX IF NOT EXISTS idx_production_tasks_job ON public.production_tasks(job_id);

-- Enable RLS
ALTER TABLE public.production_tasks ENABLE ROW LEVEL SECURITY;

-- Dynamic Role Resolver Policies (SUPER_ADMIN and STAFF full CRUD)
CREATE POLICY "SUPER_ADMIN & STAFF full access on production_tasks" ON public.production_tasks
    FOR ALL TO authenticated USING (get_auth_role() IN ('SUPER_ADMIN', 'STAFF'));

-- Register auto timestamp trigger
CREATE TRIGGER trigger_update_timestamp_production_tasks
BEFORE UPDATE ON public.production_tasks
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- ==========================================
-- 4. TRIGGER FUNCTION FOR PRODUCTION TASKS
-- ==========================================
CREATE OR REPLACE FUNCTION public.trg_fn_create_production_tasks()
RETURNS TRIGGER AS $$
DECLARE
    inv_job_id uuid;
    inv_delivery text;
    inv_notes text;
BEGIN
    -- Query parent invoice information
    SELECT job_id, delivery_details, notes INTO inv_job_id, inv_delivery, inv_notes
    FROM public.sales_invoices
    WHERE invoice_id = NEW.invoice_id;

    -- Automatically create corresponding production task
    INSERT INTO public.production_tasks (
        invoice_item_id,
        job_id,
        product_name,
        status,
        quantity,
        notes,
        delivery_details
    ) VALUES (
        NEW.invoice_item_id,
        inv_job_id,
        NEW.description,
        'design', -- Default production stage is design
        NEW.quantity,
        inv_notes,
        inv_delivery
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trg_create_production_tasks
AFTER INSERT ON public.sales_invoice_items
FOR EACH ROW
EXECUTE FUNCTION public.trg_fn_create_production_tasks();
