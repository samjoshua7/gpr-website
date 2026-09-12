import { supabase } from '../../lib/supabaseClient';

let cachedEmployees = null;
let lastFetchTimeEmployees = null;
let cacheGenerationEmployees = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const getCachedEmployees = () => cachedEmployees;

export const invalidateEmployeesCache = () => {
  cacheGenerationEmployees++;
  lastFetchTimeEmployees = null;
};
export const getEmployees = async (forceRefresh = false) => {
  const fetchGen = cacheGenerationEmployees;
  if (!forceRefresh && cachedEmployees && lastFetchTimeEmployees && (Date.now() - lastFetchTimeEmployees < CACHE_TTL)) {
    return cachedEmployees;
  }

  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .order('name');
    
  if (error) throw new Error(error.message);
  
  if (cacheGenerationEmployees === fetchGen) {
    cachedEmployees = data || [];
    lastFetchTimeEmployees = Date.now();
  }
  return data || [];
};

export const createEmployee = async (payload) => {
  const sanitizedPayload = {
    ...payload,
    ...(payload.email ? { email: payload.email.trim().toLowerCase() } : {}),
  };

  const { data, error } = await supabase
    .from('employees')
    .insert([sanitizedPayload])
    .select()
    .single();
    
  if (error) throw new Error(error.message);
  invalidateEmployeesCache();
  return data;
};

export const updateEmployee = async (id, payload) => {
  const sanitizedPayload = {
    ...payload,
    ...(payload.email ? { email: payload.email.trim().toLowerCase() } : {}),
  };

  const { data, error } = await supabase
    .from('employees')
    .update(sanitizedPayload)
    .eq('employee_id', id)
    .select()
    .single();
    
  if (error) throw new Error(error.message);
  invalidateEmployeesCache();
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
  invalidateEmployeesCache();
  return data;
};

export const deleteEmployee = async (id) => {
  const { error } = await supabase
    .from('employees')
    .delete()
    .eq('employee_id', id);
    
  if (error) throw new Error(error.message);
  invalidateEmployeesCache();
  return true;
};
