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
        name
      )
    `)
    .order('due_date', { ascending: true, nullsFirst: false });

  if (statusFilter && statusFilter !== 'all') {
    query = query.eq('status', statusFilter);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  // Filter client-side if a search query is provided to match both description and customer name
  if (searchQuery.trim()) {
    const cleanSearch = searchQuery.toLowerCase().trim();
    return data.filter(
      (job) =>
        job.description?.toLowerCase().includes(cleanSearch) ||
        job.customers?.name?.toLowerCase().includes(cleanSearch)
    );
  }

  if (!searchQuery.trim() && (!statusFilter || statusFilter === 'all')) {
    cachedJobCards = data;
    lastFetchTimeJobCards = Date.now();
  }

  return data;
};

export const getJobCardById = async (id) => {
  const { data, error } = await supabase
    .from('job_cards')
    .select(`
      *,
      customers (
        name
      )
    `)
    .eq('job_id', id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const createJobCard = async (jobData) => {
  // Get active session user
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('job_cards')
    .insert([
      {
        customer_id: jobData.customer_id,
        description: jobData.description,
        quantity: parseFloat(jobData.quantity),
        status: jobData.status || 'pending',
        due_date: jobData.due_date || null,
        created_by: user?.id || null,
      },
    ])
    .select()
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
      customer_id: jobData.customer_id,
      description: jobData.description,
      quantity: parseFloat(jobData.quantity),
      status: jobData.status,
      due_date: jobData.due_date || null,
    })
    .eq('job_id', id)
    .select()
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

/**
 * Auto-advances the production task/stage of a job card when a sales invoice is created.
 */
export const advanceJobProductionTaskOnInvoice = async (jobId) => {
  if (!jobId) return;

  try {
    const { data: settingsData } = await supabase
      .from('company_settings')
      .select('production_workflow')
      .single();

    const workflow = settingsData?.production_workflow || [
      'New Orders',
      'Designing',
      'Proof',
      'Printing',
      'Additional works',
      'Cutting',
      'Packing',
      'Out for Delivery',
      'Delivered',
    ];

    const { data: tasks } = await supabase
      .from('production_tasks')
      .select('*')
      .eq('job_id', jobId);

    if (tasks && tasks.length > 0) {
      for (const task of tasks) {
        const currIdx = workflow.indexOf(task.status);
        const nextIdx = currIdx >= 0 ? currIdx + 1 : 1;
        if (nextIdx < workflow.length) {
          const nextStatus = workflow[nextIdx];
          await supabase
            .from('production_tasks')
            .update({ status: nextStatus })
            .eq('task_id', task.task_id);
        }
      }
    } else {
      const initialStatus = workflow[1] || 'Designing';
      const { data: job } = await supabase
        .from('job_cards')
        .select('description, quantity')
        .eq('job_id', jobId)
        .single();

      await supabase.from('production_tasks').insert([
        {
          job_id: jobId,
          product_name: job?.description || 'Print Task',
          quantity: job?.quantity || 1,
          status: initialStatus,
        },
      ]);
    }

    await supabase
      .from('job_cards')
      .update({ status: 'in_progress' })
      .eq('job_id', jobId);

    invalidateProductionTasksCache();
    invalidateJobCardsCache();
    invalidateTaskProgressCache();
  } catch (err) {
    console.error('Failed to auto-advance job stage on invoice creation:', err);
  }
};

