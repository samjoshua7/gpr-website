import { supabase } from '../../lib/supabaseClient';
import { invalidateCustomersCache } from '../customers/api';
import { invalidateSalesInvoicesCache } from '../salesInvoices/api';
import { invalidateStatementDataCache } from '../statements/api';

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
  invalidateCustomersCache();
  invalidateSalesInvoicesCache();
  invalidateStatementDataCache();
  return data;
};

/**
 * Creates receipt entries with multi-invoice allocation and advance payment support.
 * For each allocated invoice, a receipt row with that invoice_id is inserted.
 * If there is unallocated excess, an unlinked advance receipt is inserted.
 */
export const createReceiptWithAllocations = async ({
  customer_id,
  receipt_date,
  mode,
  allocations = [],
  advanceAmount = 0,
}) => {
  const recordsToInsert = [];

  // Add allocated invoice records
  allocations.forEach((alloc) => {
    const amt = parseFloat(alloc.amount || 0);
    if (amt > 0 && alloc.invoice_id) {
      recordsToInsert.push({
        customer_id,
        invoice_id: alloc.invoice_id,
        amount: amt,
        receipt_date,
        mode,
      });
    }
  });

  // Add advance / unallocated portion if any
  const advAmt = parseFloat(advanceAmount || 0);
  if (advAmt > 0) {
    recordsToInsert.push({
      customer_id,
      invoice_id: null,
      amount: advAmt,
      receipt_date,
      mode,
    });
  }

  if (recordsToInsert.length === 0) {
    throw new Error('Receipt total amount must be greater than 0.');
  }

  const { data, error } = await supabase
    .from('receipts')
    .insert(recordsToInsert)
    .select();

  if (error) {
    throw error;
  }

  invalidateReceiptsCache();
  invalidateCustomersCache();
  invalidateSalesInvoicesCache();
  invalidateStatementDataCache();

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
  invalidateCustomersCache();
  invalidateSalesInvoicesCache();
  invalidateStatementDataCache();
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
  invalidateCustomersCache();
  invalidateSalesInvoicesCache();
  invalidateStatementDataCache();
  return true;
};

/**
 * Loads unpaid / partially paid invoices for a customer in chronological order (FIFO)
 */
export const getCustomerOutstandingInvoices = async (customerId) => {
  if (!customerId) return [];
  
  const { data, error } = await supabase
    .from('sales_invoices')
    .select('invoice_id, invoice_no, invoice_date, total_amount, amount_paid, status, created_at')
    .eq('customer_id', customerId)
    .in('status', ['unpaid', 'partial'])
    .order('invoice_date', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  return data || [];
};
