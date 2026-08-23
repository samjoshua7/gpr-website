import { supabase } from '../../lib/supabaseClient';

let cachedSettings = null;
let lastFetchTimeSettings = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const invalidateSettingsCache = () => {
  cachedSettings = null;
  lastFetchTimeSettings = null;
};
export const getCompanySettings = async (forceRefresh = false) => {
  if (!forceRefresh && cachedSettings && lastFetchTimeSettings && (Date.now() - lastFetchTimeSettings < CACHE_TTL)) {
    return cachedSettings;
  }

  const { data, error } = await supabase
    .from('company_settings')
    .select('*')
    .limit(1)
    .single();
    
  if (error && error.code !== 'PGRST116') { // PGRST116 means no rows returned
    throw new Error(error.message);
  }
  
  cachedSettings = data || null;
  lastFetchTimeSettings = Date.now();
  return cachedSettings;
};

export const updateCompanySettings = async (id, payload) => {
  if (id) {
    const { data, error } = await supabase
      .from('company_settings')
      .update(payload)
      .eq('setting_id', id)
      .select()
      .single();
      
    if (error) throw new Error(error.message);
    invalidateSettingsCache();
    return data;
  } else {
    const { data, error } = await supabase
      .from('company_settings')
      .insert([payload])
      .select()
      .single();
      
    if (error) throw new Error(error.message);
    invalidateSettingsCache();
    return data;
  }
};

export const uploadCompanyAsset = async (file, type) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${type}_${Date.now()}.${fileExt}`;
  const filePath = fileName;

  const { data, error } = await supabase.storage
    .from('company-assets')
    .upload(filePath, file, { upsert: true });

  if (error) throw new Error(error.message);

  const { data: publicUrlData } = supabase.storage
    .from('company-assets')
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
};

export const getJobCardsCountByDepartment = async (departmentName) => {
  if (!departmentName) return 0;
  const { count, error } = await supabase
    .from('job_cards')
    .select('job_id', { count: 'exact', head: true })
    .eq('status', departmentName);

  if (error) {
    console.error('Error fetching job card count for department:', error);
    return 0;
  }
  return count || 0;
};

export const reassignJobCardsDepartment = async (oldDept, newDept) => {
  if (!oldDept || !newDept || oldDept === newDept) return;
  const { error } = await supabase
    .from('job_cards')
    .update({ status: newDept })
    .eq('status', oldDept);

  if (error) {
    throw new Error(`Failed to reassign job cards: ${error.message}`);
  }
};


