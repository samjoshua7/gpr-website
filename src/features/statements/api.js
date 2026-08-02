import { supabase } from '../../lib/supabaseClient';

export const getStatementData = async () => {
  // Parallel fetch invoices and receipts to build statement
  const [invoicesRes, receiptsRes, customersRes] = await Promise.all([
    supabase.from('sales_invoices').select('*, customers(name)').order('invoice_date', { ascending: false }),
    supabase.from('receipts').select('*, customers(name)').order('receipt_date', { ascending: false }),
    supabase.from('customers').select('customer_id, name, opening_balance')
  ]);

  if (invoicesRes.error) throw new Error(invoicesRes.error.message);
  if (receiptsRes.error) throw new Error(receiptsRes.error.message);
  if (customersRes.error) throw new Error(customersRes.error.message);

  return {
    invoices: invoicesRes.data || [],
    receipts: receiptsRes.data || [],
    customers: customersRes.data || []
  };
};
