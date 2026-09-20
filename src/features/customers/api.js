import { supabase } from '../../lib/supabaseClient';

let cachedCustomers = null;
let lastFetchTime = null;
let cacheGeneration = 0;
let pendingCustomersRequest = null;
const pendingCustomerRequests = new Map();
const staleCustomerIds = new Set();
const CACHE_TTL = 5 * 60 * 1000;

export const getCachedCustomers = () => cachedCustomers;

export const hasCachedCustomers = () => cachedCustomers !== null;

export const invalidateCustomersCache = (customerIds = null) => {
  cacheGeneration++;

  const ids = (Array.isArray(customerIds) ? customerIds : [customerIds]).filter(Boolean);
  if (ids.length > 0) {
    ids.forEach((id) => staleCustomerIds.add(id));
    return;
  }

  lastFetchTime = null;
  staleCustomerIds.clear();
};

const fetchCustomersFromDatabase = async (searchQuery = '') => {
  let query = supabase
    .from('customers_with_balance')
    .select('*')
    .order('name', { ascending: true });

  if (searchQuery.trim()) {
    const cleanSearch = searchQuery.trim();
    query = query.or(`name.ilike.%${cleanSearch}%,phone.ilike.%${cleanSearch}%,gstin.ilike.%${cleanSearch}%,identification_name.ilike.%${cleanSearch}%`);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
};

export const getCustomers = async (searchQuery = '', forceRefresh = false) => {
  const isCacheableRequest = !searchQuery.trim();
  const cacheIsFresh = lastFetchTime && (Date.now() - lastFetchTime < CACHE_TTL);

  if (!forceRefresh && isCacheableRequest && cachedCustomers !== null && cacheIsFresh && staleCustomerIds.size === 0) {
    return cachedCustomers;
  }

  if (isCacheableRequest && pendingCustomersRequest) {
    return pendingCustomersRequest;
  }

  const fetchGeneration = cacheGeneration;
  const request = fetchCustomersFromDatabase(searchQuery);
  if (isCacheableRequest) pendingCustomersRequest = request;

  try {
    const data = await request;
    if (isCacheableRequest && cacheGeneration === fetchGeneration) {
      cachedCustomers = data;
      lastFetchTime = Date.now();
      staleCustomerIds.clear();
    }
    return data;
  } finally {
    if (isCacheableRequest && pendingCustomersRequest === request) {
      pendingCustomersRequest = null;
    }
  }
};

export const getCustomerById = async (id) => {
  const { data, error } = await supabase
    .from('customers_with_balance')
    .select('*')
    .eq('customer_id', id)
    .single();

  if (error) throw new Error(error.message);
  return data;
};

export const refreshCustomerInCache = async (customerId) => {
  if (!customerId) return null;

  invalidateCustomersCache(customerId);
  if (cachedCustomers === null) return null;

  if (pendingCustomerRequests.has(customerId)) {
    return pendingCustomerRequests.get(customerId);
  }

  const request = getCustomerById(customerId);
  pendingCustomerRequests.set(customerId, request);

  try {
    const customer = await request;
    const existingIndex = cachedCustomers.findIndex((item) => item.customer_id === customerId);
    cachedCustomers = existingIndex === -1
      ? [...cachedCustomers, customer].sort((a, b) => (a.name || '').localeCompare(b.name || ''))
      : cachedCustomers.map((item) => item.customer_id === customerId ? customer : item);
    staleCustomerIds.delete(customerId);
    return customer;
  } finally {
    pendingCustomerRequests.delete(customerId);
  }
};

export const refreshCustomersInCache = async (customerIds = []) => {
  const ids = [...new Set(customerIds.filter(Boolean))];
  if (ids.length === 0) return [];
  return Promise.allSettled(ids.map(refreshCustomerInCache));
};

export const createCustomer = async (customerData) => {
  const { data, error } = await supabase
    .from('customers')
    .insert([{
      name: customerData.name,
      identification_name: customerData.identification_name || null,
      phone: customerData.phone || null,
      email: customerData.email || null,
      address: customerData.address || null,
      gstin: customerData.gstin || null,
      opening_balance: customerData.opening_balance || 0.00,
    }])
    .select()
    .single();

  if (error) throw new Error(error.message);
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

  if (error) throw new Error(error.message);
  await refreshCustomerInCache(id);
  return data;
};

export const deleteCustomer = async (id) => {
  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('customer_id', id);

  if (error) throw new Error(error.message);

  if (cachedCustomers !== null) {
    cachedCustomers = cachedCustomers.filter((customer) => customer.customer_id !== id);
  }
  staleCustomerIds.delete(id);
  cacheGeneration++;
  return true;
};
