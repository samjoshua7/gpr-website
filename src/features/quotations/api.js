import { supabase } from '../../lib/supabaseClient';
import { getNextInvoiceNumber, createSalesInvoice } from '../salesInvoices/api';

let cachedQuotations = null;
let lastFetchTimeQuotations = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const invalidateQuotationsCache = () => {
  cachedQuotations = null;
  lastFetchTimeQuotations = null;
};

export const getQuotations = async (searchQuery = '', statusFilter = '', forceRefresh = false) => {
  if (
    !forceRefresh &&
    cachedQuotations &&
    !searchQuery &&
    (!statusFilter || statusFilter === 'all') &&
    lastFetchTimeQuotations &&
    Date.now() - lastFetchTimeQuotations < CACHE_TTL
  ) {
    return cachedQuotations;
  }

  let query = supabase
    .from('quotations')
    .select(`
      *,
      customers (
        name
      )
    `)
    .order('quotation_date', { ascending: false });

  if (statusFilter && statusFilter !== 'all') {
    query = query.eq('status', statusFilter);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  if (searchQuery.trim()) {
    const cleanSearch = searchQuery.toLowerCase().trim();
    return data.filter(
      (q) =>
        q.quotation_no?.toLowerCase().includes(cleanSearch) ||
        q.customers?.name?.toLowerCase().includes(cleanSearch)
    );
  }

  if (!searchQuery.trim() && (!statusFilter || statusFilter === 'all')) {
    cachedQuotations = data;
    lastFetchTimeQuotations = Date.now();
  }

  return data;
};

export const getQuotationsByCustomer = async (customerId) => {
  if (!customerId) return [];
  const { data, error } = await supabase
    .from('quotations')
    .select('*')
    .eq('customer_id', customerId)
    .order('quotation_date', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }
  return data || [];
};

export const getQuotationById = async (id) => {
  const { data: quotation, error: quotationError } = await supabase
    .from('quotations')
    .select(`
      *,
      customers (
        name,
        phone,
        address,
        gstin
      )
    `)
    .eq('quotation_id', id)
    .single();

  if (quotationError) {
    throw new Error(quotationError.message);
  }

  const { data: items, error: itemsError } = await supabase
    .from('quotation_items')
    .select('*')
    .eq('quotation_id', id);

  if (itemsError) {
    throw new Error(itemsError.message);
  }

  return {
    ...quotation,
    items: items || [],
  };
};

export const createQuotation = async (quotationData, lineItems) => {
  // 1. Insert parent quotation
  const { data: quotation, error: quotationError } = await supabase
    .from('quotations')
    .insert([
      {
        customer_id: quotationData.customer_id,
        quotation_no: quotationData.quotation_no,
        quotation_date: quotationData.quotation_date,
        invoice_type: quotationData.invoice_type || 'NON_GST',
        customer_type: quotationData.invoice_type === 'GST' ? quotationData.customer_type || 'B2C' : null,
        is_interstate: !!quotationData.is_interstate,
        customer_name: quotationData.customer_name || null,
        customer_gstin: quotationData.customer_gstin || null,
        billing_address: quotationData.billing_address || null,
        shipping_address: quotationData.shipping_address || null,
        total_amount: parseFloat(quotationData.total_amount),
        status: quotationData.status || 'draft',
        tax_amount: parseFloat(quotationData.tax_amount || 0),
        gst_amount: parseFloat(quotationData.gst_amount || 0),
        discount_amount: parseFloat(quotationData.discount_amount || 0),
        notes: quotationData.notes || null,
        delivery_details: quotationData.delivery_details || null,
      },
    ])
    .select()
    .single();

  if (quotationError) {
    throw new Error(quotationError.message);
  }

  // 2. Prepare line items payload
  const itemsPayload = lineItems.map((item) => ({
    quotation_id: quotation.quotation_id,
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
    .from('quotation_items')
    .insert(itemsPayload);

  if (itemsError) {
    await supabase.from('quotations').delete().eq('quotation_id', quotation.quotation_id);
    throw new Error(`Failed to insert quotation line items: ${itemsError.message}`);
  }

  invalidateQuotationsCache();
  return quotation;
};

export const updateQuotation = async (quotationId, quotationData, lineItems) => {
  const { data: quotation, error: quotationError } = await supabase
    .from('quotations')
    .update({
      customer_id: quotationData.customer_id,
      quotation_no: quotationData.quotation_no,
      quotation_date: quotationData.quotation_date,
      invoice_type: quotationData.invoice_type || 'NON_GST',
      customer_type: quotationData.invoice_type === 'GST' ? quotationData.customer_type || 'B2C' : null,
      is_interstate: !!quotationData.is_interstate,
      customer_name: quotationData.customer_name || null,
      customer_gstin: quotationData.customer_gstin || null,
      billing_address: quotationData.billing_address || null,
      shipping_address: quotationData.shipping_address || null,
      total_amount: parseFloat(quotationData.total_amount),
      tax_amount: parseFloat(quotationData.tax_amount || 0),
      gst_amount: parseFloat(quotationData.gst_amount || 0),
      discount_amount: parseFloat(quotationData.discount_amount || 0),
      notes: quotationData.notes || null,
      delivery_details: quotationData.delivery_details || null,
      status: quotationData.status || 'draft',
    })
    .eq('quotation_id', quotationId)
    .select()
    .single();

  if (quotationError) {
    throw new Error(quotationError.message);
  }

  const { error: deleteItemsError } = await supabase
    .from('quotation_items')
    .delete()
    .eq('quotation_id', quotationId);

  if (deleteItemsError) {
    throw new Error(`Failed to delete old quotation line items: ${deleteItemsError.message}`);
  }

  const itemsPayload = lineItems.map((item) => ({
    quotation_id: quotationId,
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
    .from('quotation_items')
    .insert(itemsPayload);

  if (itemsError) {
    throw new Error(`Failed to insert updated quotation line items: ${itemsError.message}`);
  }

  invalidateQuotationsCache();
  return quotation;
};

export const deleteQuotation = async (id) => {
  const { error } = await supabase
    .from('quotations')
    .delete()
    .eq('quotation_id', id);

  if (error) {
    throw new Error(error.message);
  }

  invalidateQuotationsCache();
  return true;
};

export const getNextQuotationNumber = async (invoiceType, financialYear = '26-27') => {
  const prefix = invoiceType === 'GST' ? `GPR/QTN-GST/${financialYear}/` : `GPR/QTN-NGST/${financialYear}/`;

  const { data, error } = await supabase
    .from('quotations')
    .select('quotation_no')
    .like('quotation_no', `${prefix}%`)
    .order('quotation_no', { ascending: false })
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  if (data && data.length > 0) {
    const lastNo = data[0].quotation_no;
    const parts = lastNo.split('/');
    const lastSeqStr = parts[parts.length - 1];
    const lastSeq = parseInt(lastSeqStr, 10);
    const nextSeq = isNaN(lastSeq) ? 1 : lastSeq + 1;
    return `${prefix}${nextSeq.toString().padStart(6, '0')}`;
  }

  return `${prefix}000001`;
};

export const convertQuotationToInvoice = async (quotationId) => {
  const quotation = await getQuotationById(quotationId);
  if (!quotation) {
    throw new Error('Quotation not found.');
  }

  if (quotation.status === 'converted') {
    throw new Error('Quotation has already been converted to an invoice.');
  }

  const invoiceNo = await getNextInvoiceNumber(quotation.invoice_type || 'NON_GST');

  const invoiceData = {
    customer_id: quotation.customer_id,
    job_id: null,
    invoice_no: invoiceNo,
    invoice_date: new Date().toISOString().split('T')[0],
    invoice_type: quotation.invoice_type || 'NON_GST',
    customer_type: quotation.customer_type,
    is_interstate: quotation.is_interstate,
    customer_name: quotation.customer_name,
    customer_gstin: quotation.customer_gstin,
    billing_address: quotation.billing_address,
    shipping_address: quotation.shipping_address,
    total_amount: quotation.total_amount,
    tax_amount: quotation.tax_amount,
    gst_amount: quotation.gst_amount,
    discount_amount: quotation.discount_amount,
    notes: quotation.notes ? `Converted from Quotation ${quotation.quotation_no}. ${quotation.notes}` : `Converted from Quotation ${quotation.quotation_no}.`,
    delivery_details: quotation.delivery_details,
  };

  const lineItems = quotation.items.map((item) => ({
    product_name: item.product_name,
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unit_price,
    discount_amount: item.discount_amount,
    gst_rate: item.gst_rate,
    tax_amount: item.tax_amount,
    amount: item.amount,
    hsn_code: item.hsn_code,
  }));

  const newInvoice = await createSalesInvoice(invoiceData, lineItems);

  // Mark quotation as converted
  const { error: updateError } = await supabase
    .from('quotations')
    .update({
      status: 'converted',
      converted_invoice_id: newInvoice.invoice_id,
    })
    .eq('quotation_id', quotationId);

  if (updateError) {
    // Note: invoice is created, but status update failed; surface error
    throw new Error(`Invoice created (${newInvoice.invoice_no}), but failed to update quotation status: ${updateError.message}`);
  }

  invalidateQuotationsCache();
  return newInvoice;
};
