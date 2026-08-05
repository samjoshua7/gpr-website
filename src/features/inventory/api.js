import { supabase } from '../../lib/supabaseClient';

let cachedItems = null;
let lastFetchTimeItems = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const invalidateItemsCache = () => {
  cachedItems = null;
  lastFetchTimeItems = null;
};
export const getItems = async (searchQuery = '', forceRefresh = false) => {
  if (!forceRefresh && cachedItems && !searchQuery && lastFetchTimeItems && (Date.now() - lastFetchTimeItems < CACHE_TTL)) {
    return cachedItems;
  }

  const { data, error } = await supabase
    .from('items')
    .select(`
      *,
      tax_rates (
        tax_rate_id,
        tax_name,
        percentage
      )
    `)
    .order('name', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  if (!searchQuery.trim()) {
    cachedItems = data || [];
    lastFetchTimeItems = Date.now();
  }

  return data || [];
};

export const getInventoryItems = getItems;

export const createItem = async (itemData) => {
  const { data, error } = await supabase
    .from('items')
    .insert([
      {
        name: itemData.name,
        unit: itemData.unit,
        unit_price: parseFloat(itemData.unit_price || 0),
        reorder_level: parseFloat(itemData.reorder_level || 0),
        tax_rate_id: itemData.tax_rate_id || null,
        hsn_code: itemData.hsn_code || null,
        active: itemData.active !== false,
      },
    ])
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  invalidateItemsCache();
  return data;
};

export const updateItem = async (itemId, itemData) => {
  const { data, error } = await supabase
    .from('items')
    .update({
      name: itemData.name,
      unit: itemData.unit,
      unit_price: parseFloat(itemData.unit_price || 0),
      reorder_level: parseFloat(itemData.reorder_level || 0),
      tax_rate_id: itemData.tax_rate_id || null,
      hsn_code: itemData.hsn_code || null,
      active: itemData.active,
    })
    .eq('item_id', itemId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  invalidateItemsCache();
  return data;
};

export const deleteItem = async (itemId) => {
  const { error } = await supabase
    .from('items')
    .delete()
    .eq('item_id', itemId);

  if (error) {
    throw new Error(error.message);
  }

  invalidateItemsCache();
  return true;
};

/**
 * Creates manual stock adjustments in database
 */
export const adjustStock = async (itemId, type, quantity) => {
  const { data, error } = await supabase
    .from('stock_transactions')
    .insert([
      {
        item_id: itemId,
        type,
        quantity: parseFloat(quantity),
        reference_type: 'manual',
      },
    ])
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  invalidateItemsCache();
  return data;
};
