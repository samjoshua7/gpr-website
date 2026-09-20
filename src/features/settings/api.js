import { supabase } from '../../lib/supabaseClient';

const SETTINGS_CACHE_KEY = 'gpr_company_settings_cache_v1';
const CACHE_TTL = 5 * 60 * 1000;

let cachedSettings = null;
let lastFetchTimeSettings = null;
let cacheGenerationSettings = 0;
let pendingSettingsRequest = null;

try {
  const persistedCache = localStorage.getItem(SETTINGS_CACHE_KEY);
  if (persistedCache) {
    const parsedCache = JSON.parse(persistedCache);
    if (
      parsedCache?.settings &&
      Number.isFinite(parsedCache.fetchedAt) &&
      Date.now() - parsedCache.fetchedAt < CACHE_TTL
    ) {
      cachedSettings = parsedCache.settings;
      lastFetchTimeSettings = parsedCache.fetchedAt;
    }
  }
} catch {
  // Storage is optional; the in-memory cache and Supabase remain available.
}

const cacheCompanySettings = (settings) => {
  cachedSettings = settings || null;
  lastFetchTimeSettings = Date.now();

  try {
    if (cachedSettings) {
      localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify({
        settings: cachedSettings,
        fetchedAt: lastFetchTimeSettings,
      }));
    } else {
      localStorage.removeItem(SETTINGS_CACHE_KEY);
    }
  } catch {
    // Ignore storage failures and retain the in-memory cache.
  }
};

export const getCachedCompanySettings = () => cachedSettings;

export const invalidateSettingsCache = () => {
  cacheGenerationSettings++;
  cachedSettings = null;
  lastFetchTimeSettings = null;
  pendingSettingsRequest = null;

  try {
    localStorage.removeItem(SETTINGS_CACHE_KEY);
  } catch {
    // Storage cleanup is best-effort.
  }
};

export const getCompanySettings = async (forceRefresh = false) => {
  if (
    !forceRefresh &&
    cachedSettings &&
    lastFetchTimeSettings &&
    Date.now() - lastFetchTimeSettings < CACHE_TTL
  ) {
    return cachedSettings;
  }

  if (pendingSettingsRequest) {
    return pendingSettingsRequest;
  }

  const fetchGeneration = cacheGenerationSettings;
  pendingSettingsRequest = (async () => {
    const { data, error } = await supabase
      .from('company_settings')
      .select('*')
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(error.message);
    }

    if (cacheGenerationSettings === fetchGeneration) {
      cacheCompanySettings(data || null);
    }
    return data || null;
  })();

  try {
    return await pendingSettingsRequest;
  } finally {
    pendingSettingsRequest = null;
  }
};

export const updateCompanySettings = async (id, payload) => {
  const query = id
    ? supabase.from('company_settings').update(payload).eq('setting_id', id)
    : supabase.from('company_settings').insert([payload]);

  const { data, error } = await query.select().single();
  if (error) throw new Error(error.message);

  cacheGenerationSettings++;
  cacheCompanySettings(data);
  return data;
};

export const uploadCompanyAsset = async (file, type) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${type}_${Date.now()}.${fileExt}`;
  const filePath = fileName;

  const { error } = await supabase.storage
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


