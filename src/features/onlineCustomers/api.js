import { supabase } from '../../lib/supabaseClient';

export const getOnlineCustomers = async ({ searchQuery = '' } = {}) => {
  let query = supabase
    .from('online_customers')
    .select(`
      *,
      orders:online_orders(order_id, grand_total, status)
    `)
    .order('created_at', { ascending: false });

  if (searchQuery && searchQuery.trim()) {
    const clean = searchQuery.trim();
    query = query.or(`name.ilike.%${clean}%,email.ilike.%${clean}%,phone.ilike.%${clean}%,company_name.ilike.%${clean}%,gstin.ilike.%${clean}%,city.ilike.%${clean}%`);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  // Compute orders count and total spent per customer
  const enriched = (data || []).map((cust) => {
    const ordersList = cust.orders || [];
    const validOrders = ordersList.filter((o) => o.status !== 'cancelled');
    const totalSpent = validOrders.reduce((sum, o) => sum + (parseFloat(o.grand_total) || 0), 0);
    return {
      ...cust,
      orders_count: ordersList.length,
      total_spent: totalSpent,
    };
  });

  return enriched;
};
