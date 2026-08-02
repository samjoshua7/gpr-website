-- ==========================================
-- 012_roadmap_update.sql
-- ==========================================

-- 1. Extend Employees Table
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS role text;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS departments text[] DEFAULT '{}';

-- 2. Extend Company Settings for Dynamic Workflow
ALTER TABLE public.company_settings 
ADD COLUMN IF NOT EXISTS production_workflow text[] 
DEFAULT ARRAY[
  'New Orders', 
  'Designing', 
  'Proof', 
  'Printing', 
  'Additional works', 
  'Cutting', 
  'Packing', 
  'Out for Delivery', 
  'Delivered'
];

-- 3. Remove hardcoded CHECK constraint on production_tasks status
-- Since production_tasks.status is now dynamic based on company_settings.production_workflow, 
-- we must drop the existing hardcoded constraint.
DO $$
DECLARE
    constraint_name text;
BEGIN
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'public.production_tasks'::regclass
      AND contype = 'c'
      AND conname LIKE '%status%';

    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.production_tasks DROP CONSTRAINT ' || quote_ident(constraint_name);
    END IF;
END $$;
