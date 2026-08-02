-- Add customer snapshot fields to sales_invoices for historical accuracy
ALTER TABLE public.sales_invoices
ADD COLUMN IF NOT EXISTS customer_name text,
ADD COLUMN IF NOT EXISTS customer_gstin text,
ADD COLUMN IF NOT EXISTS shipping_address text;
