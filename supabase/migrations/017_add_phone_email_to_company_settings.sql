-- 017_add_phone_email_to_company_settings.sql
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS email text;

-- Ensure schema cache is updated
NOTIFY pgrst, 'reload';
