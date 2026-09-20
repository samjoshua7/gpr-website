import { supabase } from '../../lib/supabaseClient';
import { deleteStorageFileIfUnreferenced, deleteStorageFileDirectly } from '../../lib/storageUtils';

// ==========================================
// Product Categories API
// ==========================================

export const getCategories = async (includeInactive = true) => {
  let query = supabase
    .from('product_categories')
    .select('*')
    .order('display_order', { ascending: true })
    .order('name', { ascending: true });

  if (!includeInactive) {
    query = query.eq('active', true);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
};

export const createCategory = async (categoryData) => {
  const payload = {
    name: categoryData.name?.trim(),
    slug: categoryData.slug?.trim() || categoryData.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    description: categoryData.description?.trim() || null,
    icon: categoryData.icon?.trim() || null,
    display_order: Number(categoryData.display_order) || 0,
    parent_category_id: categoryData.parent_category_id || null,
    active: categoryData.active !== undefined ? categoryData.active : true,
  };

  const { data, error } = await supabase
    .from('product_categories')
    .insert([payload])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};

export const updateCategory = async (categoryId, categoryData) => {
  const payload = {
    name: categoryData.name?.trim(),
    slug: categoryData.slug?.trim(),
    description: categoryData.description?.trim() || null,
    icon: categoryData.icon?.trim() || null,
    display_order: Number(categoryData.display_order) || 0,
    parent_category_id: categoryData.parent_category_id || null,
    active: categoryData.active !== undefined ? categoryData.active : true,
  };

  const { data, error } = await supabase
    .from('product_categories')
    .update(payload)
    .eq('category_id', categoryId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};

export const deleteCategory = async (categoryId) => {
  const { error } = await supabase
    .from('product_categories')
    .delete()
    .eq('category_id', categoryId);

  if (error) throw new Error(error.message);
  return true;
};

// ==========================================
// Products API
// ==========================================

export const getProducts = async ({ categoryId = null, searchQuery = '', includeInactive = true } = {}) => {
  let query = supabase
    .from('products')
    .select(`
      *,
      category:product_categories(category_id, name, slug)
    `)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (!includeInactive) {
    query = query.eq('is_active', true);
  }

  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  if (searchQuery && searchQuery.trim()) {
    const clean = searchQuery.trim();
    query = query.or(`name.ilike.%${clean}%,short_description.ilike.%${clean}%,slug.ilike.%${clean}%`);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
};

export const getProductById = async (productId) => {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      category:product_categories(category_id, name, slug),
      images:product_images(*),
      options:product_options(
        *,
        values:product_option_values(*)
      ),
      tiers:product_quantity_tiers(*)
    `)
    .eq('product_id', productId)
    .single();

  if (error) throw new Error(error.message);
  return data;
};

export const createProduct = async (productData) => {
  const payload = {
    category_id: productData.category_id || null,
    name: productData.name?.trim(),
    slug: productData.slug?.trim() || productData.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    short_description: productData.short_description?.trim() || null,
    description: productData.description?.trim() || null,
    base_price: parseFloat(productData.base_price) || 0.00,
    min_quantity: parseInt(productData.min_quantity, 10) || 1,
    main_image_url: productData.main_image_url || null,
    is_featured: Boolean(productData.is_featured),
    is_active: productData.is_active !== undefined ? Boolean(productData.is_active) : true,
    display_order: parseInt(productData.display_order, 10) || 0,
  };

  const { data, error } = await supabase
    .from('products')
    .insert([payload])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};

export const updateProduct = async (productId, productData) => {
  const payload = {
    category_id: productData.category_id || null,
    name: productData.name?.trim(),
    slug: productData.slug?.trim(),
    short_description: productData.short_description?.trim() || null,
    description: productData.description?.trim() || null,
    base_price: parseFloat(productData.base_price) || 0.00,
    min_quantity: parseInt(productData.min_quantity, 10) || 1,
    main_image_url: productData.main_image_url || null,
    is_featured: Boolean(productData.is_featured),
    is_active: productData.is_active !== undefined ? Boolean(productData.is_active) : true,
    display_order: parseInt(productData.display_order, 10) || 0,
  };

  const { data, error } = await supabase
    .from('products')
    .update(payload)
    .eq('product_id', productId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};

export const deleteProduct = async (productId) => {
  // 1. Fetch current image URL before deleting record
  const { data: prod } = await supabase
    .from('products')
    .select('main_image_url')
    .eq('product_id', productId)
    .maybeSingle();

  // 2. Delete product record from database
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('product_id', productId);

  if (error) throw new Error(error.message);

  // 3. Clean up storage image only if it is not referenced elsewhere (e.g. historical orders)
  if (prod?.main_image_url) {
    await deleteStorageFileIfUnreferenced(prod.main_image_url, 'product-images');
  }

  return true;
};

// ==========================================
// Product Options & Values Management
// ==========================================

export const getProductOptions = async (productId) => {
  const { data, error } = await supabase
    .from('product_options')
    .select(`
      *,
      values:product_option_values(*)
    `)
    .eq('product_id', productId)
    .order('display_order', { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
};

export const saveProductOptions = async (productId, optionsList) => {
  // Delete existing options for this product (cascades to option values)
  const { error: delError } = await supabase
    .from('product_options')
    .delete()
    .eq('product_id', productId);

  if (delError) throw new Error(delError.message);

  if (!optionsList || optionsList.length === 0) {
    return [];
  }

  // Re-insert options and values
  for (let i = 0; i < optionsList.length; i++) {
    const opt = optionsList[i];
    const { data: newOpt, error: optError } = await supabase
      .from('product_options')
      .insert([{
        product_id: productId,
        name: opt.name?.trim(),
        display_order: i + 1,
        is_required: opt.is_required !== undefined ? opt.is_required : true,
      }])
      .select()
      .single();

    if (optError) throw new Error(optError.message);

    if (opt.values && opt.values.length > 0) {
      const valuesPayload = opt.values.map((v, valIdx) => ({
        option_id: newOpt.option_id,
        label: v.label?.trim(),
        price_adjustment: parseFloat(v.price_adjustment) || 0.00,
        display_order: valIdx + 1,
        is_default: Boolean(v.is_default),
      }));

      const { error: valError } = await supabase
        .from('product_option_values')
        .insert(valuesPayload);

      if (valError) throw new Error(valError.message);
    }
  }

  return await getProductOptions(productId);
};

// ==========================================
// Product Pricing Tiers Management
// ==========================================

export const getProductTiers = async (productId) => {
  const { data, error } = await supabase
    .from('product_quantity_tiers')
    .select('*')
    .eq('product_id', productId)
    .order('min_quantity', { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
};

export const saveProductTiers = async (productId, tiersList) => {
  // Delete existing tiers for this product
  const { error: delError } = await supabase
    .from('product_quantity_tiers')
    .delete()
    .eq('product_id', productId);

  if (delError) throw new Error(delError.message);

  if (!tiersList || tiersList.length === 0) {
    return [];
  }

  const payload = tiersList.map((tier) => ({
    product_id: productId,
    min_quantity: parseInt(tier.min_quantity, 10),
    max_quantity: tier.max_quantity ? parseInt(tier.max_quantity, 10) : null,
    price_per_unit: parseFloat(tier.price_per_unit) || 0.00,
  }));

  const { data, error } = await supabase
    .from('product_quantity_tiers')
    .insert(payload)
    .select();

  if (error) throw new Error(error.message);
  return data || [];
};

// ==========================================
// Product Images & Storage Management
// ==========================================

export const uploadProductImage = async (file) => {
  const fileExt = file.name.split('.').pop();
  const cleanName = file.name.replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `prod_${Date.now()}_${cleanName.slice(0, 20)}.${fileExt}`;
  const filePath = fileName;

  const { error } = await supabase.storage
    .from('product-images')
    .upload(filePath, file, { upsert: true });

  if (error) throw new Error(error.message);

  const { data: publicUrlData } = supabase.storage
    .from('product-images')
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
};

export const deleteProductImageFromStorage = async (url, exclude = {}) => {
  return await deleteStorageFileIfUnreferenced(url, 'product-images', exclude);
};

export const rollbackUploadedProductImage = async (url) => {
  return await deleteStorageFileDirectly(url, 'product-images');
};

export const uploadHeroBannerImage = async (file) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `banner_${Date.now()}.${fileExt}`;
  const filePath = fileName;

  const { error } = await supabase.storage
    .from('hero-banners')
    .upload(filePath, file, { upsert: true });

  if (error) throw new Error(error.message);

  const { data: publicUrlData } = supabase.storage
    .from('hero-banners')
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
};
