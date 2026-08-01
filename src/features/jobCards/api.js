import { supabase } from '../../lib/supabaseClient';

export const getJobCards = async (searchQuery = '', statusFilter = '') => {
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

  return true;
};

export const getProductionTasks = async () => {
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

  return data || [];
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

  return data;
};

