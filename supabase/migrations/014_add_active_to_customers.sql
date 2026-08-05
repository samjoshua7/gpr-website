-- 014_add_active_to_customers.sql
-- Add active column to customers table for soft deletion / archiving

ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;
