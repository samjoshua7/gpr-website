-- ==============================================================================
-- Migration 028: Enforce Strict 1-to-1 Link between Sales Invoice and Job Card
-- ==============================================================================

-- If any duplicate links exist, keep only the latest invoice linked to each job card
WITH duplicates AS (
    SELECT invoice_id,
           ROW_NUMBER() OVER (PARTITION BY job_id ORDER BY created_at DESC) as rnum
    FROM public.sales_invoices
    WHERE job_id IS NOT NULL
)
UPDATE public.sales_invoices
SET job_id = NULL
WHERE invoice_id IN (
    SELECT invoice_id FROM duplicates WHERE rnum > 1
);

-- Create a unique partial index to enforce strictly 1 invoice per job card at database level
CREATE UNIQUE INDEX IF NOT EXISTS uq_sales_invoices_job_id
ON public.sales_invoices (job_id)
WHERE job_id IS NOT NULL;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload';
