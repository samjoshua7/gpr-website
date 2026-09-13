import { supabase } from '../../lib/supabaseClient';

let cachedStatementData = null;
let lastFetchTimeStatementData = null;
let cacheGenerationStatementData = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const getCachedStatementData = () => cachedStatementData;

export const invalidateStatementDataCache = () => {
  cacheGenerationStatementData++;
  lastFetchTimeStatementData = null;
};
export const getStatementCustomers = async () => {
  const { data, error } = await supabase
    .from('customers')
    .select('customer_id, name, phone, gstin, opening_balance, address')
    .order('name', { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
};

export const getStatementCompanySettings = async () => {
  const { data, error } = await supabase
    .from('company_settings')
    .select('*')
    .limit(1)
    .maybeSingle();

  if (error) console.error('Error fetching company settings:', error);
  return data || null;
};

export const fetchTransactionsReportApi = async ({ startDate = '', endDate = '' }) => {
  let invQuery = supabase
    .from('sales_invoices')
    .select(`
      invoice_id,
      invoice_no,
      invoice_date,
      total_amount,
      status,
      customer_id,
      customers (
        name
      )
    `)
    .order('invoice_date', { ascending: false });

  if (startDate) {
    invQuery = invQuery.gte('invoice_date', startDate);
  }
  if (endDate) {
    invQuery = invQuery.lte('invoice_date', endDate);
  }

  let recQuery = supabase
    .from('receipts')
    .select(`
      receipt_id,
      receipt_no,
      receipt_date,
      amount,
      mode,
      customer_id,
      customers (
        name
      )
    `)
    .order('receipt_date', { ascending: false });

  if (startDate) {
    recQuery = recQuery.gte('receipt_date', startDate);
  }
  if (endDate) {
    recQuery = recQuery.lte('receipt_date', endDate);
  }

  const [invoicesRes, receiptsRes] = await Promise.all([invQuery, recQuery]);

  if (invoicesRes.error) throw new Error(invoicesRes.error.message);
  if (receiptsRes.error) throw new Error(receiptsRes.error.message);

  return {
    invoices: invoicesRes.data || [],
    receipts: receiptsRes.data || [],
  };
};

export const fetchCustomerStatementReportApi = async ({ customerId, startDate = '', endDate = '' }) => {
  if (!customerId) throw new Error('Customer ID is required to fetch customer statement.');

  let invQuery = supabase
    .from('sales_invoices')
    .select(`
      invoice_id,
      invoice_no,
      invoice_date,
      total_amount,
      amount_paid,
      status,
      customer_id,
      customers (
        customer_id,
        name,
        phone,
        address,
        gstin,
        opening_balance
      )
    `)
    .eq('customer_id', customerId)
    .order('invoice_date', { ascending: false });

  if (startDate) {
    invQuery = invQuery.gte('invoice_date', startDate);
  }
  if (endDate) {
    invQuery = invQuery.lte('invoice_date', endDate);
  }

  let recQuery = supabase
    .from('receipts')
    .select(`
      receipt_id,
      receipt_no,
      receipt_date,
      amount,
      mode,
      customer_id,
      customers (
        name
      )
    `)
    .eq('customer_id', customerId)
    .order('receipt_date', { ascending: false });

  if (startDate) {
    recQuery = recQuery.gte('receipt_date', startDate);
  }
  if (endDate) {
    recQuery = recQuery.lte('receipt_date', endDate);
  }

  const [invoicesRes, receiptsRes] = await Promise.all([invQuery, recQuery]);

  if (invoicesRes.error) throw new Error(invoicesRes.error.message);
  if (receiptsRes.error) throw new Error(receiptsRes.error.message);

  return {
    invoices: invoicesRes.data || [],
    receipts: receiptsRes.data || [],
  };
};

export const fetchGstrReportDataApi = async ({ startDate = '', endDate = '' }) => {
  let invQuery = supabase
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
        item_id,
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
    .order('created_at', { ascending: false });

  if (startDate) {
    invQuery = invQuery.gte('invoice_date', startDate);
  }
  if (endDate) {
    invQuery = invQuery.lte('invoice_date', endDate);
  }

  const [invoicesRes, settingsRes] = await Promise.all([
    invQuery,
    supabase.from('company_settings').select('*').limit(1).maybeSingle(),
  ]);

  if (invoicesRes.error) throw new Error(invoicesRes.error.message);

  return {
    invoices: invoicesRes.data || [],
    companySettings: settingsRes.data || null,
  };
};

export const getStatementData = async (forceRefresh = false) => {
  const fetchGen = cacheGenerationStatementData;
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
          item_id,
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

  const result = {
    invoices: invoicesRes.data || [],
    receipts: receiptsRes.data || [],
    customers: customersRes.data || [],
    companySettings: settingsRes.data || null,
  };

  if (cacheGenerationStatementData === fetchGen) {
    cachedStatementData = result;
    lastFetchTimeStatementData = Date.now();
  }

  return result;
};

