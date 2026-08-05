import { supabase } from '../../lib/supabaseClient';

let cachedCustomers = null;
let lastFetchTime = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const invalidateCustomersCache = () => {
  cachedCustomers = null;
  lastFetchTime = null;
};

export const getCustomers = async (searchQuery = '', forceRefresh = false) => {
  if (!forceRefresh && cachedCustomers && !searchQuery && lastFetchTime && (Date.now() - lastFetchTime < CACHE_TTL)) {
    return cachedCustomers;
  }

  let query = supabase
    .from('customers_with_balance')
    .select('*')
    .order('name', { ascending: true });

  if (searchQuery.trim()) {
    const cleanSearch = searchQuery.trim();
    query = query.or(`name.ilike.%${cleanSearch}%,phone.ilike.%${cleanSearch}%,gstin.ilike.%${cleanSearch}%,identification_name.ilike.%${cleanSearch}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  if (!searchQuery.trim()) {
    cachedCustomers = data;
    lastFetchTime = Date.now();
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
        identification_name: customerData.identification_name || null,
        phone: customerData.phone || null,
        email: customerData.email || null,
        address: customerData.address || null,
        gstin: customerData.gstin || null,
        opening_balance: customerData.opening_balance || 0.00,
      },
    ])
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  invalidateCustomersCache();
  return data;
};

export const updateCustomer = async (id, customerData) => {
  const { data, error } = await supabase
    .from('customers')
    .update({
      name: customerData.name,
      identification_name: customerData.identification_name || null,
      phone: customerData.phone || null,
      email: customerData.email || null,
      address: customerData.address || null,
      gstin: customerData.gstin || null,
      opening_balance: customerData.opening_balance || 0.00,
    })
    .eq('customer_id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  invalidateCustomersCache();
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

  invalidateCustomersCache();
  return true;
};
