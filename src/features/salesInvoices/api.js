import { supabase } from '../../lib/supabaseClient';
import { advanceJobProductionTaskOnInvoice, invalidateJobCardsCache } from '../jobCards/api';
import { invalidateCustomersCache } from '../customers/api';

let cachedSalesInvoices = null;
let lastFetchTimeSalesInvoices = null;
let cachedTaskProgressMap = null;
let lastFetchTimeTaskProgress = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const invalidateSalesInvoicesCache = () => {
  cachedSalesInvoices = null;
  lastFetchTimeSalesInvoices = null;
};

export const invalidateTaskProgressCache = () => {
  cachedTaskProgressMap = null;
  lastFetchTimeTaskProgress = null;
};

export const getInvoiceTaskProgress = async (invoiceIds = [], forceRefresh = false) => {
  if (!invoiceIds || invoiceIds.length === 0) return {};

  if (
    !forceRefresh &&
    cachedTaskProgressMap &&
    lastFetchTimeTaskProgress &&
    Date.now() - lastFetchTimeTaskProgress < CACHE_TTL
  ) {
    const result = {};
    invoiceIds.forEach((id) => {
      if (cachedTaskProgressMap[id]) {
        result[id] = cachedTaskProgressMap[id];
      }
    });
    return result;
  }

  const { data, error } = await supabase
    .from('invoice_task_progress')
    .select('*')
    .in('invoice_id', invoiceIds);

  if (error) {
    console.error('Error fetching invoice task progress:', error);
    return {};
  }

  const grouped = {};
  (data || []).forEach((row) => {
    if (!grouped[row.invoice_id]) {
      grouped[row.invoice_id] = [];
    }
    grouped[row.invoice_id].push({
      task_id: row.task_id,
      product_name: row.product_name,
      status: row.status,
      updated_at: row.updated_at,
    });
  });

  cachedTaskProgressMap = { ...(cachedTaskProgressMap || {}), ...grouped };
  lastFetchTimeTaskProgress = Date.now();

  return grouped;
};
export const getSalesInvoices = async (searchQuery = '', statusFilter = '', forceRefresh = false) => {
  if (!forceRefresh && cachedSalesInvoices && !searchQuery && (!statusFilter || statusFilter === 'all') && lastFetchTimeSalesInvoices && (Date.now() - lastFetchTimeSalesInvoices < CACHE_TTL)) {
    return cachedSalesInvoices;
  }

  let query = supabase
    .from('sales_invoices')
    .select(`
      *,
      customers (
        name
      ),
      job_cards (
        job_id,
        job_number,
        description,
        status
      )
    `)
    .order('invoice_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (statusFilter && statusFilter !== 'all') {
    query = query.eq('status', statusFilter);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  // Client-side post filtering for search queries
  if (searchQuery.trim()) {
    const cleanSearch = searchQuery.toLowerCase().trim();
    return data.filter(
      (inv) =>
        inv.invoice_no?.toLowerCase().includes(cleanSearch) ||
        inv.customers?.name?.toLowerCase().includes(cleanSearch) ||
        (inv.job_cards?.description || '').toLowerCase().includes(cleanSearch) ||
        `jc-${String(inv.job_cards?.job_number || 0).padStart(4, '0')}`.includes(cleanSearch)
    );
  }

  if (!searchQuery.trim() && (!statusFilter || statusFilter === 'all')) {
    cachedSalesInvoices = data;
    lastFetchTimeSalesInvoices = Date.now();
  }

  return data;
};

export const linkInvoiceToJobCard = async (invoiceId, jobId) => {
  if (!invoiceId || !jobId) throw new Error('Invoice ID and Job Card ID are required');

  // 1. Clear any prior invoice linked to this jobId to guarantee strict 1-to-1 link
  await supabase
    .from('sales_invoices')
    .update({ job_id: null })
    .eq('job_id', jobId);

  // 2. Link the targeted invoice
  const { data, error } = await supabase
    .from('sales_invoices')
    .update({ job_id: jobId })
    .eq('invoice_id', invoiceId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  invalidateSalesInvoicesCache();
  return data;
};

export const unlinkInvoiceFromJobCard = async (invoiceId) => {
  if (!invoiceId) throw new Error('Invoice ID is required');
  const { data, error } = await supabase
    .from('sales_invoices')
    .update({ job_id: null })
    .eq('invoice_id', invoiceId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  invalidateSalesInvoicesCache();
  return data;
};

export const getInvoicesByCustomer = async (customerId) => {
  if (!customerId) return [];
  const { data, error } = await supabase
    .from('sales_invoices')
    .select(`
      *,
      customers (
        name
      )
    `)
    .eq('customer_id', customerId)
    .order('invoice_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
};

export const getInvoiceById = async (id) => {
  // Fetch invoice details
  const { data: invoice, error: invoiceError } = await supabase
    .from('sales_invoices')
    .select(`
      *,
      customers (
        name,
        phone,
        address,
        gstin
      ),
      job_cards (
        job_id,
        job_number,
        description,
        status,
        quantity
      )
    `)
    .eq('invoice_id', id)
    .single();

  if (invoiceError) {
    throw new Error(invoiceError.message);
  }

  // Fetch line items
  const { data: items, error: itemsError } = await supabase
    .from('sales_invoice_items')
    .select('*')
    .eq('invoice_id', id);

  if (itemsError) {
    throw new Error(itemsError.message);
  }

  return {
    ...invoice,
    items: items || [],
  };
};

export const createSalesInvoice = async (invoiceData, lineItems) => {
  let autoCreatedJob = null;
  let finalJobId = invoiceData.job_id || null;

  // If no job card is linked, auto-create a Job Card for this invoice
  if (!finalJobId) {
    try {
      const itemsSummary = (lineItems || [])
        .map((item) => `${item.product_name || item.description || 'Item'} (Qty: ${item.quantity})`)
        .join(', ');
      const totalQty = (lineItems || []).reduce((acc, item) => acc + (parseFloat(item.quantity) || 0), 0) || 1;

      const { data: newJob, error: jobErr } = await supabase
        .from('job_cards')
        .insert([
          {
            customer_id: invoiceData.customer_id || null,
            description: itemsSummary || `Order for Invoice ${invoiceData.invoice_no}`,
            quantity: totalQty,
            status: 'New Orders',
          },
        ])
        .select()
        .single();

      if (!jobErr && newJob) {
        finalJobId = newJob.job_id;
        autoCreatedJob = newJob;
      }
    } catch (err) {
      console.error('Failed to auto-create job card for direct invoice:', err);
    }
  }

  // 1. Insert parent invoice
  const { data: invoice, error: invoiceError } = await supabase
    .from('sales_invoices')
    .insert([
      {
        customer_id: invoiceData.customer_id,
        job_id: finalJobId,
        invoice_no: invoiceData.invoice_no,
        invoice_date: invoiceData.invoice_date,
        invoice_type: invoiceData.invoice_type || 'NON_GST',
        customer_type: invoiceData.invoice_type === 'GST' ? (invoiceData.customer_type || 'B2C') : null,
        is_interstate: !!invoiceData.is_interstate,
        customer_name: invoiceData.customer_name || null,
        customer_gstin: invoiceData.customer_gstin || null,
        billing_address: invoiceData.billing_address || null,
        shipping_address: invoiceData.shipping_address || null,
        total_amount: parseFloat(invoiceData.total_amount),
        amount_paid: 0.00,
        status: 'unpaid',
        tax_amount: parseFloat(invoiceData.tax_amount || 0),
        gst_amount: parseFloat(invoiceData.gst_amount || 0),
        discount_amount: parseFloat(invoiceData.discount_amount || 0),
        notes: invoiceData.notes || null,
        delivery_details: invoiceData.delivery_details || null,
      },
    ])
    .select()
    .single();

  if (invoiceError) {
    throw new Error(invoiceError.message);
  }

  // 2. Prepare and insert line items
  const itemsPayload = lineItems.map((item) => ({
    invoice_id: invoice.invoice_id,
    item_id: item.item_id || null,
    product_name: item.product_name || item.description || null,
    description: item.description,
    quantity: parseFloat(item.quantity),
    unit_price: parseFloat(item.unit_price),
    discount_amount: parseFloat(item.discount_amount || 0),
    gst_rate: parseFloat(item.gst_rate || 0),
    tax_amount: parseFloat(item.tax_amount || 0),
    amount: parseFloat(item.amount),
    hsn_code: item.hsn_code || null,
  }));

  const { error: itemsError } = await supabase
    .from('sales_invoice_items')
    .insert(itemsPayload);

  if (itemsError) {
    // Attempt cleanup of orphaned invoice if line items fail
    await supabase.from('sales_invoices').delete().eq('invoice_id', invoice.invoice_id);
    throw new Error(`Failed to insert line items: ${itemsError.message}`);
  }

  if (finalJobId) {
    await advanceJobProductionTaskOnInvoice(finalJobId);
  }

  invalidateSalesInvoicesCache();
  invalidateCustomersCache();
  invalidateJobCardsCache();
  invalidateTaskProgressCache();
  return { ...invoice, autoCreatedJob };
};

export const updateSalesInvoice = async (invoiceId, invoiceData, lineItems) => {
  // 1. Update parent invoice
  const { data: invoice, error: invoiceError } = await supabase
    .from('sales_invoices')
    .update({
      customer_id: invoiceData.customer_id,
      job_id: invoiceData.job_id || null,
      invoice_no: invoiceData.invoice_no,
      invoice_date: invoiceData.invoice_date,
      invoice_type: invoiceData.invoice_type || 'NON_GST',
      customer_type: invoiceData.invoice_type === 'GST' ? (invoiceData.customer_type || 'B2C') : null,
      is_interstate: !!invoiceData.is_interstate,
      customer_name: invoiceData.customer_name || null,
      customer_gstin: invoiceData.customer_gstin || null,
      billing_address: invoiceData.billing_address || null,
      shipping_address: invoiceData.shipping_address || null,
      total_amount: parseFloat(invoiceData.total_amount),
      tax_amount: parseFloat(invoiceData.tax_amount || 0),
      gst_amount: parseFloat(invoiceData.gst_amount || 0),
      discount_amount: parseFloat(invoiceData.discount_amount || 0),
      notes: invoiceData.notes || null,
      delivery_details: invoiceData.delivery_details || null,
    })
    .eq('invoice_id', invoiceId)
    .select()
    .single();

  if (invoiceError) {
    throw new Error(invoiceError.message);
  }

  // 2. Delete existing line items
  const { error: deleteItemsError } = await supabase
    .from('sales_invoice_items')
    .delete()
    .eq('invoice_id', invoiceId);
    
  if (deleteItemsError) {
    throw new Error(`Failed to delete old line items: ${deleteItemsError.message}`);
  }

  // 3. Insert new line items
  const itemsPayload = lineItems.map((item) => ({
    invoice_id: invoiceId,
    item_id: item.item_id || null,
    product_name: item.product_name || item.description || null,
    description: item.description,
    quantity: parseFloat(item.quantity),
    unit_price: parseFloat(item.unit_price),
    discount_amount: parseFloat(item.discount_amount || 0),
    gst_rate: parseFloat(item.gst_rate || 0),
    tax_amount: parseFloat(item.tax_amount || 0),
    amount: parseFloat(item.amount),
    hsn_code: item.hsn_code || null,
  }));

  const { error: itemsError } = await supabase
    .from('sales_invoice_items')
    .insert(itemsPayload);

  if (itemsError) {
    throw new Error(`Failed to insert updated line items: ${itemsError.message}`);
  }

  invalidateSalesInvoicesCache();
  invalidateCustomersCache();
  invalidateJobCardsCache();
  invalidateTaskProgressCache();
  return invoice;
};

export const voidSalesInvoice = async (id) => {
  const { data, error } = await supabase
    .from('sales_invoices')
    .update({ status: 'void' })
    .eq('invoice_id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  invalidateSalesInvoicesCache();
  invalidateCustomersCache();
  invalidateJobCardsCache();
  invalidateTaskProgressCache();
  return data;
};

export const deleteSalesInvoice = async (id) => {
  // 1. Delete child line items first
  const { error: itemsError } = await supabase
    .from('sales_invoice_items')
    .delete()
    .eq('invoice_id', id);

  if (itemsError) {
    console.warn('Notice: Issue deleting invoice line items:', itemsError.message);
  }

  // 2. Unlink any converted quotations and revert status to sent so they can be reused
  await supabase
    .from('quotations')
    .update({ converted_invoice_id: null, status: 'sent' })
    .eq('converted_invoice_id', id);

  // 3. Delete parent invoice
  const { error } = await supabase
    .from('sales_invoices')
    .delete()
    .eq('invoice_id', id);

  if (error) {
    throw error;
  }

  invalidateSalesInvoicesCache();
  invalidateCustomersCache();
  invalidateJobCardsCache();
  invalidateTaskProgressCache();
  return true;
};

/**
 * Calculates and returns the next sequential invoice number based on GST type
 */
export const getNextInvoiceNumber = async (invoiceType, financialYear = '26-27') => {
  const prefix = invoiceType === 'GST' ? `GPR/GST/${financialYear}/` : `GPR/NGST/${financialYear}/`;
  
  const { data, error } = await supabase
    .from('sales_invoices')
    .select('invoice_no')
    .like('invoice_no', `${prefix}%`)
    .order('invoice_no', { ascending: false })
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  if (data && data.length > 0) {
    const lastNo = data[0].invoice_no;
    const parts = lastNo.split('/');
    const lastSeqStr = parts[parts.length - 1];
    const lastSeq = parseInt(lastSeqStr, 10);
    const nextSeq = isNaN(lastSeq) ? 1 : lastSeq + 1;
    return `${prefix}${nextSeq.toString().padStart(6, '0')}`;
  }

  return `${prefix}000001`;
};

/**
 * Queries the total outstanding balance for a customer (unpaid & partial invoices sum)
 */
export const getCustomerOutstandingBalance = async (customerId) => {
  if (!customerId) return 0;
  
  const [custRes, invRes, recRes] = await Promise.all([
    supabase.from('customers').select('opening_balance').eq('customer_id', customerId).single(),
    supabase.from('sales_invoices').select('total_amount').eq('customer_id', customerId).neq('status', 'void'),
    supabase.from('receipts').select('amount').eq('customer_id', customerId)
  ]);

  if (custRes.error) throw new Error(custRes.error.message);
  if (invRes.error) throw new Error(invRes.error.message);
  if (recRes.error) throw new Error(recRes.error.message);

  const openingBalance = parseFloat(custRes.data.opening_balance) || 0;
  const totalSales = invRes.data.reduce((sum, inv) => sum + (parseFloat(inv.total_amount) || 0), 0);
  const totalReceipts = recRes.data.reduce((sum, rec) => sum + (parseFloat(rec.amount) || 0), 0);

  return openingBalance + totalSales - totalReceipts;
};

/**
 * Queries active company settings
 */
export const getCompanySettings = async () => {
  const { data, error } = await supabase
    .from('company_settings')
    .select('*')
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  return data?.[0] || null;
};

/**
 * Queries items catalog with joined tax rates for selection
 */
export const getInventoryItems = async () => {
  const { data, error } = await supabase
    .from('items')
    .select(`
      *,
      tax_rates (
        tax_rate_id,
        tax_name,
        percentage,
        hsn_code
      )
    `)
    .eq('active', true)
    .order('name', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
};

/**
 * Queries active tax rates from database
 */
export const getTaxRates = async () => {
  const { data, error } = await supabase
    .from('tax_rates')
    .select('*')
    .eq('active', true)
    .order('percentage', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
};

