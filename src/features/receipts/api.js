import { supabase } from '../../lib/supabaseClient';

export const getReceipts = async (searchQuery = '') => {
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

  if (searchQuery.trim()) {
    const cleanSearch = searchQuery.toLowerCase().trim();
    return data.filter(
      (r) =>
        r.customers?.name?.toLowerCase().includes(cleanSearch) ||
        r.sales_invoices?.invoice_no?.toLowerCase().includes(cleanSearch) ||
        r.mode?.toLowerCase().includes(cleanSearch)
    );
  }

  return data || [];
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
