-- Update production_tasks status constraint to cover all Kanban stages
ALTER TABLE public.production_tasks DROP CONSTRAINT IF EXISTS production_tasks_status_check;
ALTER TABLE public.production_tasks ADD CONSTRAINT production_tasks_status_check 
    CHECK (status IN ('design', 'printing', 'finishing', 'packing', 'ready', 'delivered'));
