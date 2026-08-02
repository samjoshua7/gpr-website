-- ==========================================
-- 013_fix_workflow_trigger.sql
-- ==========================================

-- 1. EXTEND COMPANY SETTINGS & RECEIPTS FOR NUMBERING
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS receipt_prefix text DEFAULT 'GPR/RCPT/';
ALTER TABLE public.receipts ADD COLUMN IF NOT EXISTS receipt_no text;

-- 2. DYNAMIC WORKFLOW TRIGGER FOR PRODUCTION TASKS
-- The previous trigger hardcoded 'design'. It must now read from company_settings.
CREATE OR REPLACE FUNCTION public.trg_fn_create_production_tasks()
RETURNS TRIGGER AS $$
DECLARE
    inv_job_id uuid;
    inv_delivery text;
    inv_notes text;
    workflow_array text[];
    initial_status text;
BEGIN
    -- Query parent invoice information
    SELECT job_id, delivery_details, notes INTO inv_job_id, inv_delivery, inv_notes
    FROM public.sales_invoices
    WHERE invoice_id = NEW.invoice_id;

    -- Fetch the dynamic workflow array from company settings
    SELECT production_workflow INTO workflow_array
    FROM public.company_settings
    LIMIT 1;

    -- The first step is 'New Orders' (Invoice Creation phase)
    -- The second step is where the production task begins.
    -- Arrays in PostgreSQL are 1-indexed.
    IF array_length(workflow_array, 1) >= 2 THEN
        initial_status := workflow_array[2];
    ELSE
        -- Fallback if the workflow is malformed
        initial_status := 'design';
    END IF;

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
        initial_status,
        NEW.quantity,
        inv_notes,
        inv_delivery
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
