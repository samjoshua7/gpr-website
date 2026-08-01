import { supabase } from '../../lib/supabaseClient';

export const getItems = async (searchQuery = '') => {
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

  if (searchQuery.trim()) {
    const cleanSearch = searchQuery.toLowerCase().trim();
    return data.filter(
      (item) =>
        item.name?.toLowerCase().includes(cleanSearch) ||
        item.hsn_code?.toLowerCase().includes(cleanSearch)
    );
  }

  return data || [];
};

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

  return data;
};
