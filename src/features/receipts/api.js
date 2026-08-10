import { supabase } from '../../lib/supabaseClient';

let cachedReceipts = null;
let lastFetchTimeReceipts = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const invalidateReceiptsCache = () => {
  cachedReceipts = null;
  lastFetchTimeReceipts = null;
};
export const getReceipts = async (searchQuery = '', forceRefresh = false) => {
  if (!forceRefresh && cachedReceipts && !searchQuery && lastFetchTimeReceipts && (Date.now() - lastFetchTimeReceipts < CACHE_TTL)) {
    return cachedReceipts;
  }

  const { data, error } = await supabase
    .from('receipts')
    .select(`
      *,
      customers (
        name,
        phone
      ),
      sales_invoices (
        invoice_no,
        total_amount,
        amount_paid
      )
    `)
    .order('receipt_date', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  if (!searchQuery.trim()) {
    cachedReceipts = data || [];
    lastFetchTimeReceipts = Date.now();
  }

  return data || [];
};

export const getReceiptsByCustomer = async (customerId) => {
  const { data, error } = await supabase
    .from('receipts')
    .select(`
      *,
      sales_invoices (
        invoice_no,
        total_amount,
        amount_paid
      )
    `)
    .eq('customer_id', customerId)
    .order('receipt_date', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
};

export const getReceiptById = async (id) => {
  const { data, error } = await supabase
    .from('receipts')
    .select(`
      *,
      customers (
        name,
        phone,
        address
      ),
      sales_invoices (
        invoice_no,
        total_amount,
        amount_paid
      )
    `)
    .eq('receipt_id', id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const createReceipt = async (receiptData) => {
  const { data, error } = await supabase
    .from('receipts')
    .insert([
      {
        customer_id: receiptData.customer_id,
        invoice_id: receiptData.invoice_id || null,
        amount: parseFloat(receiptData.amount),
        receipt_date: receiptData.receipt_date,
        mode: receiptData.mode,
      },
    ])
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  invalidateReceiptsCache();
  return data;
};

export const updateReceipt = async (receiptId, receiptData) => {
  const { data, error } = await supabase
    .from('receipts')
    .update({
      customer_id: receiptData.customer_id,
      invoice_id: receiptData.invoice_id || null,
      amount: parseFloat(receiptData.amount),
      receipt_date: receiptData.receipt_date,
      mode: receiptData.mode,
    })
    .eq('receipt_id', receiptId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  invalidateReceiptsCache();
  return data;
};

export const deleteReceipt = async (receiptId) => {
  const { error } = await supabase
    .from('receipts')
    .delete()
    .eq('receipt_id', receiptId);

  if (error) {
    throw new Error(error.message);
  }

  invalidateReceiptsCache();
  return true;
};

/**
 * Loads unpaid / partially paid invoices for a customer
 */
export const getCustomerOutstandingInvoices = async (customerId) => {
  if (!customerId) return [];
  
  const { data, error } = await supabase
    .from('sales_invoices')
    .select('invoice_id, invoice_no, total_amount, amount_paid')
    .eq('customer_id', customerId)
    .in('status', ['unpaid', 'partial'])
    .order('invoice_date', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
};
