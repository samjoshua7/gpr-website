import { supabase } from '../../lib/supabaseClient';

export const getCustomers = async (searchQuery = '') => {
  let query = supabase
    .from('customers')
    .select(`
      *,
      sales_invoices ( total_amount, status ),
      receipts ( amount )
    `)
    .order('name', { ascending: true });

  if (searchQuery.trim()) {
    const cleanSearch = searchQuery.trim();
    query = query.or(`name.ilike.%${cleanSearch}%,phone.ilike.%${cleanSearch}%,gstin.ilike.%${cleanSearch}%,identification_name.ilike.%${cleanSearch}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  // Calculate live outstanding balance
  const customersWithBalance = data.map((customer) => {
    const validInvoices = customer.sales_invoices?.filter(i => i.status !== 'void') || [];
    const totalInvoiced = validInvoices.reduce((sum, inv) => sum + Number(inv.total_amount), 0);
    const totalReceipts = (customer.receipts || []).reduce((sum, r) => sum + Number(r.amount), 0);
    
    const outstanding_balance = Number(customer.opening_balance) + totalInvoiced - totalReceipts;
    
    // Remove nested arrays to keep the object clean
    const { sales_invoices, receipts, ...cleanCustomer } = customer;
    
    return {
      ...cleanCustomer,
      outstanding_balance
    };
  });

  return customersWithBalance;
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
