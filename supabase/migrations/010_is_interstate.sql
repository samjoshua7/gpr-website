ALTER TABLE public.sales_invoices ADD COLUMN IF NOT EXISTS is_interstate boolean DEFAULT false;
