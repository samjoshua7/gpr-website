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

  // Parallel fetch invoices, receipts, customers, and company settings
  const [invoicesRes, receiptsRes, customersRes, settingsRes] = await Promise.all([
    supabase
      .from('sales_invoices')
      .select(`
        *,
        customers (
          name,
          phone,
          address,
          gstin
        ),
        items:sales_invoice_items (
          invoice_item_id,
          product_name,
          description,
          hsn_code,
          quantity,
          unit_price,
          gst_rate,
          tax_amount,
          discount_amount,
          amount
        )
      `)
      .order('invoice_date', { ascending: false })
      .order('created_at', { ascending: false }),
    supabase.from('receipts').select('*, customers(name)').order('receipt_date', { ascending: false }),
    supabase.from('customers').select('customer_id, name, phone, gstin, opening_balance'),
    supabase.from('company_settings').select('*').limit(1).maybeSingle(),
  ]);

  if (invoicesRes.error) throw new Error(invoicesRes.error.message);
  if (receiptsRes.error) throw new Error(receiptsRes.error.message);
  if (customersRes.error) throw new Error(customersRes.error.message);

  cachedStatementData = {
    invoices: invoicesRes.data || [],
    receipts: receiptsRes.data || [],
    customers: customersRes.data || [],
    companySettings: settingsRes.data || null,
  };
  lastFetchTimeStatementData = Date.now();

  return cachedStatementData;
};
