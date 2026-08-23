-- ==============================================================================
-- Migration 027: Recover Historical Job Card Department Stages
-- ==============================================================================

-- Restore the latest department stage from production_tasks for each job card
UPDATE public.job_cards jc
SET status = pt.status
FROM (
    SELECT DISTINCT ON (job_id) job_id, status
    FROM public.production_tasks
    WHERE job_id IS NOT NULL 
      AND status IS NOT NULL 
      AND status != ''
    ORDER BY job_id, updated_at DESC, created_at DESC
) pt
WHERE jc.job_id = pt.job_id;

-- Reload schema cache for PostgREST
NOTIFY pgrst, 'reload';
