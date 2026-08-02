import { supabase } from '../../lib/supabaseClient';

export const getCompanySettings = async () => {
  const { data, error } = await supabase
    .from('company_settings')
    .select('*')
    .limit(1)
    .single();
    
  if (error && error.code !== 'PGRST116') { // PGRST116 means no rows returned
    throw new Error(error.message);
  }
  
  return data || null;
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
    return data;
  } else {
    const { data, error } = await supabase
      .from('company_settings')
      .insert([payload])
      .select()
      .single();
      
    if (error) throw new Error(error.message);
    return data;
  }
};
