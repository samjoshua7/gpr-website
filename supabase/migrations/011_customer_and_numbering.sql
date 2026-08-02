-- 011_customer_and_numbering.sql
-- 1. Add identification_name to customers
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS identification_name text;

-- 2. Add sequential numbering to job_cards
ALTER TABLE public.job_cards ADD COLUMN IF NOT EXISTS job_number integer GENERATED ALWAYS AS IDENTITY;
-- Add a unique constraint to ensure no duplicates
ALTER TABLE public.job_cards ADD CONSTRAINT uq_job_cards_job_number UNIQUE (job_number);

-- 3. Add sequential numbering to production_tasks
ALTER TABLE public.production_tasks ADD COLUMN IF NOT EXISTS task_number integer GENERATED ALWAYS AS IDENTITY;
-- Add a unique constraint to ensure no duplicates
ALTER TABLE public.production_tasks ADD CONSTRAINT uq_production_tasks_task_number UNIQUE (task_number);
