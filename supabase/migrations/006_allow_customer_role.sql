-- Update users table role constraint to support CUSTOMER role
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check CHECK (role IN ('SUPER_ADMIN', 'STAFF', 'CUSTOMER'));
