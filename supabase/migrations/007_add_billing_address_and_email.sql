-- Add email column to customers table
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS email text;

-- Add billing_address column to sales_invoices table
ALTER TABLE public.sales_invoices 
ADD COLUMN IF NOT EXISTS billing_address text;
