-- 016_optimize_customer_balance_view.sql
-- Rewrites the customers_with_balance view to use LEFT JOINs and GROUP BY
-- instead of highly inefficient correlated subqueries.

DROP VIEW IF EXISTS public.customers_with_balance;

CREATE OR REPLACE VIEW public.customers_with_balance AS
SELECT 
    c.*,
    (
        COALESCE(c.opening_balance, 0) +
        COALESCE(si.total_invoiced, 0) -
        COALESCE(r.total_receipts, 0)
    ) as outstanding_balance
FROM public.customers c
LEFT JOIN (
    SELECT customer_id, SUM(total_amount) as total_invoiced
    FROM public.sales_invoices
    WHERE status != 'void'
    GROUP BY customer_id
) si ON si.customer_id = c.customer_id
LEFT JOIN (
    SELECT customer_id, SUM(amount) as total_receipts
    FROM public.receipts
    GROUP BY customer_id
) r ON r.customer_id = c.customer_id;

-- Ensure schema cache is updated
NOTIFY pgrst, 'reload';
