-- Add GST columns to Customers, Items, and Sales Invoice Line Items
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS gstin text;

ALTER TABLE public.items ADD COLUMN IF NOT EXISTS default_gst_rate numeric(5,2) DEFAULT 0.00;
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS hsn_code text;

ALTER TABLE public.sales_invoice_items ADD COLUMN IF NOT EXISTS item_id uuid REFERENCES public.items(item_id) ON DELETE RESTRICT;
ALTER TABLE public.sales_invoice_items ADD COLUMN IF NOT EXISTS discount_amount numeric(12,2) DEFAULT 0.00;
ALTER TABLE public.sales_invoice_items ADD COLUMN IF NOT EXISTS gst_rate numeric(5,2) DEFAULT 0.00;
ALTER TABLE public.sales_invoice_items ADD COLUMN IF NOT EXISTS tax_amount numeric(12,2) DEFAULT 0.00;
ALTER TABLE public.sales_invoice_items ADD COLUMN IF NOT EXISTS hsn_code text;
