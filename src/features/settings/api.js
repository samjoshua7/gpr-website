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
