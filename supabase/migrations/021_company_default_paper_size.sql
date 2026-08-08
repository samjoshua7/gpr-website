-- 021_company_default_paper_size.sql
ALTER TABLE public.company_settings
  ADD COLUMN IF NOT EXISTS default_invoice_paper_size text NOT NULL DEFAULT 'A4'
  CHECK (default_invoice_paper_size IN ('A4', 'A5'));
