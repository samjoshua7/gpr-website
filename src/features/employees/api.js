import { supabase } from '../../lib/supabaseClient';

export const getEmployees = async () => {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .order('name');
    
  if (error) throw new Error(error.message);
  return data || [];
};

export const createEmployee = async (payload) => {
  const { data, error } = await supabase
    .from('employees')
    .insert([payload])
    .select()
    .single();
    
  if (error) throw new Error(error.message);
  return data;
};

export const updateEmployee = async (id, payload) => {
  const { data, error } = await supabase
    .from('employees')
    .update(payload)
    .eq('employee_id', id)
    .select()
    .single();
    
  if (error) throw new Error(error.message);
  return data;
};

export const toggleEmployeeStatus = async (id, isActive) => {
  const { data, error } = await supabase
    .from('employees')
    .update({ active: isActive })
    .eq('employee_id', id)
    .select()
    .single();
    
  if (error) throw new Error(error.message);
  return data;
};

export const deleteEmployee = async (id) => {
  const { error } = await supabase
    .from('employees')
    .delete()
    .eq('employee_id', id);
    
  if (error) throw new Error(error.message);
  return true;
};
