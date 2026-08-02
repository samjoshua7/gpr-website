-- Add invoice_type and customer_type to sales_invoices
ALTER TABLE public.sales_invoices 
ADD COLUMN IF NOT EXISTS invoice_type text NOT NULL DEFAULT 'NON_GST' CHECK (invoice_type IN ('NON_GST', 'GST')),
ADD COLUMN IF NOT EXISTS customer_type text CHECK (customer_type IN ('B2C', 'B2B'));
