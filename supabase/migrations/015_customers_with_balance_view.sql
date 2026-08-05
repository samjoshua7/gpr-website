CREATE OR REPLACE VIEW public.customers_with_balance AS
SELECT 
    c.*,
    (
        COALESCE(c.opening_balance, 0) +
        COALESCE((
            SELECT SUM(total_amount)
            FROM public.sales_invoices si
            WHERE si.customer_id = c.customer_id AND si.status != 'void'
        ), 0) -
        COALESCE((
            SELECT SUM(amount)
            FROM public.receipts r
            WHERE r.customer_id = c.customer_id
        ), 0)
    ) as outstanding_balance
FROM public.customers c;
