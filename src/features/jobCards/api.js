import { supabase } from '../../lib/supabaseClient';
import { invalidateTaskProgressCache } from '../salesInvoices/api';

let cachedJobCards = null;
let lastFetchTimeJobCards = null;
let cachedProductionTasks = null;
let lastFetchTimeProductionTasks = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const invalidateJobCardsCache = () => {
  cachedJobCards = null;
  lastFetchTimeJobCards = null;
};

export const invalidateProductionTasksCache = () => {
  cachedProductionTasks = null;
  lastFetchTimeProductionTasks = null;
};
export const getJobCards = async (searchQuery = '', statusFilter = '', forceRefresh = false) => {
  if (!forceRefresh && cachedJobCards && !searchQuery && (!statusFilter || statusFilter === 'all') && lastFetchTimeJobCards && (Date.now() - lastFetchTimeJobCards < CACHE_TTL)) {
    return cachedJobCards;
  }

  let query = supabase
    .from('job_cards')
    .select(`
      *,
      customers (
        customer_id,
        name,
        phone,
        gstin
      ),
      sales_invoices (
        invoice_id,
        invoice_no,
        invoice_date,
        total_amount,
        amount_paid,
        status,
        created_at
      )
    `)
    .order('created_at', { ascending: true });

  if (statusFilter && statusFilter !== 'all') {
    query = query.eq('status', statusFilter);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  // Format and annotate each job card with billing status
  const formattedData = (data || []).map((job) => {
    const activeInvoices = (job.sales_invoices || []).filter((inv) => inv.status !== 'void');
    const isBilled = activeInvoices.length > 0;
    const linkedInvoice = isBilled ? activeInvoices[0] : null;

    return {
      ...job,
      is_billed: isBilled,
      linked_invoice: linkedInvoice,
    };
  });

  // Filter client-side if a search query is provided to match description, customer name, job number, or invoice no
  if (searchQuery.trim()) {
    const cleanSearch = searchQuery.toLowerCase().trim();
    return formattedData.filter((job) => {
      const jcNum = `jc-${String(job.job_number || 0).padStart(4, '0')}`.toLowerCase();
      const rawNum = String(job.job_number || 0);
      const invNo = (job.linked_invoice?.invoice_no || '').toLowerCase();
      return (
        job.description?.toLowerCase().includes(cleanSearch) ||
        job.customers?.name?.toLowerCase().includes(cleanSearch) ||
        job.customers?.phone?.includes(cleanSearch) ||
        jcNum.includes(cleanSearch) ||
        rawNum.includes(cleanSearch) ||
        invNo.includes(cleanSearch)
      );
    });
  }

  if (!searchQuery.trim() && (!statusFilter || statusFilter === 'all')) {
    cachedJobCards = formattedData;
    lastFetchTimeJobCards = Date.now();
  }

  return formattedData;
};

export const getJobCardById = async (id) => {
  const { data, error } = await supabase
    .from('job_cards')
    .select(`
      *,
      customers (
        customer_id,
        name,
        phone,
        gstin
      ),
      sales_invoices (
        invoice_id,
        invoice_no,
        invoice_date,
        total_amount,
        amount_paid,
        status,
        created_at
      )
    `)
    .eq('job_id', id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const activeInvoices = (data.sales_invoices || []).filter((inv) => inv.status !== 'void');
  return {
    ...data,
    is_billed: activeInvoices.length > 0,
    linked_invoice: activeInvoices.length > 0 ? activeInvoices[0] : null,
  };
};

export const createJobCard = async (jobData) => {
  // Get active session user
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('job_cards')
    .insert([
      {
        customer_id: jobData.customer_id || null,
        description: jobData.description,
        quantity: parseFloat(jobData.quantity) || 1,
        status: jobData.status || 'New Orders',
        due_date: jobData.due_date || null,
        created_by: user?.id || null,
      },
    ])
    .select(`
      *,
      customers (
        customer_id,
        name,
        phone,
        gstin
      )
    `)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  invalidateJobCardsCache();
  return data;
};

export const updateJobCard = async (id, jobData) => {
  const { data, error } = await supabase
    .from('job_cards')
    .update({
      customer_id: jobData.customer_id || null,
      description: jobData.description,
      quantity: parseFloat(jobData.quantity) || 1,
      status: jobData.status,
      due_date: jobData.due_date || null,
    })
    .eq('job_id', id)
    .select(`
      *,
      customers (
        customer_id,
        name,
        phone,
        gstin
      )
    `)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  invalidateJobCardsCache();
  return data;
};

export const updateJobStatus = async (id, status) => {
  const { data, error } = await supabase
    .from('job_cards')
    .update({ status })
    .eq('job_id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  invalidateJobCardsCache();
  return data;
};

export const deleteJobCard = async (id) => {
  const { error } = await supabase
    .from('job_cards')
    .delete()
    .eq('job_id', id);

  if (error) {
    throw new Error(error.message);
  }

  invalidateJobCardsCache();
  return true;
};

export const getProductionTasks = async (forceRefresh = false) => {
  if (!forceRefresh && cachedProductionTasks && lastFetchTimeProductionTasks && (Date.now() - lastFetchTimeProductionTasks < CACHE_TTL)) {
    return cachedProductionTasks;
  }

  const { data, error } = await supabase
    .from('production_tasks')
    .select(`
      *,
      job_cards (
        job_id,
        description,
        customer_id,
        customers (
          name
        )
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  cachedProductionTasks = data || [];
  lastFetchTimeProductionTasks = Date.now();

  return cachedProductionTasks;
};

export const updateProductionTaskStatus = async (taskId, status) => {
  const { data, error } = await supabase
    .from('production_tasks')
    .update({ status })
    .eq('task_id', taskId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  invalidateProductionTasksCache();
  invalidateTaskProgressCache();
  return data;
};

export const advanceJobProductionTaskOnInvoice = async (jobId) => {
  if (!jobId) return;

  try {
    invalidateJobCardsCache();
    invalidateProductionTasksCache();
    invalidateTaskProgressCache();
  } catch (err) {
    console.error('Failed to advance job on invoice creation:', err);
  }
};

export const getJobCardsByCustomer = async (customerId) => {
  if (!customerId) return [];
  const { data, error } = await supabase
    .from('job_cards')
    .select(`
      *,
      customers (
        customer_id,
        name,
        phone,
        gstin
      ),
      sales_invoices (
        invoice_id,
        invoice_no,
        invoice_date,
        total_amount,
        amount_paid,
        status,
        created_at
      )
    `)
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map((job) => {
    const activeInvoices = (job.sales_invoices || []).filter((inv) => inv.status !== 'void');
    return {
      ...job,
      is_billed: activeInvoices.length > 0,
      linked_invoice: activeInvoices.length > 0 ? activeInvoices[0] : null,
    };
  });
};


