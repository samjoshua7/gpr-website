-- 024_company_upi_payment_settings.sql
-- Add dynamic UPI QR and Bank Details configuration to company_settings

ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS upi_enabled boolean DEFAULT true;
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS upi_mode text DEFAULT 'upi_id'; -- 'upi_id' or 'bank_account'
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS upi_id text; -- e.g. 9876543210@upi or gprprinters@okaxis
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS upi_phone text; -- e.g. 9876543210
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS bank_name text; -- e.g. State Bank of India
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS bank_account_no text; -- e.g. 123456789012
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS bank_ifsc text; -- e.g. SBIN0001234
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS bank_branch text; -- e.g. Tirunelveli
