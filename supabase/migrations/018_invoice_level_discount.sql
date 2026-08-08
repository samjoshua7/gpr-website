-- 018_invoice_level_discount.sql
ALTER TABLE public.sales_invoices ADD COLUMN IF NOT EXISTS discount_amount numeric(12,2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0);
