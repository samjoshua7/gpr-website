-- 019_invoice_item_product_name.sql
ALTER TABLE public.sales_invoice_items ADD COLUMN IF NOT EXISTS product_name text;

-- Backfill: for existing rows, copy description into product_name so nothing renders blank
UPDATE public.sales_invoice_items SET product_name = description WHERE product_name IS NULL;
