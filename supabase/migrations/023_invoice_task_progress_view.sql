-- Migration 023: Invoice Task Progress View

-- 1. Index to make the join below efficient (skip if it already exists)
CREATE INDEX IF NOT EXISTS idx_sales_invoice_items_invoice_id ON public.sales_invoice_items(invoice_id);

-- 2. One row per (invoice, task) pair, for cheap batched progress lookups
CREATE OR REPLACE VIEW public.invoice_task_progress AS
SELECT
    sii.invoice_id,
    pt.task_id,
    pt.product_name,
    pt.status,
    pt.updated_at
FROM public.production_tasks pt
JOIN public.sales_invoice_items sii ON sii.invoice_item_id = pt.invoice_item_id;
