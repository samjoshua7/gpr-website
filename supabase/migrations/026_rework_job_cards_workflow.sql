-- ==============================================================================
-- Migration 026: Rework Job Cards Workflow & Remove Multi-Task Fracture
-- ==============================================================================

-- 1. Remove hardcoded status check constraints on job_cards to support dynamic departments
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'public.job_cards'::regclass
          AND contype = 'c'
          AND conname LIKE '%status%'
    ) LOOP
        EXECUTE 'ALTER TABLE public.job_cards DROP CONSTRAINT ' || quote_ident(r.conname);
    END LOOP;
END $$;

-- 2. Set default status of job_cards to 'New Orders'
ALTER TABLE public.job_cards ALTER COLUMN status SET DEFAULT 'New Orders';

-- 3. Migrate existing legacy status values on job_cards
UPDATE public.job_cards
SET status = 'New Orders'
WHERE status = 'pending' OR status IS NULL;

UPDATE public.job_cards
SET status = 'Designing'
WHERE status = 'in_progress';

UPDATE public.job_cards
SET status = 'Delivered'
WHERE status = 'completed' OR status = 'delivered';

-- 4. Ensure optimal indexes on job_cards and sales_invoices
CREATE INDEX IF NOT EXISTS idx_job_cards_status ON public.job_cards(status);
CREATE INDEX IF NOT EXISTS idx_sales_invoices_job_id ON public.sales_invoices(job_id);

-- 5. Drop legacy per-line-item production tasks trigger on sales_invoice_items
DROP TRIGGER IF EXISTS trg_create_production_tasks ON public.sales_invoice_items;

-- 6. Reload schema cache for PostgREST
NOTIFY pgrst, 'reload';
