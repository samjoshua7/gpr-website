import { supabase } from '../../lib/supabaseClient';

let cachedStatementData = null;
let lastFetchTimeStatementData = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const invalidateStatementDataCache = () => {
  cachedStatementData = null;
  lastFetchTimeStatementData = null;
};
export const getStatementData = async (forceRefresh = false) => {
  if (!forceRefresh && cachedStatementData && lastFetchTimeStatementData && (Date.now() - lastFetchTimeStatementData < CACHE_TTL)) {
    return cachedStatementData;
  }

  // Parallel fetch invoices and receipts to build statement
  const [invoicesRes, receiptsRes, customersRes] = await Promise.all([
    supabase.from('sales_invoices').select('*, customers(name)').order('invoice_date', { ascending: false }),
    supabase.from('receipts').select('*, customers(name)').order('receipt_date', { ascending: false }),
    supabase.from('customers').select('customer_id, name, opening_balance')
  ]);

  if (invoicesRes.error) throw new Error(invoicesRes.error.message);
  if (receiptsRes.error) throw new Error(receiptsRes.error.message);
  if (customersRes.error) throw new Error(customersRes.error.message);

  cachedStatementData = {
    invoices: invoicesRes.data || [],
    receipts: receiptsRes.data || [],
    customers: customersRes.data || []
  };
  lastFetchTimeStatementData = Date.now();

  return cachedStatementData;
};
