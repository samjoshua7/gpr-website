import { supabase } from '../../lib/supabaseClient';

export const getCustomers = async (searchQuery = '') => {
  let query = supabase
    .from('customers')
    .select('*')
    .order('name', { ascending: true });

  if (searchQuery.trim()) {
    const cleanSearch = searchQuery.trim();
    // ilike matches case-insensitively, or is used to query matches across fields
    query = query.or(`name.ilike.%${cleanSearch}%,phone.ilike.%${cleanSearch}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const getCustomerById = async (id) => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('customer_id', id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const createCustomer = async (customerData) => {
  const { data, error } = await supabase
    .from('customers')
    .insert([
      {
        name: customerData.name,
        phone: customerData.phone || null,
        address: customerData.address || null,
        opening_balance: customerData.opening_balance || 0.00,
      },
    ])
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const updateCustomer = async (id, customerData) => {
  const { data, error } = await supabase
    .from('customers')
    .update({
      name: customerData.name,
      phone: customerData.phone || null,
      address: customerData.address || null,
      opening_balance: customerData.opening_balance || 0.00,
    })
    .eq('customer_id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const deleteCustomer = async (id) => {
  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('customer_id', id);

  if (error) {
    throw new Error(error.message);
  }

  return true;
};
