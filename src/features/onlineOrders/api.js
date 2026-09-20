import { supabase } from '../../lib/supabaseClient';

export const getOnlineOrders = async ({ status = 'ALL', searchQuery = '' } = {}) => {
  let query = supabase
    .from('online_orders')
    .select(`
      *,
      items:online_order_items(order_item_id, product_name, quantity, subtotal)
    `)
    .order('created_at', { ascending: false });

  if (status && status !== 'ALL') {
    query = query.eq('status', status);
  }

  if (searchQuery && searchQuery.trim()) {
    const clean = searchQuery.trim();
    query = query.or(`order_no.ilike.%${clean}%,customer_name.ilike.%${clean}%,customer_phone.ilike.%${clean}%,customer_email.ilike.%${clean}%`);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
};

export const getOnlineOrderById = async (orderId) => {
  const { data: order, error: orderErr } = await supabase
    .from('online_orders')
    .select('*')
    .eq('order_id', orderId)
    .single();

  if (orderErr) throw new Error(orderErr.message);

  const { data: items, error: itemsErr } = await supabase
    .from('online_order_items')
    .select('*')
    .eq('order_id', orderId);

  if (itemsErr) throw new Error(itemsErr.message);

  return {
    ...order,
    items: items || [],
  };
};

export const updateOrderStatus = async (orderId, newStatus) => {
  const { data, error } = await supabase
    .from('online_orders')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('order_id', orderId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};
